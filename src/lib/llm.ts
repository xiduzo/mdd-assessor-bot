import { competenciesWithIncidactors } from "@/lib/types";

export function postProcessResponse(input: Record<string, unknown>) {
  return Object.keys(input).reduce(
    (acc, key) => {
      const value = input[key];
      const lowerKey = key.toLowerCase();

      if (
        [
          "grade",
          "grading",
          "score",
          "rating",
          "overall",
          "result",
          "value",
        ].includes(lowerKey)
      ) {
        switch (typeof value) {
          case "object":
            if (value === null) break;
            if ("level" in value)
              acc.grade = (value as Record<string, unknown>).level;
            if ("value" in value)
              acc.grade = (value as Record<string, unknown>).value;
            if ("grade" in value)
              acc.grade = (value as Record<string, unknown>).grade;
            break;
          case "number":
          case "string":
          default:
            acc.grade = value;
            break;
        }

        return acc;
      }

      acc[lowerKey] = value;
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

export const INDICATOR_DOCUMENTS = competenciesWithIncidactors.flatMap(
  (competency) => {
    let competencyText = ``;
    competencyText += `# Competency: ${competency.name} (${competency.abbreviation})`;
    competencyText += `\n`;
    competencyText += competency.description;
    competencyText += `\n\n`;

    const indicators = competency.indicators.map((indicator) => {
      let indicatorText = competencyText;
      indicatorText += `## Indicator: ${indicator.name}`;
      indicatorText += `\n`;
      indicatorText += indicator.description;
      indicatorText += `\n\n`;

      indicatorText += `### Expectations`;
      indicatorText += `\n`;
      indicatorText += indicator.expectations;
      indicatorText += `\n\n`;

      indicatorText += `| grade  | expectations   |`;
      indicatorText += `\n`;
      indicatorText += `|--------|----------------|`;
      indicatorText += `\n`;

      indicator.grades.forEach((grade) => {
        indicatorText += `| ${grade.grade} |`;
        indicatorText += grade.expectations
          .map((expectation) => expectation.slice(0, -1))
          .join(" and ");

        indicatorText += `|`;
        indicatorText += `\n`;
      });

      return { indicator, indicatorText };
    });

    return indicators.map((indicator) => ({
      competency: competency.name,
      indicator: indicator.indicator.name,
      text: indicator.indicatorText,
    }));
  },
);
