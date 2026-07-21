const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ctx7proxy', {
  getState: () => ipcRenderer.invoke('settings:get'),
  getSetupGuides: () => ipcRenderer.invoke('setup:get'),
  copyText: (value) => ipcRenderer.invoke('clipboard:write', value),
  addAccount: (account) => ipcRenderer.invoke('accounts:add', account),
  removeAccount: (id) => ipcRenderer.invoke('accounts:remove', id),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  openExternal: (url) => ipcRenderer.invoke('external:open', url)
});
