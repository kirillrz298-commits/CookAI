export interface IElectronAPI {
  selectFile: () => Promise<string | null>;
  saveFile: (defaultName: string, content: string) => Promise<string | null>;
  getVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
