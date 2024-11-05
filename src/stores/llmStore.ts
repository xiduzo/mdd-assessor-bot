import { ModelResponse } from "ollama";
import { useEffect } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { create } from "zustand";

interface LlmStore {
  model: ModelResponse | null;
  /*
   * List of available models
   */
  models: ModelResponse[];
  set: (models: ModelResponse[]) => void;
  select: (model: ModelResponse | null) => void;
}

const key = "model";

const llmStore = create<LlmStore>((set) => {
  const init = JSON.parse(localStorage.getItem(key) ?? "null");

  return {
    model: init,
    models: [],
    set: (models) => {
      set(() => ({ models }));
    },
    select: (model) => {
      set(() => ({ model }));
    },
  };
});

export function useLlmStore(): LlmStore {
  const [, setModel] = useLocalStorage<ModelResponse | null>(key, null);

  const { model, models, select, ...rest } = llmStore();

  useEffect(() => {
    setModel(model);
  }, [model]);

  useEffect(() => {
    if (!model) return;
    if (!models.length) return;

    const hasModel = models.find(({ name }) => name === model.name);

    if (hasModel) return;

    toast.warning(`Unable to set model ${model.name}`, {
      description: "Did you delete the model?",
    });

    select(null);
  }, [model, models, select]);

  return {
    model,
    models,
    select,
    ...rest,
  };
}
