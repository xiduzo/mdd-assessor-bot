import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Competency, Grade, grades } from "@/lib/types";
import { ProgressProps } from "@radix-ui/react-progress";
import { cva } from "class-variance-authority";
import {
    Eye,
    FlaskConical,
    Frame,
    LucideProps,
    MoveUpRight,
    Radar,
} from "lucide-react";
import { RefAttributes, useMemo } from "react";

export function CompetencyIcon(
    props: { competency: Competency } & Omit<LucideProps, "ref"> &
        RefAttributes<SVGSVGElement>,
) {
    switch (props.competency) {
        case "self-directed learning":
            return <MoveUpRight {...props} />;
        case "concepting and ideation":
            return <Radar {...props} />;
        case "reflection and awareness":
            return <Eye {...props} />;
        case "framing and strategising":
            return <Frame {...props} />;
        case "creating and crafting":
            return <FlaskConical {...props} />;
    }
}

export function CompetencyIconWithBackground(props: {
    competency: Competency;
}) {
    return (
        <div
            aria-hidden
            className={competencyBackground({
                indicator: props.competency,
                className:
                    "w-14 min-w-14 h-14 min-h-14 rounded-lg flex items-center justify-center",
            })}
        >
            <CompetencyIcon competency={props.competency} size={20} />
        </div>
    );
}

const competencyBackground = cva("", {
    variants: {
        indicator: {
            "self-directed learning": "bg-yellow-100",
            "concepting and ideation": "bg-pink-200",
            "reflection and awareness": "bg-violet-200",
            "framing and strategising": "bg-sky-200",
            "creating and crafting": "bg-teal-200",
        },
    },
});

export function IndicatorGradeProgress(props: { grade?: Grade }) {
    return (
        <section
            className="flex flex-col items-end space-y-1"
            aria-label={`Grade: ${props.grade}`}
        >
            <span className="text-neutral-400 text-xs first-letter:uppercase">
                {props.grade ?? <Skeleton className="w-16 h-4" />}
            </span>
            <section className="flex space-x-1">
                {grades.map((grade) => (
                    <IndicatorGradeIndication
                        key={grade}
                        grade={grade}
                        achievedGrade={props.grade}
                    />
                ))}
            </section>
        </section>
    );
}

function IndicatorGradeIndication(props: {
    grade: Grade;
    achievedGrade?: Grade;
}) {
    const isActive = useMemo(() => {
        if (!props.achievedGrade) return false;

        return (
            grades.indexOf(props.grade) <= grades.indexOf(props.achievedGrade)
        );
    }, [props.grade, props.achievedGrade]);

    return (
        <div
            className={gradeIndication({
                grade: props.achievedGrade,
                isActive,
            })}
        ></div>
    );
}

const gradeIndication = cva("w-6 h-2 bg-green-400 rounded-sm", {
    variants: {
        grade: {
            undefined: "animate-pulse",
            novice: "transition-colors duration-700",
            competent: "transition-colors duration-700",
            proficient: "transition-colors duration-700",
            visionary: "transition-colors duration-700",
        },
        isActive: {
            true: "",
            false: "bg-neutral-300",
        },
    },
    defaultVariants: {
        isActive: false,
    },
    compoundVariants: [
        {
            grade: "novice",
            isActive: true,
            className: "bg-red-500",
        },
        {
            grade: "competent",
            isActive: true,
            className: "bg-yellow-500",
        },
        {
            grade: "proficient",
            isActive: true,
            className: "bg-lime-500",
        },
        {
            grade: "visionary",
            isActive: true,
            className: "bg-green-500",
        },
    ],
});

export function CompetencyProgress(
    props: {
        competency: Competency;
    } & Omit<ProgressProps & React.RefAttributes<HTMLDivElement>, "ref">,
) {
    return (
        <Progress
            {...props}
            className={competencyProgress({
                competency: props.competency,
                className: props.className,
            })}
        />
    );
}

const competencyProgress = cva("", {
    variants: {
        competency: {
            "self-directed learning": "[&>*]:bg-yellow-100",
            "concepting and ideation": "[&>*]:bg-pink-200",
            "reflection and awareness": "[&>*]:bg-violet-200",
            "framing and strategising": "[&>*]:bg-sky-200",
            "creating and crafting": "[&>*]:bg-teal-200",
        },
    },
});
