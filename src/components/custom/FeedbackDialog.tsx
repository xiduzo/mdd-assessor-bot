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
import { competenciesWithIncidactors } from "@/lib/types";
import { jsonToMarkdown } from "@/lib/utils";
import { useFeedbackStore } from "@/stores/feedbackStore";
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

export function FeedbackDialog() {
    const { selected, clear, show, get } = useFeedbackStore();
    const [, copy] = useCopyToClipboard();

    const mardownFeedback = useMemo(() => {
        return jsonToMarkdown(selected, ["grade", "metadata"]);
    }, [selected?.feedback]);

    const [previousIndicator, nextIndicator] = useMemo(() => {
        if (!selected) return [undefined, undefined];

        const currentCompetencyIndex = competenciesWithIncidactors.findIndex(
            ({ indicators }) =>
                indicators.find(
                    ({ name }) => name === selected.metaData.indicator,
                ),
        );

        if (currentCompetencyIndex < 0) return [undefined, undefined];

        const currentIndicatorIndex = competenciesWithIncidactors[
            currentCompetencyIndex
        ].indicators.findIndex(
            ({ name }) => name === selected.metaData.indicator,
        );

        if (currentIndicatorIndex < 0) return [undefined, undefined];

        const previousIndicatorWithinCompetency =
            competenciesWithIncidactors[currentCompetencyIndex].indicators[
                currentIndicatorIndex - 1
            ];
        const previousIndicatorFromPreviousCompetency =
            competenciesWithIncidactors[currentCompetencyIndex - 1]?.indicators[
                competenciesWithIncidactors[currentCompetencyIndex - 1]
                    .indicators.length - 1
            ];
        const lastIndicatorOfLastCompetency =
            competenciesWithIncidactors[competenciesWithIncidactors.length - 1]
                ?.indicators[
                competenciesWithIncidactors[
                    competenciesWithIncidactors.length - 1
                ].indicators.length - 1
            ];

        const previousIndicator =
            previousIndicatorWithinCompetency ??
            previousIndicatorFromPreviousCompetency ??
            lastIndicatorOfLastCompetency;

        const nextIndicatorOfCurrentCompetency =
            competenciesWithIncidactors[currentCompetencyIndex].indicators[
                currentIndicatorIndex + 1
            ];
        const firstIndicatorOfNextCompetency =
            competenciesWithIncidactors[currentCompetencyIndex + 1]
                ?.indicators[0];
        const firstIndicatorOfFirstCompetency =
            competenciesWithIncidactors[0]?.indicators[0];

        const nextIndicator =
            nextIndicatorOfCurrentCompetency ??
            firstIndicatorOfNextCompetency ??
            firstIndicatorOfFirstCompetency;

        return [previousIndicator, nextIndicator];
    }, [competenciesWithIncidactors, selected, get]);

    const [previousFeedback, nextFeedback] = useMemo(() => {
        if (!previousIndicator) return [null, null];
        if (!nextIndicator) return [null, null];

        return [get(previousIndicator.name), get(nextIndicator.name)];
    }, [previousIndicator, nextIndicator]);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && previousFeedback) {
                show(previousFeedback);
            } else if (e.key === "ArrowRight" && nextFeedback) {
                show(nextFeedback);
            }
        };

        window.addEventListener("keydown", listener);

        return () => {
            window.removeEventListener("keydown", listener);
        };
    }, [previousFeedback, nextFeedback, get]);

    if (!selected) return null;

    return (
        <Dialog
            open={!!selected}
            onOpenChange={(open) => {
                if (!open) show();
            }}
        >
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex space-x-4">
                        <CompetencyIconWithBackground
                            competency={selected.metaData.competency}
                        />
                        <div className="flex flex-col justify-between">
                            <div className="text-2xl first-letter:capitalize">
                                {selected.metaData.competency}
                            </div>
                            <span className="text-sm font-light text-muted-foreground">
                                {selected.metaData.indicator}
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription>⚠️ {disclaimer}</DialogDescription>
                <section className="flex space-x-8">
                    <section className="space-y-4">
                        <IndicatorGradeProgress grade={selected.grade} />
                        <Button
                            variant="ghost"
                            disabled={!selected}
                            onClick={() => clear(selected)}
                        >
                            Regenerate feedback
                        </Button>
                    </section>
                    <ScrollArea
                        className="max-h-[55vh] grow"
                        key={selected.metaData.indicator}
                    >
                        {!selected.feedback && (
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
                            disabled={!selected.feedback}
                            className="absolute right-0 top-0 z-50"
                            onClick={async () => {
                                const isCopied =
                                    await copy(`========================
⚠️ Disclaimer ⚠️

${disclaimer}

⚠️ Disclaimer ⚠️
========================

========================
🤖 Generated feedback 🤖

${selected.metaData.competency} - ${selected.metaData.indicator}
${selected.metaData.model?.name} matches you at a "${selected.grade}"

🤖 Generated feedback 🤖
========================

${mardownFeedback}

========================
📝 How to cite 📝

Find more information on the [HvA website](https://www.hva.nl/bibliotheek/ondersteuning/zoeken/bronnen-vermelden/ai-gegenereerde-content/ai-gegenereerde-content.html)

📝 How to cite 📝
========================
# References
Ollama. (${format(selected.metaData.model.modified_at, "yyyy")}). ${selected.metaData.model.name} (${format(selected.metaData.model.modified_at ?? new Date(), "MMM dd")} version)[Large Language Model]. Accessed on ${format(new Date(), "do MMM yyyy")}

========================
Generated using the following prompt
========================
${selected.metaData.prompt}`);
                                if (isCopied) {
                                    toast.success(
                                        "Feedback copied to clipboard",
                                    );
                                } else {
                                    toast.warning(
                                        "Failed to copy feedback to clipboard",
                                    );
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
                                    <h2 className="font-semibold mt-4 text-lg">
                                        {children}
                                    </h2>
                                ),
                                p: ({ children }) => (
                                    <p className="mb-4">{children}</p>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc list-inside mb-4 [&>*]:inline">
                                        {children}
                                    </ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal list-inside mb-4">
                                        {children}
                                    </ol>
                                ),
                                li: ({ children }) => (
                                    <li className="mb-2 [&>*]:inline">
                                        {children}
                                    </li>
                                ),
                            }}
                        >
                            {mardownFeedback}
                        </Markdown>
                    </ScrollArea>
                </section>
                <div className="mt-3 italic text-muted-foreground text-center text-xs">
                    Ollama. (
                    {format(selected.metaData.model.modified_at, "yyyy")}).{" "}
                    {selected.metaData.model.name} (
                    {format(
                        selected.metaData.model.modified_at ?? new Date(),
                        "MMM dd",
                    )}{" "}
                    version)[Large Language Model]. Accessed on{" "}
                    {format(new Date(), "do MMM yyyy")}
                </div>
                <DialogFooter className="grid grid-cols-2">
                    <Button
                        variant="outline"
                        disabled={!previousFeedback}
                        onClick={() => {
                            previousFeedback && show(previousFeedback);
                        }}
                    >
                        <ArrowLeft />
                        {previousIndicator?.name ?? "Previous disciplinary"}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={!nextFeedback}
                        onClick={() => {
                            nextFeedback && show(nextFeedback);
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
