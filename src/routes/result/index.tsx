import {
  CompetencyDisplay,
  CompetencyIconWithBackground,
  IndicatorGradeProgress,
} from "@/components/custom/Indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Competency, CompetencyWithIndicators, Indicator } from "@/lib/types";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useLlm } from "@/providers/LlmProvider";
import { useEffect } from "react";

export function ResultRoute() {
  const { competenciesWithIncidactors } = useFeedback();
  return (
    <div className="p-4 min-h-lvh">
      <Card>
        <CardHeader>
          <CardTitle className="text-center mb-6">Results</CardTitle>
          {/* <section className="grid grid-cols-5 gap-8">
            {indicators.map((indocator) => (
              <Card key={indocator} className="text-center">
                <CardHeader className="items-center py-3">
                  <CompetencyIcon indicator={indocator} size={20} />
                </CardHeader>
                <CardContent className="pb-2">
                  <CompetencyProgress
                    indicator={indocator}
                    value={60}
                    className="h-3"
                  />
                </CardContent>
                <CardFooter className="pb-2 text-xs">
                  <span className="grow text-center first-letter:capitalize">
                    {indocator.replaceAll("-", " ")}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </section> */}
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 grid-cols-1 lg:gap-20 gap-12">
          {competenciesWithIncidactors.map((competenctWithIndicators) => (
            <CompetencyResult
              key={competenctWithIndicators.name}
              competencyWithIndicators={competenctWithIndicators}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CompetencyResult(props: {
  competencyWithIndicators: CompetencyWithIndicators;
}) {
  return (
    <section
      className="flex space-x-4"
      aria-label={props.competencyWithIndicators.name.replaceAll("-", " ")}
    >
      <CompetencyIconWithBackground
        competency={props.competencyWithIndicators.name}
      />
      <div className="grow">
        <h2 className="font-bold">
          <CompetencyDisplay competency={props.competencyWithIndicators.name} />
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

  const { getGrading } = useLlm();

  useEffect(() => {
    if (props.indicator.feedback) return;

    getGrading(props.competency, { name: props.indicator.name });
  }, [props.indicator.feedback, props.competency]);

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
