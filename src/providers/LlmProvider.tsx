import {
  competenciesWithIncidactors,
  Competency,
  feedback,
  Indicator,
} from "@/lib/types";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import ollama from "ollama";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import { ZodError } from "zod";
import { useFeedback } from "./FeedbackProvider";

const model = "llama3.1";
const embeddingsModel = "mxbai-embed-large";

// TODO: allow the user to select model and params
const llm = new Ollama({
  model: model,
  numCtx: 1000,
  format: "json",
});

// TODO: allow the user to set the embeddings model params
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 20,
});

const competencies = competenciesWithIncidactors.map((competency): string => {
  let text = ``;
  text += `# Competency: ${competency.name.replaceAll("-", " ")} (${competency.abbreviation})`;
  text += `\n`;
  text += competency.description;
  text += `\n\n`;

  competency.indicators.forEach((indicator) => {
    text += `## Indicator: ${indicator.name}`;
    text += `\n`;
    text += indicator.description;
    text += `\n\n`;

    text += `### Expectations`;
    text += `\n`;
    text += indicator.expectations;
    text += `\n\n`;

    text += `### Grading`;
    text += `\n\n`;

    indicator.grades.forEach((grade) => {
      text += `#### Grade: ${grade.grade}`;
      text += `\n`;

      grade.expectations.forEach((expectation) => {
        text += `- ${expectation}`;
        text += `\n`;
      });
      text += `\n`;
    });
  });

  return text;
});

const systemTemplate = `
  # IDENTITY and PURPOSE
  You are acting as a assessor for a masters program of digital design.
  You will be giving constructive feedback on the students text for them to improve upon.
  You are allowed to be very critical as the grading and feedback is for a masters program.

  # STEPS
  1. Internalise the indicators and the requirements to reach each level of grading
  2. Read thouroughly through the documents and find where in the grading matrix the student fits in
  3. Grade the student on the indicator with a novice, competent, proficient or visionary
  4. Give the student constructive feedback, positive aspects and areas for improvement.

  # OUTPUT INSTRUCTIONS
  - It is REQUIRED to give a grade. This grade can be either: novice, competent, proficient or visionary.
  - The feedback given should only reflect the texts given from the students' document, do not make assumptions or give feedback on things not mentioned in the text.
  - Whenever the grade is novice or competent, you should try to give a more in dept-feedback to allow the student to towards a higher grade.

  # EXAMPLE OUTPUTS
  {{
    "grade": "novice",
    "feedback": "Your evolution, coming from a branding/advertising background but introducing a more “scientific” method has been super interesting to witness. We are glad that you have kept your fast intuitive decision making, but have also embraced the value of research, especially in non-commercial settings which require a different approach.",
    "positive_aspects": [
      "You have shown a commendable effort in pursuing your learning goals and relating them to your development. We appreciate the presentation that you have given us, and we think that it was a very strong example of self-directed learning. Your ethical standpoint clearly shines though.",
      "Your exploration of ideas, technologies, and communities relevant to your work is evident and purposeful. You have demonstrated a systematic approach, actively connecting your explorations to your project. We applaud the consolation with different businessowners, and visually impaired people really helped your project forward. Highlighting the impact of these explorations on your personal development and future goals could enhance your reflection and really put you on an advantage as a designer (pun intended).",
    ],
    "areas_for_improvement": [
      "What we would like you to explore after the MDD is larger team dynamics, this will help you into a role of art director (which we can see is suiting for you if you want it to)",
      "Actively engaging with stakeholders throughout the project helped your design process. However, a more exhaustive analysis of indirect stakeholders and unintended consequences could provide deeper insights. Overall, your comprehensive approach to stakeholder engagement strengthened the project's relevance and impact especially for the SDL and the Climbing project. We believe that you could have spent a little more time on creating a more nuanced view on the stakeholders. Not all people are likely to move to a new developed city part, it is often a subset of the City's population. With a more specific analysis you could have reached better design decisions."
    ]
  }}

  {{
    "grade": "proficient",
    "feedback": "Your annotated portfolio demonstrates a solid foundation in self-directed learning, particularly through your reflections on the methods used to achieve your goals, showcasing an understanding of your own learning processes. You effectively articulate your progress and future goals, relating them to a broader perspective, which shows your long-term vision. Your systematic approach and diverse research methods to understand the needs of visually impaired climbers are great, resulting in innovative solutions.",
    "positive_aspects": [
      "The choice of making the Havenstad project into a game where you play a stakeholder is an interesting take on a complex multi-stakeholder project like the one in the brief. It’s an interesting and promising approach and would have liked to see it validated by stakeholders themselves to understand if this could be a potential research method for future projects involving multi-stakeholder projects. ",
      "Your comment during the interview about how oversimplication can kill a project is very insightful and shows that you have a sophisticate understanding of what design can do to address complex topics. This kind of mentality is very much needed in our profession, keep it up!",
    ],
    "areas_for_improvement": [
      "We see that you have expanded your knowledge in this area quite broadly. It would be good if you expand your range of references as well as you learn new techniques. We missed better evidence for the conventions indicator. Understanding how others addressed similar design challenges in the past can help you adopt these more conventional approaches when you need them and depart from them when they do not help you. ",
      "You did not provide concrete examples of how you addressed potential unintended consequences and ensured user autonomy. When you compare your work to other work, more explicit identification of strong and weak points and how you plan to address them would provide clearer directions for future iterations."
    ]
  }}

  # CONTEXT
  Use the following pieces of retrieved context to help you give a grade and provide feedback
  {context}
  `;

