const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ctx7proxy', {
  getState: () => ipcRenderer.invoke('settings:get'),
  addAccount: (account) => ipcRenderer.invoke('accounts:add', account),
  removeAccount: (id) => ipcRenderer.invoke('accounts:remove', id),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  openExternal: (url) => ipcRenderer.invoke('external:open', url)
});
