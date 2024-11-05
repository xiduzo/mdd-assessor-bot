import {
  IpcGetModelsResponse,
  IpcPdfParseRequest,
  IpcPdfParseResponse,
  IpcResponse,
  IPC_CHANNEL,
} from "@/lib/types";
import { app, BrowserWindow, ipcMain } from "electron";
import Squirrel from "electron-squirrel-startup";
import ollama from "ollama";
import path from "path";
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
import { PdfReader } from "pdfreader";
import { updateElectronApp } from "update-electron-app";

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

ipcMain.on(IPC_CHANNEL.GET_FEEDBACK, async (event) => {
  try {
    console.log("event", event);
  } catch (error) {
    console.log(error);
    event.reply(IPC_CHANNEL.GET_FEEDBACK, {});
  }
});
