import {
  competenciesWithIncidactors,
  feedback,
  FeedbackMetaData,
  IpcGetFeedbackRequest,
  IpcGetFeedbackResponse,
  IpcGetModelsResponse,
  IpcPdfParseRequest,
  IpcPdfParseResponse,
  IpcResponse,
  IPC_CHANNEL,
} from "@/lib/types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Ollama } from "@langchain/ollama";
import { app, BrowserWindow, ipcMain } from "electron";
import Squirrel from "electron-squirrel-startup";
import ollama from "ollama";
import path from "path";
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
import { PdfReader } from "pdfreader";
import { updateElectronApp } from "update-electron-app";
import { INDICATOR_DOCUMENTS, postProcessResponse } from "./lib/llm";
import { FEEDBACK_TEMPLATE } from "./lib/systemTemplates";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

updateElectronApp();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (Squirrel) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 1280,
    minHeight: 832,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on(IPC_CHANNEL.PDF_PARSE, (event, request: IpcPdfParseRequest) => {
  const buffer = Buffer.from(request.fileData);

  let text = "";
  new PdfReader().parseBuffer(buffer, (error, item) => {
    if (error) {
      const response: IpcResponse<IpcPdfParseResponse> = {
        success: false,
        error: error,
      };

      event.reply(IPC_CHANNEL.PDF_PARSE, response);
      return;
    }

    if (!item) {
      if (text === "") {
        const response: IpcResponse<IpcPdfParseResponse> = {
          success: false,
          error: "File does not contain any text",
        };
        event.reply(IPC_CHANNEL.PDF_PARSE, response);
        return;
      }

      const response: IpcResponse<IpcPdfParseResponse> = {
        success: true,
        data: { text, fileName: request.fileName },
      };
      event.reply(IPC_CHANNEL.PDF_PARSE, response);
      return;
    }

    if (item.text) {
      text += item.text;
      return;
    }
  });
});

ipcMain.on(IPC_CHANNEL.GET_MODELS, async (event) => {
  try {
    const { models } = await ollama.list();
    const response: IpcResponse<IpcGetModelsResponse> = {
      success: true,
      data: models,
    };
    event.reply(IPC_CHANNEL.GET_MODELS, response);
  } catch {
    const response: IpcResponse<IpcGetModelsResponse> = {
      success: false,
      error: "Unable to fetch models",
    };
    event.reply(IPC_CHANNEL.GET_MODELS, response);
  }
});

const queue = new Map<string, IpcGetFeedbackRequest>();
const processing = new Set<string>();

ipcMain.on(
  IPC_CHANNEL.GET_FEEDBACK,
  async (event, request: IpcGetFeedbackRequest) => {
    queue.set(request.indicator.name, request);

    void processQueue(event);
  },
);

async function processQueue(event: Electron.IpcMainEvent) {
  const next = queue.entries().next();
  if (next.done) return;

  const [key, value] = next.value;

  queue.delete(key);

  console.log("[PROCESS]", key);
  const receivedFeedback = await getFeedback(value);
  console.log("[FEEDBACK]", key, receivedFeedback.success);

  event.reply(IPC_CHANNEL.GET_FEEDBACK, receivedFeedback);

  if (!receivedFeedback.success) queue.set(key, value);
  processing.delete(key);
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 20 * 1000 + 10_000),
  );
  void processQueue(event);
}

// TODO: spawn child process for each request
async function getFeedback(
  request: IpcGetFeedbackRequest,
): Promise<IpcResponse<IpcGetFeedbackResponse>> {
  try {
    // TODO: make processing size dependent on the model size and available resources
    if (processing.size > 3) {
      return {
        success: false,
        error: "Waiting for resources to free up",
      };
    }
    processing.add(request.indicator.name);

    const indicatorText = INDICATOR_DOCUMENTS.find(
      (document) => document.indicator === request.indicator.name,
    );

    if (!indicatorText) {
      return {
        success: false,
        error: "Indicator not found",
      };
    }

    const competency = competenciesWithIncidactors.find(({ indicators }) =>
      indicators.some(({ name }) => name === request.indicator.name),
    )?.name;

    if (!competency) {
      return {
        success: false,
        error: "Competency not found",
      };
    }

    const llm = new Ollama({
      model: request.model.name,
      format: "json",
      temperature: 0.9,
      // numCtx: 1000,
      // temperature: 0.2,
      // embeddingOnly: true,
      // frequencyPenalty: 1.6,
      // repeatPenalty: 1.8,
      // mirostatTau: 3,
      // topK: 10,
      // topP: 0.5,
    });

    const chat = [
      new SystemMessage(
        FEEDBACK_TEMPLATE.replace("{indicator_text}", indicatorText.text),
      ),
      new HumanMessage(
        "I will now provide you with the documents to grade, each document will have a title and the content of the document:",
      ),
      ...request.documents.map(
        ({ name, text }) => new HumanMessage(`\n# ${name}\n\n${text}`),
      ),
      new HumanMessage(
        `what grade ("novice", "competent", "proficient", or "visionary") and feedback would you give the student for given the competency ${indicatorText.competency} and indicator ${request.indicator.name}?`,
      ),
    ];

    const result = await llm.invoke(chat);
    const json = JSON.parse(result.toString());

    if (typeof json !== "object") {
      return {
        success: false,
        error: "Invalid response",
      };
    }

    const processed = postProcessResponse(json);

    const metaData: Omit<FeedbackMetaData, "date"> = {
      model: request.model,
      prompt: chat.map(({ content }) => content).join("\n\n"),
      competency,
      indicator: request.indicator.name,
    };

    const data = feedback.parse({ ...processed, metaData });

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: `${error}`,
    };
  }
}
