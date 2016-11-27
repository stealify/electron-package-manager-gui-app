'use strict';

import { ipcRenderer, remote, shell } from 'electron';
const {
  BrowserWindow,
  Menu // for Windows
} = remote;
const { openExternal } = shell;
import { normalize, join as joinPath } from 'path';
import { asyncFor } from 'then-utils';
import { gt as semverGt } from 'semver';

import ActivityPopupComponent from './components/activity-popup';
import ButtonComponent from './components/button';
import DropdownComponent from './components/dropdown';
import ToastComponent, { ToastType } from './components/toast';

import toastManager from './managers/toasts';

import { version as appVersion } from '../../package.json';

//
// constants that could change

const appDownloadUrl = 'https://pipam.github.io/out/views/download/index.html';

// end constants that could change
//

//
// platform specific imports

// Windows
import { readFileSync } from 'fs';
import { toObject, render } from '../lib/menu';

const appJson = require('../app.json');
let appCfg = appJson;

if (process.env.NODE_ENV === 'testing') {
  appCfg = appJson.testing;
}

import * as menuCommands from '../menuCommands';
const menuJson = render(readFileSync(joinPath(__dirname, '..', 'menu.json'), 'utf-8'), appCfg);

// end platform specific imports
//

(<object>window).requireNoCache = (id: string): object => {
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
  ipcRenderer.send('closeWindow');
});
minizeWindow.addEventListener('click', () => {
  ipcRenderer.send('minimizeWindow');
});
maximizeWindow.addEventListener('click', () => {
  ipcRenderer.send('toggleMaximization');
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

const settings = new ButtonComponent({
  text: 'Settings'
});
const settingsButtonCont = document.getElementById('settingsButtonCont');
const settingsCont = document.getElementById('settingsCont');
const settingsContCont = document.getElementById('settingsContCont');
settings.on('click', () => {
  (<object>settingsContCont.dataset).url = null;
  settingsContCont.classList.remove('shown');
  settingsCont.classList.toggle('shown');
  setTimeout(() => {
    (<HTMLButtonElement>document.getElementById('settingsNav').children[0]).click();
  }, 500);
});
settings.appendTo(settingsButtonCont);

const pluginSelect = new DropdownComponent();
const pluginSelectCont = document.getElementById('pluginSelectCont');
pluginSelect.setOptions([]);
pluginSelect.on('select', opt => {
  ipcRenderer.send('activatePlugin', opt.dataset.packageName);
});
pluginSelect.appendTo(pluginSelectCont);

if (process.platform === 'win32' || process.platform === 'linux') {
  // we need this because:
  // a) on Windows, by removing the frame, we also remove the menubar
  // b) on Linux, when using X over SSH, there is no menubar included (on XQuartz)

  const appMenu = Menu.buildFromTemplate(toObject(menuJson, appCfg, menuCommands).submenu);

  const menu = new ButtonComponent({
    text: 'Menu'
  });
  menu.on('click', () => {
    appMenu.popup();
  });
  const floatedCont = document.getElementById('floatedCont');
  const menuButtonCont = document.getElementById('menuButtonCont');

  menu.appendTo(menuButtonCont);
  if (process.platform === 'linux') floatedCont.appendChild(menuButtonCont);
}

function loadPluginList(): Promise<void> {
  return new Promise((resolve, reject) => {
    pluginSelect.setOptions([]);
    ipcRenderer.once('pluginList', (e, list: object[]) => {
      asyncFor(list, (i, item) => {
        return pluginSelect.addOption({
          name: item.displayName,
          data: {
            packageName: item.name
          }
        }).then((i) => {
          if (item.active) {
            pluginSelect.selected = i;
          }
        });
      }).then(() => resolve(), reject);
    });
    ipcRenderer.send('getPluginList');
  });
}

ipcRenderer.on('reloadPlugins', loadPluginList);
loadPluginList();

ipcRenderer.on('firstTime', () => {
  const popup = new ActivityPopupComponent({
    title: 'First Time Startup',
    status: 'Configuring application for first time use...',
    progress: 0,
    spinning: true
  });
  const showLogs = new ButtonComponent({
    text: 'Show Logs'
  });
  let logWin = null;

  showLogs.shown = true;

  popup.once('close', () => {
    popup.disown();
    if (logWin) logWin.close();
  });

  showLogs.once('click', () => {
    // the first time it's clicked
    ipcRenderer.send('firstTime--getLogs');
  });

  showLogs.on('click', () => {
    if (logWin) return logWin.focus();
    logWin = new BrowserWindow({
      title: 'Log',
      width: 500,
      height: 700,
      frame: (process.platform === 'darwin') ? true : false,
      titleBarStyle: 'hidden-inset',
      show: false
    });
    const chunkListener = (e, chunk) => {
      logWin.webContents.send('log-chunk', chunk);
    };
    ipcRenderer.on('firstTime--log-chunk', chunkListener);
    let listenerAdded = true;
    ipcRenderer.once('firstTime--done', () => {
      if (listenerAdded) {
        listenerAdded = false;
        ipcRenderer.removeListener('firstTime--log-chunk', chunkListener);
      }
    });
    logWin.on('closed', () => {
      if (listenerAdded) {
        listenerAdded = false;
        ipcRenderer.removeListener('firstTime--log-chunk', chunkListener);
      }
      logWin = null;
    });
    logWin.loadURL(`file://${normalize(`${__dirname}/log-window/index.html`)}`);
    logWin.on('ready-to-show', () => {
      logWin.show();
    });
  });

  showLogs.appendTo(popup.bottomCont);
  popup.appendTo(document.body);

  ipcRenderer.once('firstTime--installingDefaultPlugin', (e, name) => {
    setTimeout(() => {
      popup.status = `Installing default platform plugin ('${name}')...`;
      popup.progress = 80;
    }, 1000);
  });

  ipcRenderer.once('firstTime--noDefaultPlugin', () => {
    setTimeout(() => {
      popup.status = 'No default plugin available for your platform!';
      popup.progress = 80;
    });
  });

  ipcRenderer.once('firstTime--done', () => {
    setTimeout(() => {
      popup.status = 'Done configuring application for first time use';
      popup.progress = 100;
      popup.spinning = false;
      setTimeout(() => {
        popup.close.shown = true;
      }, 1000);
    }, 1000);
  });

  ipcRenderer.once('firstTime--error', () => {
    setTimeout(() => {
      popup.status = 'Error while configuring application for first time use. Try quiting and reopening it';
      popup.error = true;
      popup.spinning = false;
    }, 1000);
  });

  setTimeout(() => {
    popup.shown = true;
    setTimeout(() => {
      ipcRenderer.send('firstTime--messageShown');
    }, 600);
  }, 1000);
});

let aboutWin = null;

ipcRenderer.on('wantsAbout', () => {
  if (aboutWin) return aboutWin.focus();
  aboutWin = new BrowserWindow({
    title: 'About',
    width: 700,
    height: 500,
    frame: (process.platform === 'darwin') ? true : false,
    titleBarStyle: 'hidden-inset',
    show: false
  });
  aboutWin.on('closed', () => {
    aboutWin = null;
  });
  aboutWin.loadURL(`file://${normalize(`${__dirname}/about-window/index.html`)}`);
  aboutWin.on('ready-to-show', () => {
    aboutWin.show();
  });
});

if (process.env.NODE_ENV !== 'testing') ipcRenderer.send('listeningOnIPC');

window.fetch('https://api.github.com/repos/pipam/pipam/releases/latest').then(res => {
  if (!res.ok) return Promise.reject(new Error('Couldn\'t fetch latest release version'));
  return res.json();
}).then(json => {
  const latestStr: string = (json.tag_name.startsWith('v')) ? json.tag_name.substr(1) : json.tag_name;
  if (semverGt(latestStr, appVersion as string)) {
    const updateToast = new ToastComponent({
      title: 'Update available!',
      text: 'There\'s an update available! Wanna check it out?',
      actions: [
        {
          label: 'Sure!',
          onclick() {
            openExternal(appDownloadUrl);
            updateToast.hide();
          }
        },
        {
          label: 'Nah, I\'m good.',
          onclick() {
            updateToast.hide();
          }
        }
      ]
    });
    toastManager.add(updateToast, false);
  }
}).catch(err => {
  toastManager.onetime({
    title: 'Something blew up!',
    text: `There was an error while checking for an update:<br>${err.message}`,
    type: ToastType.Error,
    timeout: 10000
  });
  console.log(`Error checking for update; full stack: ${err.stack}`);
});