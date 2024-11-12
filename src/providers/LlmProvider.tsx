import {
  Feedback,
  Indicator,
  IpcGetFeedbackRequest,
  IpcGetModelsResponse,
  IPC_CHANNEL,
} from "@/lib/types";
import { useDocumentStore } from "@/stores/documentStore";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useLlmStore } from "@/stores/llmStore";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { toast } from "sonner";

type LmmContextType = {
  getGrading: (indicator: Indicator) => Promise<void>;
  clear: () => Promise<void>;
};

const LlmContext = createContext<LmmContextType>({
  getGrading: async () => {
    throw new Error("getGradingTemplate not implemented");
  },
  clear: async () => {
    throw new Error("clear not implemented");
  },
});

export function LlmProvider(props: PropsWithChildren) {
  const { documents } = useDocumentStore();
  const { model, set } = useLlmStore();
  const { add } = useFeedbackStore();

  const getGrading = useCallback(
    async (indicator: Indicator) => {
      if (!model) return;
      if (!documents.length) return;

      window.electron.ipcRenderer.send<IpcGetFeedbackRequest>(
        IPC_CHANNEL.GET_FEEDBACK,
        {
          indicator,
          model,
          documents,
        },
      );
    },
    [documents, model],
  );

  const clear = useCallback(async () => {
    // TODO: implement clearing of processes in main process
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.send(IPC_CHANNEL.GET_MODELS);

    return window.electron.ipcRenderer.on<IpcGetModelsResponse>(
      IPC_CHANNEL.GET_MODELS,
      (event) => {
        if (!event.success) {
          toast.warning(event.error, {
            description: "Is Ollama running?",
            action: {
              label: "Install Ollama",
              onClick: () => window.open("https://ollama.com/"),
            },
          });
          return;
        }

        set(event.data);
      },
    );
  }, []);

  useEffect(() => {
    return window.electron.ipcRenderer.on<Feedback>(
      IPC_CHANNEL.GET_FEEDBACK,
      (event) => {
        console.log(event);
        if (!event.success) return;

        add(event.data);
      },
    );
  }, [add]);

  return (
    <LlmContext.Provider value={{ getGrading, clear }}>
      {props.children}
    </LlmContext.Provider>
  );
}

export function useLlm() {
  return useContext(LlmContext);
}
