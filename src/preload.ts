// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { IpcResponse } from "./lib/types";

type Channels = string;

export const electronHandler = {
  ipcRenderer: {
    send(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on<Data>(
      channel: Channels,
      callback: (response: IpcResponse<Data>) => void,
    ): () => void {
      const listner = (_event: IpcRendererEvent, response: IpcResponse<Data>) =>
        callback(response);

      ipcRenderer.on(channel, listner);

      return () => {
        ipcRenderer.removeListener(channel, listner);
      };
    },
    once<Data>(
      channel: Channels,
      callback: (response: IpcResponse<Data>) => void,
    ) {
      ipcRenderer.once(channel, (_event, args) => callback(args));
    },
  },
};

contextBridge.exposeInMainWorld("electron", electronHandler);

export type ElectronHandler = typeof electronHandler;
