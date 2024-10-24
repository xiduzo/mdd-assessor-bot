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
import ollama, { ModelResponse } from "ollama";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { ZodError } from "zod";
import { useFeedback } from "./FeedbackProvider";

// TODO: allow the user to set the embeddings model params
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 20,
});

const competencies = competenciesWithIncidactors.map(
  (competency): { name: Competency; text: string } => {
    let text = ``;
    text += `# Competency: ${competency.name} (${competency.abbreviation})`;
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

    return { name: competency.name, text };
  },
);

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
  - When no evidence has been provided for an indicator, the grade should be novice and your feedback should indicate the lack of evidence.
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

export type DocumentMetaData = Pick<File, "name" | "lastModified"> & {
  type: "student document" | "grading template";
};

type AddDocumentInput = Omit<DocumentMetaData, "type"> & { text: string };

type LmmContextType = {
  addStudentDocuments: (input: AddDocumentInput[]) => Promise<void>;
  removeStudentDocuments: (input: Pick<File, "name">[]) => void;
  documents: Document<DocumentMetaData>[];
  models: ModelResponse[];
  model: string;
  setModel: (model: string) => void;
  embeddings: string;
  setEmbeddings: (embeddings: string) => void;
  status: "initializing" | "initialized" | "error" | undefined;
  getGrading: (
    competency: Competency,
    indicator: Pick<Indicator, "name">,
    triesLeft?: number,
  ) => Promise<void>;
};

const LlmContext = createContext<LmmContextType>({
  addStudentDocuments: async () => {
    throw new Error("addStudentDocument not implemented");
  },
  removeStudentDocuments: async () => {
    throw new Error("removeStudentDocument not implemented");
  },
  status: "initializing",
  documents: [],
  models: [],
  model: "not-set",
  setModel: () => {
    throw new Error("setModel not implemented");
  },
  embeddings: "not-set",
  setEmbeddings: () => {
    throw new Error("setEmbeddings not implemented");
  },
  getGrading: async () => {
    throw new Error("getGradingTemplate not implemented");
  },
});

