import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Competency, IndicatorLevel, indicatorLevels } from "@/lib/types";
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

export function CompetencyDisplay(props: { competency: Competency }) {
  return (
    <span className="inline-block first-letter:capitalize">
      {props.competency.replaceAll("-", " ")}
    </span>
  );
}

export function CompetencyIcon(
  props: { competency: Competency } & Omit<LucideProps, "ref"> &
    RefAttributes<SVGSVGElement>,
) {
  switch (props.competency) {
    case "self-directed-learning":
      return <MoveUpRight {...props} />;
    case "concepting-and-ideation":
      return <Radar {...props} />;
    case "reflection-and-awareness":
      return <Eye {...props} />;
    case "framing-and-strategising":
      return <Frame {...props} />;
    case "creating-and-crafting":
      return <FlaskConical {...props} />;
  }
}

export function CompetencyIconWithBackground(props: {
  competency: Competency;
}) {
  return (
    <div
      className={competencyBackground({
        indicator: props.competency,
        className: "w-10 h-10 rounded-lg flex items-center justify-center",
      })}
    >
      <CompetencyIcon competency={props.competency} size={20} />
    </div>
  );
}

const competencyBackground = cva("", {
  variants: {
    indicator: {
      "self-directed-learning": "bg-yellow-100",
      "concepting-and-ideation": "bg-pink-200",
      "reflection-and-awareness": "bg-violet-200",
      "framing-and-strategising": "bg-sky-200",
      "creating-and-crafting": "bg-teal-200",
    },
  },
});

export function IndicatorLevelProgress(props: { grade?: IndicatorLevel }) {
  return (
    <section className="flex flex-col items-end space-y-1">
      <span className="text-neutral-400 text-xs first-letter:uppercase">
        {props.grade ?? <Skeleton className="w-16 h-3" />}
      </span>
      <section className="flex space-x-1">
        {indicatorLevels.map((level) => (
          <IndicatorLevelIndication
            key={level}
            level={level}
            achievedLevel={props.grade}
          />
        ))}
      </section>
    </section>
  );
}

function IndicatorLevelIndication(props: {
  level: IndicatorLevel;
  achievedLevel?: IndicatorLevel;
}) {
  const isActive = useMemo(() => {
    if (!props.achievedLevel) return false;

    return (
      indicatorLevels.indexOf(props.level) <=
      indicatorLevels.indexOf(props.achievedLevel)
    );
  }, [props.level, props.achievedLevel]);

  return (
    <div
      className={levelIndication({ level: props.achievedLevel, isActive })}
    ></div>
  );
}

const levelIndication = cva("w-6 h-2 bg-green-400 rounded-sm", {
  variants: {
    level: {
      undefined: "animate-pulse",
      novice: "",
      competent: "",
      proficient: "",
      visionary: "",
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
      level: "novice",
      isActive: true,
      className: "bg-red-500",
    },
    {
      level: "competent",
      isActive: true,
      className: "bg-yellow-500",
    },
    {
      level: "proficient",
      isActive: true,
      className: "bg-lime-500",
    },
    {
      level: "visionary",
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
      "self-directed-learning": "[&>*]:bg-yellow-100",
      "concepting-and-ideation": "[&>*]:bg-pink-200",
      "reflection-and-awareness": "[&>*]:bg-violet-200",
      "framing-and-strategising": "[&>*]:bg-sky-200",
      "creating-and-crafting": "[&>*]:bg-teal-200",
    },
  },
});
