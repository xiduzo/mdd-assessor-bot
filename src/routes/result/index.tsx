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
import { Competency, CompetencyWithIndicators, Indicator } from "@/lib/types";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useLlm } from "@/providers/LlmProvider";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ResultRoute() {
  const { documents } = useLlm();
  const navigate = useNavigate();
  const previousDocumentsLength = useRef(documents.length);

  const { competenciesWithIncidactors, clearFeedback } = useFeedback();

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
          onClick: () => clearFeedback(),
        },
      });
      previousDocumentsLength.current = documents.length;
    }

    previousDocumentsLength.current = documents.length;
  }, [documents, navigate, clearFeedback]);
  return (
    <article>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Feedback
            <Button
              aria-label="Clear all feedback"
              disabled={!documents.length}
              variant="ghost"
              size="icon"
              onClick={() => clearFeedback()}
            >
              <RotateCcw />
            </Button>
          </CardTitle>
          <CardDescription>
            <em>/ˈfiːd.bæk/</em>
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
          className="space-y-2 mt-0.5"
          aria-label={`Feedback for ${props.competencyWithIndicators.name} indicators`}
        >
          {props.competencyWithIndicators.indicators.map((indicator) => (
            <CompetencyIndicator
              key={indicator.name}
              indicator={indicator}
              competency={props.competencyWithIndicators.name}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function CompetencyIndicator(props: {
  indicator: Indicator;
  competency: Competency;
}) {
  const { showFeedback } = useFeedback();

  const { getGrading, status } = useLlm();

  useEffect(() => {
    if (status !== "initialized") return;
    if (props.indicator.feedback) return;

    getGrading(props.competency, { name: props.indicator.name });
  }, [props.indicator.feedback, props.competency, status, getGrading]);

  return (
    <li
      key={props.indicator.name}
      className="flex space-x-4 items-center"
      aria-label={`Feedback for ${props.indicator.name}`}
    >
      <h3 className="flex-grow" aria-hidden>
        {props.indicator.name}
      </h3>
      <IndicatorGradeProgress grade={props.indicator.feedback?.grade} />
      <Button
        variant="link"
        disabled={!props.indicator.feedback}
        onClick={() => showFeedback(props.indicator)}
        aria-label={`Read feedback for ${props.indicator.name}`}
      >
        Read feedback
      </Button>
    </li>
  );
}