export function LlmProvider(props: PropsWithChildren) {
  const [documents, setDocuments, clearDocuments] = useLocalStorage<
    Document<DocumentMetaData>[]
  >("documents", []);
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [status, setStatus] = useState<LmmContextType["status"]>();
  const [model, setLocalModel] = useLocalStorage("model", "llama3.1:latest");
  const [embeddings, setLocalEmbedding] = useLocalStorage(
    "embeddings",
    "mxbai-embed-large:latest",
  );

  const { setFeedback } = useFeedback();

  useEffect(() => {
    const shouldClear = false;

    if (!shouldClear) return;
    clearDocuments();
  }, [clearDocuments]);

  const runnable = useRef<Runnable | null>(null);
  const vectorStore = useRef<MemoryVectorStore | null>(null);

  const removeStudentDocuments = useCallback(
    async (documents: Pick<File, "name">[]) => {
      const fileNamesToDelete = documents.map(({ name }) => name);
      // TODO: figure out how to properly remove documents
      // https://js.langchain.com/docs/integrations/vectorstores/memory/
      // https://v03.api.js.langchain.com/classes/_langchain_core.stores.InMemoryStore.html#mdelete
      // seems like https://js.langchain.com/docs/integrations/vectorstores/chroma/#delete-items-from-vector-store
      if (vectorStore.current) {
        // This is a hack to remove the vectors from the memory store
        vectorStore.current.memoryVectors =
          vectorStore.current.memoryVectors.filter(
            (vector) => !fileNamesToDelete.includes(vector.metadata.name),
          );
      }
      setDocuments((prev) =>
        prev.filter(
          (document) => !fileNamesToDelete.includes(document.metadata.name),
        ),
      );
    },
    [],
  );

  const addStudentDocuments = useCallback(
    async (files: AddDocumentInput[]) => {
      await removeStudentDocuments(files);
      console.log("files", files);
      const texts = files.map(({ text }) => text);
      const meta = files.map(
        (file): DocumentMetaData => ({
          name: file.name,
          lastModified: file.lastModified,
          type: "student document",
        }),
      );
      const documents = await textSplitter.createDocuments(texts, meta);
      await vectorStore.current?.addDocuments(documents);
      setDocuments((prev) => [
        ...prev,
        ...(documents as Document<DocumentMetaData>[]),
      ]);
    },
    [removeStudentDocuments],
  );

  const getGrading = useCallback(
    async (
      competency: Competency,
      indicator: Pick<Indicator, "name">,
      triesLeft = 20, // TODO: this mostly fails because the `grade` is not present in the resonse, a better prompt will help
    ) => {
      if (!documents.length) return;
      while (!runnable.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const query = `could you please grade and give feedback to the student for the competency ${competency}, indicator ${indicator.name}`;

      console.log("query", query);

      try {
        // TODO: cancel the request if the component is unmounted
        const result = await runnable.current.invoke({ input: query });
        const json = JSON.parse(result.answer);

        console.log("result", result);
        const data = feedback.parse(json);
        setFeedback(competency, indicator.name, data);
      } catch (error) {
        if (error instanceof ZodError) {
          console.log("TODO: fix ollama response error", error.errors);
        } else {
          console.log("TODO: fix ollama error", error);
        }

        if (!triesLeft) {
          console.error("Failed to get grading for", competency, indicator);
          toast.error(`${competency} - ${indicator.name}`, {
            description: "Failed to get feedback",
          });

          return;
        }

        console.warn("tries left", triesLeft, indicator.name);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await getGrading(competency, indicator, triesLeft - 1);
      }
    },
    [runnable.current, setFeedback, documents],
  );

  const setModel = useCallback(
    async (modelName: string) => {
      if (!models.length) {
        toast.warning(`Unable to set model ${modelName}`, {
          description: "Please wait for the models to load",
        });
        return;
      }

      const model = await getModel(modelName, models);
      if (!model) {
        return;
      }

      setLocalModel(modelName);
    },
    [models],
  );

  const setEmbeddings = useCallback(
    async (embeddings: string) => {
      if (!models.length) {
        toast.warning(`Unable to set model ${embeddings}`, {
          description: "Please wait for the models to load",
        });
        return;
      }

      const model = await getModel(embeddings, models);
      if (!model) {
        return;
      }

      setLocalEmbedding(embeddings);
    },
    [models],
  );

  useMemo(async () => {
    if (!models.length) return;
    setStatus("initializing");

    const chatModel = await getModel(model, models);
    if (!chatModel) return;

    const embeddingsModel = await getModel(embeddings, models);
    if (!embeddingsModel) return;

    const llm = new Ollama({
      model: model,
      numCtx: 1000,
      format: "json",
    });

    const store = await createVectorStore(embeddingsModel, documents);
    vectorStore.current = store;
    console.log("store", store);

    const runner = await createRunner(llm, store);
    console.log("runner", runner);
    runnable.current = runner;
    setStatus("initialized");
  }, [models, model, embeddings, documents]);

  useEffect(() => {
    ollama
      .list()
      .then((response) => {
        setModels(response.models);
      })
      .catch((error) => {
        toast.error("Unable to connect to ollama", {
          description: error.message,
          action: {
            label: "Get ollama",
            onClick: () => window.open("https://ollama.com/"),
          },
        });

        setStatus("error");
      });
  }, []);

  return (
    <LlmContext.Provider
      value={{
        addStudentDocuments,
        removeStudentDocuments,
        documents,
        models,
        model,
        setModel,
        embeddings,
        setEmbeddings,
        status,
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

async function createVectorStore(
  model: ModelResponse,
  initialDocuments: Document[] = [],
) {
  const splitDocs = await textSplitter.createDocuments(
    competencies.map((competency) => competency.text),
    competencies.map(
      (competency): DocumentMetaData => ({
        name: competency.name,
        lastModified: Date.now(),
        type: "grading template",
      }),
    ),
  );

  return MemoryVectorStore.fromDocuments(
    [...splitDocs, ...initialDocuments],
    new OllamaEmbeddings({ model: model.name }),
  );
}

async function createRunner(llm: Ollama, vectorStore: MemoryVectorStore) {
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

async function getModel(
  modelName: string,
  availableModels: ModelResponse[],
): Promise<ModelResponse | null> {
  const model = availableModels.find(({ name }) => name === modelName);

  if (model) return model;

  const downloadToast = toast.info(`${modelName} not found on your machine`, {
    dismissible: false,
    duration: 9999999999,
    important: true,
    description: "Downloading model, this might take a while",
  });

  const response = await ollama.pull({ model: modelName });

  if (response.status === "success") {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Give some time for the model to be available
    toast.dismiss(downloadToast);
    return getModel(modelName, availableModels);
  }

  toast.warning(`Model ${modelName} is not available`, {
    description: "Please select another model",
  });

  return null;
}
