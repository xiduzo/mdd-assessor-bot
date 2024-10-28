import { SYSTEM_TEMPLATE } from "@/lib/systemTemplate";
import { competenciesWithIncidactors, DocumentMetaData } from "@/lib/types";
import { Document } from "@langchain/core/documents";
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {} from "@langchain/core/tools";
import { OllamaEmbeddings } from "@langchain/ollama";
import {
  MarkdownTextSplitter,
  RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import ollama, { ModelResponse } from "ollama";
import { toast } from "sonner";

// TODO: allow the user to set the embeddings model params
export const competencySplitter = new MarkdownTextSplitter({
  chunkSize: 500,
  chunkOverlap: 20,
});

export const documentSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 300,
  chunkOverlap: 20,
});

export async function createVectorStore(
  model: ModelResponse,
  initialDocuments: Document[] = [],
) {
  const splitDocs = await competencySplitter.createDocuments(
    INDICATOR_DOCUMENTS.map((competency) => competency.text),
    INDICATOR_DOCUMENTS.map(
      (competency): DocumentMetaData => ({
        name: `${competency.competency} - ${competency.indicator}`,
        competency: competency.competency,
        indicator: competency.indicator,
        lastModified: Date.now(),
        type: "grading reference",
      }),
    ),
  );

  return MemoryVectorStore.fromDocuments(
    [...splitDocs, ...initialDocuments],
    new OllamaEmbeddings({ model: model.name }),
  );
}

export async function createRunner(
  llm: LanguageModelLike,
  vectorStore: MemoryVectorStore,
) {
  const retriever = vectorStore.asRetriever();

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    ["human", "{input}"],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  return createRetrievalChain({
    retriever,
    combineDocsChain: questionAnswerChain,
  });
}

export async function getModel(
  modelName: string,
  availableModels: ModelResponse[],
): Promise<ModelResponse | null> {
  const model = availableModels.find(({ name }) => name === modelName);

  if (model) {
    return model;
  }

  const downloadToast = toast.info(`${modelName} not found on your machine`, {
    dismissible: true,
    duration: 999_999,
    important: true,
    description: "Downloading model, this might take a while",
  });

  const response = await ollama.pull({ model: modelName });

  if (response.status === "success") {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Give some time for the model to be available
    toast.dismiss(downloadToast);
    return getModel(modelName, availableModels);
  }

  toast.warning(`Model ${modelName} is not available`, {
    description: "Please select another model",
  });

  return null;
}

export function postProcessResponse(input: Record<string, unknown>) {
  return Object.keys(input).reduce(
    (acc, key) => {
      const value = input[key];
      const lowerKey = key.toLowerCase();

      if (
        ["grade", "grading", "score", "rating", "overall", "result"].includes(
          lowerKey,
        )
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

const INDICATOR_DOCUMENTS = competenciesWithIncidactors.flatMap(
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

      console.log(indicatorText);

      return { indicator, indicatorText };
    });

    return indicators.map((indicator) => ({
      competency: competency.name,
      indicator: indicator.indicator.name,
      text: indicator.indicatorText,
    }));
  },
);