type LmmContext = {
  addStudentDocuments: (
    input: { fileName: string; data: string }[],
  ) => Promise<void>;
  getGrading: (
    competency: Competency,
    indicator: Pick<Indicator, "name">,
    triesLeft?: number,
  ) => void;
};
const LlmContext = createContext<LmmContext>({
  addStudentDocuments: async () => {
    console.error("addStudentDocument not implemented");
  },
  getGrading: async () => {
    console.error("getGradingTemplate not implemented");
  },
});

export function LlmProvider(props: PropsWithChildren) {
  const [documents, setDocuments] = useLocalStorage<Document[]>(
    "documents",
    [],
  );

  const { addFeedback } = useFeedback();

  const runnable = useRef<Runnable | null>(null);
  const vectorStore = useRef<MemoryVectorStore | null>(null);

  const addStudentDocuments = useCallback(
    async (input: { fileName: string; data: string }[]) => {
      console.log("Adding student document", input);
      const texts = input.map(({ data }) => data);
      const meta = input.map(({ fileName }) => ({
        fileName,
        type: "student document",
      }));
      const documents = await textSplitter.createDocuments(texts, meta);
      console.log("Adding documents", documents);
      await vectorStore.current?.addDocuments(documents);
      setDocuments((prev) => [...prev, ...documents]);
    },
    [],
  );

  const removeStudentDocuments = useCallback(
    (input: { fileName: string }[]) => {
      // TODO: figure out how to remove documents
      // https://js.langchain.com/docs/integrations/vectorstores/memory/
      // https://v03.api.js.langchain.com/classes/_langchain_core.stores.InMemoryStore.html#mdelete
      // seems like https://js.langchain.com/docs/integrations/vectorstores/chroma/#delete-items-from-vector-store
      vectorStore.current?.delete({
        fileName: input.map(({ fileName }) => fileName),
      });
    },
    [],
  );

  const getGrading = useCallback(
    async (
      competency: Competency,
      indicator: Pick<Indicator, "name">,
      triesLeft = 20, // TODO: this mostly fails because the `grade` is not present in the resonse, a better prompt will help
    ) => {
      while (!runnable.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const query = `could you please grade and give feedback to the student for ${indicator.name}`;

      console.log("query", query);

      try {
        const result = await runnable.current.invoke({ input: query });
        const json = JSON.parse(result.answer);

        console.log("result", result);
        const data = feedback.parse(json);
        addFeedback(competency, indicator.name, data);
      } catch (error) {
        if (error instanceof ZodError) {
          console.log("TODO: fix ollama response error", error.errors);
        }

        console.log("TODO: fix ollama error", error);

        if (!triesLeft) {
          console.error("Failed to get grading for", competency, indicator);
          return;
        }

        console.warn("tries left", triesLeft, indicator.name);
        getGrading(competency, indicator, triesLeft - 1);
      }
    },
    [runnable.current, addFeedback],
  );

  useEffect(() => {
    // TODO: make the user select models
    ollama.pull({ model: model }).then(console.log).catch(console.error);
    ollama
      .pull({ model: embeddingsModel })
      .then(console.log)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (vectorStore.current) return;

    createVectorStore(documents)
      .then((store) => {
        console.log("Vector store created", store);
        vectorStore.current = store;
        createRunner(store)
          .then((runner) => {
            console.log("Runner created", runner);
            runnable.current = runner;
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, [documents]);

  return (
    <LlmContext.Provider
      value={{
        addStudentDocuments,
        getGrading,
      }}
    >
      {props.children}
    </LlmContext.Provider>
  );
}

export function useLlm() {
  return useContext(LlmContext);
}

async function createVectorStore(initialDocuments: Document[] = []) {
  const splitDocs = await textSplitter.createDocuments(
    competencies,
    competencies.map(() => ({ type: "competency and indicators" })),
  );

  return MemoryVectorStore.fromDocuments(
    [...splitDocs, ...initialDocuments],
    new OllamaEmbeddings({ model: embeddingsModel }),
  );
}

async function createRunner(vectorStore: MemoryVectorStore) {
  const retriever = vectorStore.asRetriever();

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  return createRetrievalChain({
    retriever,
    combineDocsChain: questionAnswerChain,
  });
}
