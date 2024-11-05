import {
  CompetencyIconWithBackground,
  IndicatorGradeProgress,
} from "@/components/custom/Indicator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  competenciesWithIncidactors,
  CompetencyWithIndicators,
  Indicator,
} from "@/lib/types";
import { useLlm } from "@/providers/LlmProvider";
import { useDocumentStore } from "@/stores/documentStore";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

export function ResultRoute() {
  const { documents } = useDocumentStore();
  const navigate = useNavigate();
  const previousDocumentsLength = useRef(documents.length);

  const { clearAll } = useFeedbackStore();

  useEffect(() => {
    if (!documents.length) {
      toast.warning("No documents found to provide feedback on.");
      navigate("/", { replace: true });
      return;
    }

    if (previousDocumentsLength.current !== documents.length) {
      toast.info("Your documents have been changed", {
        duration: 10_000,
        action: {
          label: "Clear all feedback",
          onClick: () => clearAll(),
        },
      });
      previousDocumentsLength.current = documents.length;
    }

    previousDocumentsLength.current = documents.length;
  }, [documents, navigate, clearAll]);

  return (
    <article>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Feedback
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Clear all feedback"
                    disabled={!documents.length}
                    variant="ghost"
                    size="icon"
                    onClick={() => clearAll()}
                  >
                    <RotateCcw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Regenerate all feedback</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="space-x-2">
            <em>/ˈfiːd.bæk/</em>
            <span>
              information given to guide future behavior, improve performance,
              or enhance understanding, provided by various sources like
              teachers, peers, or experiences.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 grid-cols-1 lg:gap-10 gap-8">
          {competenciesWithIncidactors.map((competenctWithIndicators) => (
            <CompetencyResult
              key={competenctWithIndicators.name}
              competencyWithIndicators={competenctWithIndicators}
            />
          ))}
        </CardContent>
      </Card>
    </article>
  );
}

function CompetencyResult(props: {
  competencyWithIndicators: CompetencyWithIndicators;
}) {
  return (
    <section
      className="flex space-x-4"
      aria-label={props.competencyWithIndicators.name}
    >
      <CompetencyIconWithBackground
        competency={props.competencyWithIndicators.name}
      />
      <div className="grow">
        <h2 className="font-bold text-lg first-letter:capitalize">
          {props.competencyWithIndicators.name}
        </h2>
        <ol
          className="space-y-2"
          aria-label={`Feedback for ${props.competencyWithIndicators.name} indicators`}
        >
          {props.competencyWithIndicators.indicators.map((indicator) => (
            <CompetencyIndicator key={indicator.name} indicator={indicator} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function CompetencyIndicator(props: { indicator: Indicator }) {
  const feedback = useFeedbackStore(
    useShallow((store) =>
      store.feedback.find(
        (feedback) => feedback.metaData.indicator === props.indicator.name,
      ),
    ),
  );
  const { show } = useFeedbackStore();

  const { getGrading } = useLlm();

  useEffect(() => {
    if (feedback) return;

    getGrading(props.indicator);
  }, [feedback, props.indicator, getGrading]);

  return (
    <li
      key={props.indicator.name}
      className="flex space-x-4 items-center"
      aria-label={`Feedback for ${props.indicator.name}`}
    >
      <h3 className="flex-grow" aria-hidden>
        {props.indicator.name}
      </h3>
      <IndicatorGradeProgress grade={feedback?.grade} />
      <Button
        variant="link"
        disabled={!feedback}
        onClick={() => show(feedback)}
        aria-label={`Read feedback for ${props.indicator.name}`}
      >
        Read feedback
      </Button>
    </li>
  );
}
