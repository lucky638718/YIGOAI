const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (command) => ipcRenderer.send('window-control', command),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getStoreVal: (key) => ipcRenderer.invoke('get-store-val', key),
  setStoreVal: (key, val) => ipcRenderer.invoke('set-store-val', key, val),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  getMediaFiles: () => ipcRenderer.invoke('get-media-files'),
  openApp: (appName) => ipcRenderer.send('open-app', appName),
  getDesktopSource: () => ipcRenderer.invoke('get-desktop-source'),
  getTTSAudio: (text) => ipcRenderer.invoke('get-tts-audio', text)
});
