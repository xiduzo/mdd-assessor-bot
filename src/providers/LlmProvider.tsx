import {
  competenciesWithIncidactors,
  Competency,
  feedback,
  Feedback,
  Indicator,
} from "@/lib/types";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import {} from "@langchain/core/tools";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import {
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";
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
import { z, ZodError } from "zod";
import { useFeedback } from "./FeedbackProvider";

// TODO: allow the user to set the embeddings model params
const competenciesSplitter = new MarkdownTextSplitter({
  chunkSize: 500,
  chunkOverlap: 20,
});

const userDocumentSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 300,
  chunkOverlap: 20,
});

const competencyAndIndicatorDocuments = competenciesWithIncidactors.flatMap(
  (competency) => {
    let competencyText = ``;
    competencyText += `# Competency: ${competency.name} (${competency.abbreviation})`;
    competencyText += `\n`;
    competencyText += competency.description;
    competencyText += `\n\n`;

    const indicators = competency.indicators.map((indicator) => {
      let indicatorText = competencyText;
      indicatorText += `## Indicator: ${indicator.name}`;
      indicatorText += `\n`;
      indicatorText += indicator.description;
      indicatorText += `\n\n`;

      indicatorText += `### Expectations`;
      indicatorText += `\n`;
      indicatorText += indicator.expectations;
      indicatorText += `\n\n`;

      indicatorText += `| grade  | expectations   |`;
      indicatorText += `\n`;
      indicatorText += `|--------|----------------|`;
      indicatorText += `\n`;

      indicator.grades.forEach((grade) => {
        indicatorText += `| ${grade.grade} |`;
        indicatorText += grade.expectations
          .map((expectation) => expectation.slice(0, -1))
          .join(" and ");

        indicatorText += `|`;
        indicatorText += `\n`;
      });

      console.log(indicatorText);

      return { indicator, indicatorText };
    });

    return indicators.map((indicator) => ({
      competency: competency.name,
      indicator: indicator.indicator.name,
      text: indicator.indicatorText,
    }));
  },
);

const systemTemplate = `# IDENTITY and PURPOSE
You are acting as an assessor for a master's program in digital design.
You will be giving constructive feedback on the student's text for them to improve upon.
Your feedback will always be directed at the text provided and will refer to examples and evidence from the text.
The provided grade MUST always reflect the expectations of the indicator you are grading.
You are allowed to be a very critical assessor.
When not evidence is provided for an indicator, the student should receive a "novice" grade.

# OUTPUT
A JSON feedback that matches the following schema:
\`\`\`json
{{
  "grade": "novice" | "competent" | "proficient" | "visionary",
  "feedback": "string",
  "positive_aspects": ["string"],
  "areas_for_improvement": ["string"]
}}
\`\`\`

# TONE OF VOICE
Never use text from the examples provided below directly in your feedback, use it only as a tone-of-voice reference. Always refer to the student's text. If you use any text directly from the examples, the feedback will be considered invalid.

- Overall, we see a lot of growth and learning in you. We enjoyed seeing a lot of making explorations in this project and using creative methods to explore ideas in a very open brief – nice!
- We believe that you have learned a lor during this year. Your explorations and visits to Musea outside of the master are commendable. However, your reflection on teamwork is superficial. The answers that you gave during interview were convincing.  Overall, we think you have a grip on where you would like to go next.
- Your critical reflection on your design in comparison to other work in the same space is lacking and that’s something we expect a master-level student to be able to do with ease.
- Given the lack of a framing or debrief of the project presented it is hard to conduct appropriate research. The direction that the team took for this project seems to have taken you to an area where neither of you had any relevant knowledge and you were unable to bring the project back to an area where you could design again. Being able to do this is crucial for a designer at any level, bring the project to an area where you can design.
- Overall, we can see you we see you are ready to start adventuring in UX and considering possible ways forward in product design. We encourage you to look at differences across different design domains (e.g. “product design” and “experience design”) and explore how you can build on your prior knowledge and practice in architecture and take advantage of the other domains you have started to explore.
- Good that you have referenced some scientific articles in your research. Would like to have seen reference to other food-waste projects as part of research.
- You did not provide concrete examples of how you addressed potential unintended consequences and ensured user autonomy. When you compare your work to other work, more explicit identification of strong and weak points and how you plan to address them would provide clearer directions for future iterations.
- While the activities undertaken and their rationales are clearly listed, how they affected their work is not adequately articulated.

# CONTEXT
Use the following pieces of retrieved context to help you give a grade and provide feedback:
{context}`;

const studentDocumentType = z.object({
  type: z.literal("student document"),
});

const gradingTemplateType = z.object({
  type: z.literal("grading template"),
  indicator: z.string(),
});

const documentType = z.union([studentDocumentType, gradingTemplateType]);
type DocumentType = z.infer<typeof documentType>;

export type DocumentMetaData = Pick<File, "name" | "lastModified"> &
  DocumentType;

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
      const documents = await userDocumentSplitter.createDocuments(texts, meta);
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

      const query = `given the indicator ${indicator.name}, what grade ("novice", "competent", "proficient", or "visionary"), feedback, positive points and areas for improvement would you give the student?`;

      console.log("query", query);

      try {
        // TODO: cancel the request if the component is unmounted
        const result = await runnable.current.invoke({ input: query });
        const json = JSON.parse(result.answer);

        if (typeof json !== "object") {
          return;
        }

        const processed = Object.keys(json).reduce(
          (acc, key) => {
            const value = json[key];
            const lowerKey = key.toLowerCase();

            if (
              [
                "grade",
                "grading",
                "score",
                "rating",
                "overall",
                "result",
              ].includes(lowerKey)
            ) {
              switch (typeof value) {
                case "object":
                  if (
                    "level" in value ||
                    "value" in value ||
                    "grade" in value
                  ) {
                    acc.grade = value.level;
                  }
                  break;
                case "number":
                case "string":
                default:
                  acc.grade = value;
                  break;
              }

              return acc;
            }

            acc[lowerKey] = value;
            return acc;
          },
          {} as Record<string, unknown>,
        );

        console.log("result", result, processed);
        const metaData: Feedback["metaData"] = {
          date: new Date(),
          model: model,
          embeddingsModel: embeddings,
          prompt: systemTemplate + "\n\n" + query,
          context: result.context ?? [],
        };

        processed.metaData = metaData;
        const data = feedback.parse(processed);
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
    [runnable.current, setFeedback, documents, model, embeddings],
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
      temperature: 0.3,
      embeddingOnly: true,
      // frequencyPenalty: 1.6,
      // repeatPenalty: 1.8,
      // mirostatTau: 3,
      // topK: 10,
      // topP: 0.5,
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
  const splitDocs = await competenciesSplitter.createDocuments(
    competencyAndIndicatorDocuments.map((competency) => competency.text),
    competencyAndIndicatorDocuments.map(
      (competency): DocumentMetaData => ({
        name: competency.competency,
        indicator: competency.indicator,
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
