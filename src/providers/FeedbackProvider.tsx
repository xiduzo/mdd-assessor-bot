import {
  competenciesWithIncidactors,
  Competency,
  CompetencyWithIndicators,
  Feedback,
  Indicator
} from "@/lib/types";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { toast } from "sonner";
import { useCelebration } from "./CelebrationProvider";

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
  const { celebrate } = useCelebration();

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

  useEffect(() => {
    const grades = state.flatMap((competency) => {
      return competency.indicators.map((indicator) => {
        return indicator.feedback?.grade;
      });
    });

    if (grades.includes(undefined)) return;
    if (grades.includes("novice")) return;
    if(Math.random() > 0.66) {
      const successTexts = [
        {
          message: "i am a stochastic parrot and so r u",
          icon: "🦜",
          paper: "https://dl.acm.org/doi/pdf/10.1145/3442188.3445922",
        },
        {
          message: "Cool idea, great job!",
          icon: "🐙",
          paper: "https://aclanthology.org/2020.acl-main.463.pdf",
        },
      ];

      const { message, icon, paper } =
        successTexts[Math.floor(Math.random() * successTexts.length)];

      toast.success(message, {
        important: true,
        duration: 10000,
        icon,
        action: {
          label: "👀",
          onClick: () => {
            window.open(paper);
          },
        },
      });
    }

    if (grades.includes("competent")) return;
    celebrate("You've beaten the LLM, are you ready for your human assessors?");
  }, [state, celebrate]);

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
