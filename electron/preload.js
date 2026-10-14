// Preload script - bridges renderer and main process securely
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (data) => ipcRenderer.invoke('save-game', data),
  loadGame: () => ipcRenderer.invoke('load-game'),
  deleteSave: () => ipcRenderer.invoke('delete-save'),
  saveExists: () => ipcRenderer.invoke('save-exists'),
  quitGame: () => ipcRenderer.invoke('quit-game'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
});
