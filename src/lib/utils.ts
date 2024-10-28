import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toString(value: unknown): string {
  switch (typeof value) {
    case "number":
    case "string":
    case "boolean":
      return `${value}`;
    case "object":
      // TODO: Handle nested objects
      if (Array.isArray(value)) {
        return value.map((c) => `- ${toString(c)}`).join("\n");
      }

      if (value === null) {
        return "";
      }

      return Object.keys(value).reduce((acc, item) => {
        const val = (value as Record<string, unknown>)[item];
        return acc + `${toString(val)}`;
      }, "");
    default:
      console.error(`Unknown type: ${typeof value}`, value);
      return "";
  }
}

export function jsonToMarkdown(
  json: Record<string, unknown> = {},
  excludedKeys: string[] = [],
) {
  let markdown = "";

  for (const item in json) {
    if (excludedKeys.includes(item.toLowerCase())) continue;

    const content = toString(json[item]);

    if (!content || content === "") continue; // prevent rendering empty headers

    markdown += `# ${item.replaceAll("_", " ")}\n`;
    markdown += toString(json[item]);
    markdown += "\n\n";
  }

  return markdown;
}
