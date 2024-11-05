import { Feedback } from "@/lib/types";
import { create } from "zustand";

type FeedbackStore = {
  selected?: Feedback;
  show: (selected?: Feedback) => void;
  feedback: Feedback[];
  add: (feedback: Feedback) => void;
  clear: (feedback: Feedback) => void;
  clearAll: () => void;
  get: (indicator: string) => Feedback | undefined;
};

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  selected: undefined,
  show: (selected) => set({ selected }),
  feedback: [],
  add: (feedback) => {
    set((state) => {
      state.clear(feedback);

      return { feedback: [...get().feedback, feedback] };
    });
  },
  clear: (feedback) => {
    set((state) => {
      return {
        feedback: state.feedback.filter(
          (f) => f.metaData.indicator !== feedback.metaData.indicator,
        ),
        selected:
          state.selected?.metaData.indicator === feedback.metaData.indicator
            ? undefined
            : state.selected,
      };
    });
  },
  clearAll: () => {
    set({ feedback: [] });
  },
  get: (indicator) => {
    return get().feedback.find((f) => f.metaData.indicator === indicator);
  },
}));
