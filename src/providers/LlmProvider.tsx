import { INDICATOR_DOCUMENTS, postProcessResponse } from "@/lib/llm";
import { FEEDBACK_TEMPLATE } from "@/lib/systemTemplates";
import { Competency, feedback, Indicator, StudentDocument } from "@/lib/types";
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Ollama } from "@langchain/ollama";
import { type ModelResponse } from "ollama";
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

type LmmContextType = {
  addStudentDocuments: (input: StudentDocument[]) => Promise<void>;
  removeStudentDocuments: (input: Pick<File, "name">[]) => void;
  documents: StudentDocument[];
  models: ModelResponse[];
  model: ModelResponse | null;
  setModel: (modelName: string) => void;
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
  setModel: () => {
    throw new Error("setModel not implemented");
  },
  getGrading: async () => {
    throw new Error("getGradingTemplate not implemented");
  },
});

export function LlmProvider(props: PropsWithChildren) {
  const [documents, setDocuments] = useLocalStorage<StudentDocument[]>(
    "documents",
    [],
  );
  const [models, setModels] = useState<ModelResponse[]>([]);
  const [status, setStatus] = useState<LmmContextType["status"]>();
  const [model, setLocalModel] = useLocalStorage<ModelResponse | null>(
    "model",
    null,
  );
  const llm = useRef<LanguageModelLike>();

  const { setFeedback } = useFeedback();

  const removeStudentDocuments = useCallback(
    async (documents: Pick<File, "name">[]) => {
      const fileNamesToDelete = documents.map(({ name }) => name);
      setDocuments((prev) =>
        prev.filter(({ name }) => !fileNamesToDelete.includes(name)),
      );
    },
    [],
  );

  const addStudentDocuments = useCallback(
    async (files: StudentDocument[]) => {
      await removeStudentDocuments(files);
      setDocuments((prev) => [...prev, ...files]);
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

      while (!llm.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const query = `what grade ("novice", "competent", "proficient", or "visionary") and feedback would you give the student for given the competency ${competency} and indicator ${indicator.name}?`;

      const indicatorText = INDICATOR_DOCUMENTS.find(
        (text) =>
          text.indicator === indicator.name && text.competency === competency,
      );

      console.log(query, indicatorText);
      if (!indicatorText) return;

      try {
        const result = await llm.current.invoke([
          new SystemMessage(
            FEEDBACK_TEMPLATE.replace("{indicator_text}", indicatorText.text),
          ),
          new HumanMessage(
            "I will provide you with the documents to grade, each document will have a title and the content of the document:",
          ),
          ...documents.map(
            (document) =>
              new HumanMessage(`
            # ${document.name}
            ${document.text}
            `),
          ),
          new HumanMessage(query),
        ]);

        console.log("result", result);

        const json = JSON.parse(result.toString());

        console.log("json", json);

        if (typeof json !== "object") return;

        const processed = postProcessResponse(json);
        console.log("result", result, processed);

        const data = feedback.parse({
          ...processed,
          metaData: {
            date: new Date(),
            model: model,
            prompt: FEEDBACK_TEMPLATE + "\n\n" + query,
          },
        });
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
    [setFeedback, documents, model],
  );

  const setModel = useCallback(
    async (modelName: string) => {
      if (!models.length) {
        toast.warning(`Unable to set model ${modelName}`, {
          description: "Please wait for the models to load",
        });
        return;
      }

      const model = models.find(({ name }) => name === modelName) ?? null;

      setLocalModel(model);
    },
    [models],
  );

  useMemo(async () => {
    if (!models.length) return;
    setStatus("initializing");

    if (!model) return;

    llm.current = new Ollama({
      model: model.name,
      numCtx: 1000,
      format: "json",
      // temperature: 0.2,
      // embeddingOnly: true,
      // frequencyPenalty: 1.6,
      // repeatPenalty: 1.8,
      // mirostatTau: 3,
      // topK: 10,
      // topP: 0.5,
    });

    setStatus("initialized");
  }, [models, model, documents]);

  useEffect(() => {
    window.electron.ipcRenderer.send("get-models");

    window.electron.ipcRenderer.on<ModelResponse[]>("models", (event) => {
      setModels(event);
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
