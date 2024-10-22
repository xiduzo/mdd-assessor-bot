// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

type Channels = string;

export const electronHandler = {
  ipcRenderer: {
    send(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on<T>(channel: Channels, func: (...args: T[]) => void): () => void {
      const subscription = (_event: IpcRendererEvent, ...args: T[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once<T>(channel: Channels, func: (...args: T[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld("electron", electronHandler);

export type ElectronHandler = typeof electronHandler;
