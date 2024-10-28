import {
  createRunner,
  createVectorStore,
  documentSplitter,
  getModel,
  postProcessResponse,
} from "@/lib/llm";
import { SYSTEM_TEMPLATE } from "@/lib/systemTemplate";
import {
  Competency,
  DocumentMetaData,
  feedback,
  Feedback,
  Indicator,
} from "@/lib/types";
import { Document } from "@langchain/core/documents";
import {} from "@langchain/core/tools";
import { Ollama } from "@langchain/ollama";
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

type AddDocumentInput = Omit<DocumentMetaData, "type"> & { text: string };

type LmmContextType = {
  addStudentDocuments: (input: AddDocumentInput[]) => Promise<void>;
  removeStudentDocuments: (input: Pick<File, "name">[]) => void;
  documents: Document<DocumentMetaData>[];
  models: ModelResponse[];
  model: ModelResponse | null;
  embeddings: ModelResponse | null;
  setModel: (modelName: string, modelType: "chat" | "embeddings") => void;
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
  model: null,
  embeddings: null,
  setModel: () => {
    throw new Error("setModel not implemented");
  },
  getGrading: async () => {
    throw new Error("getGradingTemplate not implemented");
  },
});

export function LlmProvider(props: PropsWithChildren) {
  const [documents, setDocuments] = useLocalStorage<
    Document<DocumentMetaData>[]
  >("documents", []);
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [status, setStatus] = useState<LmmContextType["status"]>();
  const [model, setLocalModel] = useLocalStorage<ModelResponse | null>(
    "model",
    null,
  );
  const [embeddings, setLocalEmbedding] = useLocalStorage<ModelResponse | null>(
    "embeddings",
    null,
  );

  const { setFeedback } = useFeedback();

  const runnable = useRef<Awaited<ReturnType<typeof createRunner>> | null>(
    null,
  );
  const vectorStore = useRef<Awaited<
    ReturnType<typeof createVectorStore>
  > | null>(null);

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
      const documents = await documentSplitter.createDocuments(texts, meta);
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
      if (!model) return;
      if (!embeddings) return;

      while (!runnable.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const query = `what grade ("novice", "competent", "proficient", or "visionary"), feedback, positive points and areas for improvement would you give the student for given the competency ${competency} and indicator ${indicator.name}?`;

      console.log("query", query);

      try {
        // TODO: cancel the request if the component is unmounted
        const result = await runnable.current.invoke({ input: query });
        const json = JSON.parse(result.answer);

        if (typeof json !== "object") return;

        const processed = postProcessResponse(json);

        const metaData: Feedback["metaData"] = {
          date: new Date(),
          model: model,
          embeddingsModel: embeddings,
          prompt: SYSTEM_TEMPLATE + "\n\n" + query,
          context: result.context,
        };

        processed.metaData = metaData;
        console.log("result", result, processed);

        const data = feedback.parse(processed);
        setFeedback(competency, indicator.name, data);
      } catch (error) {
        if (error instanceof ZodError) {
          console.log("TODO: fix ollama response error", error.errors);
        } else {
          console.log("TODO: fix ollama error", error);
        }

        if (!triesLeft) {
          toast.error(`${competency} - ${indicator.name}`, {
            description: "Failed to get feedback",
          });

          return;
        }

        await getGrading(competency, indicator, triesLeft - 1);
      }
    },
    [setFeedback, documents, model, embeddings],
  );

  const setModel = useCallback(
    async (modelName: string, modelType: "chat" | "embeddings") => {
      if (!models.length) {
        toast.warning(`Unable to set model ${modelName}`, {
          description: "Please wait for the models to load",
        });
        return;
      }

      const model = await getModel(modelName, models);

      switch (modelType) {
        case "chat":
          setLocalModel(model);
          break;
        case "embeddings":
          setLocalEmbedding(model);
          break;
      }
    },
    [models],
  );

  useMemo(async () => {
    if (!models.length) return;
    setStatus("initializing");

    if (!model) return;
    if (!embeddings) return;

    const llm = new Ollama({
      model: model.name,
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

    const store = await createVectorStore(embeddings, documents);
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
