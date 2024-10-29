import {
  CompetencyIconWithBackground,
  IndicatorGradeProgress,
} from "@/components/custom/Indicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Competency, Indicator } from "@/lib/types";
import { jsonToMarkdown } from "@/lib/utils";
import { useFeedback } from "@/providers/FeedbackProvider";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Copy } from "lucide-react";
import { useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

const disclaimer = `The feedback below is generated by a Large Language Model (LLM) and is
inherently flawed. The feedback is meant as an initial starting point
for your reflection, please refer to a human for proper
feedback and guidance.`;

export function FeedbackDialog(props: {
  competency: Competency;
  indicator: Indicator;
}) {
  const { showFeedback, setFeedback, competenciesWithIncidactors } =
    useFeedback();
  const [, copy] = useCopyToClipboard();

  const mardownFeedback = useMemo(() => {
    return jsonToMarkdown(props.indicator.feedback, ["grade", "metadata"]);
  }, [props.indicator.feedback]);

  const [previousIndicator, nextIndicator] = useMemo(() => {
    const currentCompetencyIndex = competenciesWithIncidactors.findIndex(
      ({ name }) => name === props.competency,
    );

    if (currentCompetencyIndex < 0) {
      return [undefined, undefined];
    }

    const currentIndicatorIndex = competenciesWithIncidactors[
      currentCompetencyIndex
    ].indicators.findIndex(({ name }) => name === props.indicator.name);

    if (currentIndicatorIndex < 0) {
      return [undefined, undefined];
    }

    const previousIndicator =
      competenciesWithIncidactors[currentCompetencyIndex].indicators[
        currentIndicatorIndex - 1
      ] ??
      competenciesWithIncidactors[currentCompetencyIndex - 1]?.indicators[0] ??
      competenciesWithIncidactors[competenciesWithIncidactors.length - 1]
        ?.indicators[
        competenciesWithIncidactors[competenciesWithIncidactors.length - 1]
          .indicators.length - 1
      ];
    const nextIndicator =
      competenciesWithIncidactors[currentCompetencyIndex].indicators[
        currentIndicatorIndex + 1
      ] ??
      competenciesWithIncidactors[currentCompetencyIndex + 1]?.indicators[0] ??
      competenciesWithIncidactors[0]?.indicators[0];

    return [previousIndicator, nextIndicator];
  }, [competenciesWithIncidactors, props.competency, props.indicator]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && !!previousIndicator?.feedback) {
        showFeedback(previousIndicator);
      } else if (e.key === "ArrowRight" && !!nextIndicator?.feedback) {
        showFeedback(nextIndicator);
      }
    };

    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [previousIndicator, nextIndicator]);

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) showFeedback();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex space-x-4">
            <CompetencyIconWithBackground competency={props.competency} />
            <div className="flex flex-col justify-between">
              <div className="text-2xl first-letter:capitalize">
                {props.competency}
              </div>
              <span className="text-sm font-light text-muted-foreground">
                {props.indicator.name}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>⚠️ {disclaimer}</DialogDescription>
        <section className="flex space-x-8">
          <section className="space-y-4">
            <IndicatorGradeProgress grade={props.indicator.feedback?.grade} />
            <Button
              variant="ghost"
              disabled={!props.indicator.feedback}
              onClick={() =>
                setFeedback(props.competency, props.indicator.name)
              }
            >
              Regenerate feedback
            </Button>
          </section>
          <ScrollArea className="max-h-[55vh] grow" key={props.indicator.name}>
            {!props.indicator.feedback && (
              <section className="h-60">
                <Skeleton className="w-36 h-7 mb-2" />

                <Skeleton className="w-[90%] h-4 mb-1" />
                <Skeleton className="w-[85%] h-4 mb-1" />
                <Skeleton className="w-[93%] h-4 mb-1" />
                <Skeleton className="w-[60%] h-4 mb-1" />

                <Skeleton className="w-64 h-6 mt-5 mb-2" />
                <Skeleton className="w-[90%] h-4 mb-1" />
                <Skeleton className="w-[95%] h-4 mb-1" />
                <Skeleton className="w-[85%] h-4 mb-1" />
                <Skeleton className="w-[25%] h-4 mb-1" />
              </section>
            )}
            <Button
              aria-label="Copy feedback to clipboard"
              variant="ghost"
              size="icon"
              disabled={!props.indicator.feedback}
              className="absolute right-0 top-0 z-50"
              onClick={async () => {
                const isCopied = await copy(`========================
⚠️ Disclaimer ⚠️

${disclaimer}

⚠️ Disclaimer ⚠️
========================

========================
🤖 Generated feedback 🤖

${props.competency} - ${props.indicator.name}

🤖 Generated feedback 🤖
========================

${props.indicator.feedback?.metaData.model?.name} matches you at a "${props.indicator.feedback?.grade}"

${mardownFeedback}

========================
📝 How to cite 📝

Find more information on the [HvA website](https://www.hva.nl/bibliotheek/ondersteuning/zoeken/bronnen-vermelden/ai-gegenereerde-content/ai-gegenereerde-content.html)

📝 How to cite 📝
========================
# References
Ollama. (${new Date().getFullYear()}). ${props.indicator.feedback?.metaData.model.name} (${format(props.indicator.feedback?.metaData.model.modified_at ?? new Date(), "MMM dd")} version)[Large Language Model]. Accessed on ${format(new Date(), "do MMM yyyy")}
Ollama. (${new Date().getFullYear()}). ${props.indicator.feedback?.metaData.embeddingsModel.name} (${format(props.indicator.feedback?.metaData.embeddingsModel.modified_at ?? new Date(), "MMM dd")} version)[Large Language Model]. Accessed on ${format(new Date(), "do MMM yyyy")}

------------------------
Generated using the following prompt
------------------------
${props.indicator.feedback?.metaData.prompt}

`);
                if (isCopied) {
                  toast.success("Feedback copied to clipboard");
                } else {
                  toast.warning("Failed to copy feedback to clipboard");
                }
              }}
            >
              <Copy />
            </Button>
            {/* {JSON.stringify(indicator.feedback)} */}
            <Markdown
              className="mr-6"
              components={{
                h1: ({ children }) => (
                  <h1 className="font-bold text-xl first-letter:uppercase first-of-type:mt-0 mt-6">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-semibold mt-4 text-lg">{children}</h2>
                ),
                p: ({ children }) => <p className="mb-0.5">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2">{children}</ol>
                ),
              }}
            >
              {mardownFeedback}
            </Markdown>
          </ScrollArea>
        </section>
        <div className="mt-3 italic text-muted-foreground text-center text-xs">
          Ollama. ({new Date().getFullYear()}).{" "}
          {props.indicator.feedback?.metaData.model.name} (
          {format(
            props.indicator.feedback?.metaData.model.modified_at ?? new Date(),
            "MMM dd",
          )}{" "}
          version)[Large Language Model]. Accessed on{" "}
          {format(new Date(), "do MMM yyyy")}
        </div>
        <DialogFooter className="grid grid-cols-2">
          <Button
            variant="outline"
            disabled={!previousIndicator?.feedback}
            onClick={() => {
              showFeedback(previousIndicator);
            }}
          >
            <ArrowLeft />
            {previousIndicator?.name ?? "Previous disciplinary"}
          </Button>
          <Button
            variant="outline"
            disabled={!nextIndicator?.feedback}
            onClick={() => {
              showFeedback(nextIndicator);
            }}
          >
            {nextIndicator?.name ?? "Next disciplinary"}
            <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
