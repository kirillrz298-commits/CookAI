import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;

function startBackend() {
  const serverScript = path.join(app.getAppPath(), 'server', 'index.ts');
  const tsxBin = path.join(app.getAppPath(), 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  
  console.log('[CookBook AI] Starting backend server:', serverScript);
  serverProcess = spawn(tsxBin, [serverScript], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '3001' },
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (err) => {
    console.error('[CookBook AI] Backend failed to start:', err);
  });
}

async function handleSelectFile() {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.filePaths[0] || null;
}

async function handleSaveFile(_event: Electron.IpcMainInvokeEvent, defaultName: string, content: string) {
  const result = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('downloads'), defaultName),
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    await fs.writeFile(result.filePath, content, 'utf-8');
    return result.filePath;
  }
  return null;
}

function handleGetVersion() {
  return app.getVersion();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'CookBook AI Library & Learning Center',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Remove default menu for cleaner look
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[CookBook AI] Loading app from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  
  ipcMain.handle('dialog:selectFile', handleSelectFile);
  ipcMain.handle('file:save', handleSaveFile);
  ipcMain.handle('app:getVersion', handleGetVersion);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
