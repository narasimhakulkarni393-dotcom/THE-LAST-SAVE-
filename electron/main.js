// Electron Main Process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable GPU acceleration warnings
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow;
const isDev = process.argv.includes('--dev');

// Save file path
const userDataPath = app.getPath('userData');
const saveFilePath = path.join(userDataPath, 'thelastsave.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    resizable: true,
    fullscreenable: true,
    title: 'THE LAST SAVE',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    autoHideMenuBar: true,
    frame: true,
    show: false,
  });

  // Load the game
  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Save game
ipcMain.handle('save-game', async (event, saveData) => {
  try {
    const dataStr = JSON.stringify(saveData, null, 2);
    fs.writeFileSync(saveFilePath, dataStr, 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Save error:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Load game
ipcMain.handle('load-game', async (event) => {
  try {
    if (!fs.existsSync(saveFilePath)) {
      return { success: false, error: 'No save file found' };
    }
    const dataStr = fs.readFileSync(saveFilePath, 'utf8');
    const data = JSON.parse(dataStr);
    return { success: true, data };
  } catch (err) {
    console.error('Load error:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Delete save
ipcMain.handle('delete-save', async (event) => {
  try {
    if (fs.existsSync(saveFilePath)) {
      fs.unlinkSync(saveFilePath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Check save exists
ipcMain.handle('save-exists', async (event) => {
  return fs.existsSync(saveFilePath);
});

// IPC: Quit game
ipcMain.handle('quit-game', () => {
  app.quit();
});

// IPC: Toggle fullscreen
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});
