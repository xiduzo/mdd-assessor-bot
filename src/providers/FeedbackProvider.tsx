import {
  competenciesWithIncidactors,
  Competency,
  CompetencyWithIndicators,
  Feedback,
  Indicator,
} from "@/lib/types";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

type FeedbackContextType = {
  competenciesWithIncidactors: CompetencyWithIndicators[];
  setFeedback: (
    competency: Competency,
    indicator: string,
    feedback?: Feedback,
  ) => void;
  selectedFeedback?: Indicator;
  showFeedback: (indicator?: Indicator) => void;
  clearFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextType>({
  competenciesWithIncidactors: competenciesWithIncidactors,
  selectedFeedback: undefined,
  setFeedback: () => undefined,
  showFeedback: () => undefined,
  clearFeedback: () => undefined,
});

export function FeedbackProvider(props: PropsWithChildren) {
  const [state, setState] = useState(competenciesWithIncidactors);
  const [selectedFeedback, setSelectedFeedback] = useState<Indicator>();

  const setFeedback = useCallback(
    (competency: Competency, indicator: string, feedback?: Feedback) => {
      setState((prev) => {
        const competencyIndex = prev.findIndex((c) => c.name === competency);
        if (competencyIndex < 0) return prev;

        const next = [...prev];
        const indicatorIndex = next[competencyIndex].indicators.findIndex(
          (i) => i.name === indicator,
        );
        if (indicatorIndex < 0) return prev;

        next[competencyIndex].indicators[indicatorIndex].feedback = feedback;
        return next;
      });
    },
    [],
  );

  const clearFeedback = useCallback(() => {
    setState((prev) => {
      const next = [...prev];
      next.forEach(({ indicators }) => {
        indicators.forEach((indicator) => {
          indicator.feedback = undefined;
        });
      });
      return next;
    });
  }, []);

  const showFeedback = useCallback((indicator?: Indicator) => {
    setSelectedFeedback(indicator);
  }, []);

  return (
    <FeedbackContext.Provider
      value={{
        competenciesWithIncidactors: state,
        setFeedback,
        selectedFeedback,
        showFeedback,
        clearFeedback,
      }}
    >
      {props.children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}
