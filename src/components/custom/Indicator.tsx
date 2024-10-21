import { Progress } from "@/components/ui/progress";
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

export const indicators = [
  "self-directed-learning",
  "concepting-and-ideation",
  "reflection-and-awareness",
  "framing-and-strategising",
  "creating-and-crafting",
] as const;
export type Indicator = (typeof indicators)[number];

const indicatorLevels = [
  "novice",
  "competent",
  "proficient",
  "visionary",
] as const;
type IndicatorLevel = (typeof indicatorLevels)[number];

export function IndictorIcon(
  props: { indicator: Indicator } & Omit<LucideProps, "ref"> &
    RefAttributes<SVGSVGElement>,
) {
  switch (props.indicator) {
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

export function IndicatorIconWithBackground(props: { indicator: Indicator }) {
  return (
    <div
      className={indicatorBackground({
        indicator: props.indicator,
        className: "w-10 h-10 rounded-lg flex items-center justify-center",
      })}
    >
      <IndictorIcon indicator={props.indicator} size={20} />
    </div>
  );
}

const indicatorBackground = cva("", {
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

export function IndicatorLevel(props: { level: IndicatorLevel }) {
  return (
    <section className="flex flex-col items-end space-y-1">
      <span className="text-muted-foreground text-xs first-letter:uppercase">
        {props.level}
      </span>
      <section className="flex space-x-1">
        {indicatorLevels.map((level) => (
          <IndicatorLevelIndication
            key={level}
            level={level}
            achievedLevel={props.level}
          />
        ))}
      </section>
    </section>
  );
}

function IndicatorLevelIndication(props: {
  level: IndicatorLevel;
  achievedLevel: IndicatorLevel;
}) {
  const isActive = useMemo(() => {
    return (
      indicatorLevels.indexOf(props.level) <=
      indicatorLevels.indexOf(props.achievedLevel)
    );
  }, [props.level, props.achievedLevel]);

  return (
    <div
      className={levelIndicator({ level: props.achievedLevel, isActive })}
    ></div>
  );
}

const levelIndicator = cva("w-6 h-2 bg-green-400 rounded-sm", {
  variants: {
    level: {
      novice: "bg-red-500",
      competent: "bg-yellow-500",
      proficient: "bg-lime-500",
      visionary: "bg-green-500",
    },
    isActive: {
      true: "",
      false: "bg-neutral-300",
    },
  },
});

export function IndicatorProgress(
  props: {
    indicator: Indicator;
  } & Omit<ProgressProps & React.RefAttributes<HTMLDivElement>, "ref">,
) {
  return (
    <Progress
      {...props}
      className={indicatorProgress({
        indicator: props.indicator,
        className: props.className,
      })}
    />
  );
}

const indicatorProgress = cva("", {
  variants: {
    indicator: {
      "self-directed-learning": "[&>*]:bg-yellow-100",
      "concepting-and-ideation": "[&>*]:bg-pink-200",
      "reflection-and-awareness": "[&>*]:bg-violet-200",
      "framing-and-strategising": "[&>*]:bg-sky-200",
      "creating-and-crafting": "[&>*]:bg-teal-200",
    },
  },
});
