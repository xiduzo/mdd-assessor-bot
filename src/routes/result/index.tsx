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
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function ResultRoute() {
  const { documents } = useLlm();
  const navigate = useNavigate();

  const { competenciesWithIncidactors, clearFeedback } = useFeedback();

  useEffect(() => {
    if (documents.length) return;

    navigate("/", { replace: true });
  }, [documents, navigate]);
  return (
    <article>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Feedback
            <Button
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
        <CardContent className="grid lg:grid-cols-2 grid-cols-1 lg:gap-12 gap-8">
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
        <h2 className="font-bold first-letter:capitalize">
          {props.competencyWithIndicators.name}
        </h2>
        <ol className="space-y-2">
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
    <li key={props.indicator.name} className="flex space-x-4 items-center">
      <div className="flex-grow">{props.indicator.name}</div>
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
