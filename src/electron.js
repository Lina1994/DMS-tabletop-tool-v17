// src/electron.js
let ipcRenderer = null;
let path = null;

if (window.require) {
  try {
    const electron = window.require('electron');
    if (electron && electron.ipcRenderer) {
      ipcRenderer = electron.ipcRenderer;
    }
  } catch (e) {
    console.warn("Could not load electron.ipcRenderer:", e);
  }

  try {
    path = window.require('path');
  } catch (e) {
    console.warn("Could not load Node.js 'path' module:", e);
  }
}

export { ipcRenderer, path };
