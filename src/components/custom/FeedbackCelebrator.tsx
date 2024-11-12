import { competenciesWithIncidactors } from "@/lib/types";
import { useCelebration } from "@/providers/CelebrationProvider";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useEffect } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

export function FeedbackCelebrator() {
    const feedback = useFeedbackStore(useShallow((state) => state.feedback));

    const { celebrate } = useCelebration();

    useEffect(() => {
        const expectedGrades = competenciesWithIncidactors.reduce(
            (acc, { indicators }) => acc + indicators.length,
            0,
        );

        const grades = feedback.map(({ grade }) => grade);
        if (grades.length < expectedGrades) return;

        if (grades.includes("novice")) return;
        if (Math.random() > 0.66) {
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
        celebrate(
            "You've beaten the LLM, are you ready for your human assessors?",
        );
    }, [feedback, celebrate]);

    return null;
}
