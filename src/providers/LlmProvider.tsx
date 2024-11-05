import { INDICATOR_DOCUMENTS, postProcessResponse } from "@/lib/llm";
import { FEEDBACK_TEMPLATE } from "@/lib/systemTemplates";
import {
  competenciesWithIncidactors,
  feedback,
  FeedbackMetaData,
  Indicator,
  IpcGetModelsResponse,
  IPC_CHANNEL,
} from "@/lib/types";
import { useDocumentStore } from "@/stores/documentStore";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useLlmStore } from "@/stores/llmStore";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Ollama } from "@langchain/ollama";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { toast } from "sonner";
import { useInterval } from "usehooks-ts";

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

  const queue = useRef<Map<string, { chat: (SystemMessage | HumanMessage)[] }>>(
    new Map(),
  );

  const processing = useRef<string>();

  // TODO: move this whole queue and processing to the main thread
  // potentially calling as child processes via https://www.electronjs.org/docs/latest/api/utility-process
  useInterval(async () => {
    if (!model) return;
    if (!queue.current.size) return;
    if (processing.current) return;

    const item = Array.from(queue.current.entries())
      .sort(() => Math.random() - Math.random())
      .at(0);

    if (!item) return;

    const competency = competenciesWithIncidactors.find(({ indicators }) =>
      indicators.some(({ name }) => name === item[0]),
    )?.name;

    if (!competency) return;

    const [indicator, { chat }] = item;
    processing.current = indicator;

    try {
      const llm = new Ollama({
        model: model.name,
        format: "json",
        temperature: 0.9,
        // numCtx: 1000,
        // temperature: 0.2,
        // embeddingOnly: true,
        // frequencyPenalty: 1.6,
        // repeatPenalty: 1.8,
        // mirostatTau: 3,
        // topK: 10,
        // topP: 0.5,
      });

      const result = await llm.invoke(chat);
      const json = JSON.parse(result.toString());

      if (typeof json !== "object") return;

      const processed = postProcessResponse(json);

      const metaData: Omit<FeedbackMetaData, "date"> = {
        model: model,
        prompt: chat.map(({ content }) => content).join("\n\n"),
        competency,
        indicator,
      };

      const data = feedback.parse({ ...processed, metaData });
      add(data);
      queue.current.delete(indicator);
    } catch (error) {
      console.log("Error getting feedback", error);
    } finally {
      processing.current = undefined;
    }
  }, 1000);

  const getGrading = useCallback(
    async (indicator: Indicator) => {
      if (!documents.length) return;

      const indicatorText = INDICATOR_DOCUMENTS.find(
        (document) => document.indicator === indicator.name,
      );

      if (!indicatorText) return;

      const competency = competenciesWithIncidactors.find(({ indicators }) =>
        indicators.some(({ name }) => name === indicator.name),
      )?.name;

      if (!competency) return;

      const chat: (SystemMessage | HumanMessage)[] = [
        new SystemMessage(
          FEEDBACK_TEMPLATE.replace("{indicator_text}", indicatorText.text),
        ),
        new HumanMessage(
          "I will now provide you with the documents to grade, each document will have a title and the content of the document:",
        ),
        ...documents.map(
          ({ name, text }) => new HumanMessage(`# ${name}\n\n${text}`),
        ),
        new HumanMessage(
          `what grade ("novice", "competent", "proficient", or "visionary") and feedback would you give the student for given the competency ${competency} and indicator ${indicator.name}?`,
        ),
      ];
      queue.current.set(indicator.name, { chat });
    },
    [documents, model],
  );

  const clear = useCallback(async () => {
    queue.current.clear();
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

  return (
    <LlmContext.Provider value={{ getGrading, clear }}>
      {props.children}
    </LlmContext.Provider>
  );
}

export function useLlm() {
  return useContext(LlmContext);
}
