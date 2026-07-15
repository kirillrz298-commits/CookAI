import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  saveFile: (defaultName: string, content: string) => ipcRenderer.invoke('file:save', defaultName, content),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
});
