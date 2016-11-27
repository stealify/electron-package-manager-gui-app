'use strict';

import {
  ipcRenderer,
  remote
} from 'electron';

const { getCurrentWindow } = remote;

(<object>window).requireNoCache = (id: string) => {
  // force require to recall the module
  require.cache[require.resolve(id)] = undefined;
  return require(id);
};

const titlebar = document.getElementById('titlebar');
const titlebarWindowCtrls = document.getElementById('titlebar--window-controls');
const closeWindow = document.getElementById('titlebar--close-window');
const minizeWindow = document.getElementById('titlebar--minimize-window');
const maximizeWindow = document.getElementById('titlebar--maximize-window');
titlebar.classList.add(process.platform);

closeWindow.addEventListener('click', () => {
  getCurrentWindow().close();
});
minizeWindow.addEventListener('click', () => {
  getCurrentWindow().minimize();
});
maximizeWindow.addEventListener('click', () => {
  const window = getCurrentWindow();
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

// platform specific features
if (process.platform === 'darwin') {
  titlebar.addEventListener('dblclick', () => {
    maximizeWindow.click();
  });
}
if (process.platform === 'win32') {
  // windows just *has* to do everything the wrong way
  // we have to make the close button on the right instead
  titlebarWindowCtrls.appendChild(closeWindow);
}
