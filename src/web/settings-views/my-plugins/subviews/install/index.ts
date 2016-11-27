'use strict';

import TextInputComponent from '../../../../components/text-input';
import CardComponent from '../../../../components/card';
import ButtonComponent from '../../../../components/button';
import ActivityPopupComponent from '../../../../components/activity-popup';
import { asyncFor } from 'then-utils';
import {
  ipcRenderer,
  remote
} from 'electron';
const {
  dialog,
  BrowserWindow
} = remote;
import { normalize } from 'path';

const searchCont = document.getElementById('settings--plugins-install-searchCont');
const infoCont = document.getElementById('settings--plugins-install-infoCont');
const infoPlaceholder = document.getElementById('settings--plugins-install-infoCont-placeholder');
const input = new TextInputComponent({
  id: 'settings--plugins-install-searchBox',
  placeholder: 'Enter a plugin name to install...'
});
const fileButton = new ButtonComponent({
  id: 'settings--plugins-install-installFile',
  text: 'Install from a PPZ'
});

input.on('focus', () => {
  (<object>searchCont.dataset).size = 'large';
});

input.on('blur', () => {
  (<object>searchCont.dataset).size = 'normal';
});

const setInstallHandler = () => {
  const popup = new ActivityPopupComponent({
    title: 'Installing...',
    status: 'Installing the plugin/package...',
    progress: 50,
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
    ipcRenderer.send('manager--install-getLogs');
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
    ipcRenderer.on('pluginInstall--log-chunk', chunkListener);
    let listenerAdded = true;
    ipcRenderer.once('pluginInstall--done', () => {
      if (listenerAdded) {
        listenerAdded = false;
        ipcRenderer.removeListener('pluginInstall--log-chunk', chunkListener);
      }
    });
    logWin.on('closed', () => {
      if (listenerAdded) {
        listenerAdded = false;
        ipcRenderer.removeListener('pluginInstall--log-chunk', chunkListener);
      }
      logWin = null;
    });
    logWin.loadURL(`file://${normalize(`${__dirname}/../../../../log-window/index.html`)}`);
    logWin.on('ready-to-show', () => {
      logWin.show();
    });
  });

  showLogs.appendTo(popup.bottomCont);
  popup.appendTo(document.body);

  ipcRenderer.once('pluginInstall--error', () => {
    setTimeout(() => {
      popup.status = 'Error while installing plugin. Try again later';
      popup.error = true;
      popup.spinning = false;
      popup.close.shown = true;
    }, 1000);
  });

  ipcRenderer.once('pluginInstall--done', () => {
    setTimeout(() => {
      popup.status = 'Done installing plugin';
      popup.progress = 100;
      popup.spinning = false;
      setTimeout(() => {
        popup.close.shown = true;
      }, 1000);
    }, 1000);
  });

  return popup;
};

input.on('submit', () => {
  input.blur();
  const pluginName = input.value;
  asyncFor(Array.prototype.slice.call(infoCont.children), (i, child) => {
    if (child !== infoPlaceholder) child.parentNode.removeChild(child);
    return Promise.resolve();
  }).then(() => {
    infoPlaceholder.classList.remove('shown');
    setTimeout(() => {
      window.fetch(`https://registry.npmjs.org/${pluginName}/latest`).then(res => {
        if (!res.ok) {
          return Promise.reject(new Error('Couldn\'t find the package! Try again... maybe? (maybe check your spelling?)'));
        }
        return res.json();
      }).then((json: object) => {
        const card = new CardComponent({
          title: (json.pipam) ? json.pipam.displayName : json.name,
          body: json.description || 'No description provided',
          footer: `${json.name} - ${json.version}`
        });
        const installButton = new ButtonComponent({
          text: 'Install'
        });
        installButton.on('click', () => {
          const popup = setInstallHandler();

          setTimeout(() => {
            popup.shown = true;
            setTimeout(() => {
              ipcRenderer.send('pluginInstall', json.name);
            }, 600);
          }, 1000);
        });
        card.bodyElm.appendChild(document.createElement('br'));
        installButton.appendTo(card.bodyElm);
        card.appendTo(infoCont);
      }).catch(err => {
        infoPlaceholder.innerHTML = err.message;
        infoPlaceholder.classList.add('shown');
      });
    }, 200);
  });
});

fileButton.on('click', () => {
  (<object>searchCont.dataset).size = 'normal';
  dialog.showOpenDialog({
    title: 'Choose a file',
    filters: [
      {
        name: 'Pipam Plugin Zip file',
        extensions: ['ppz']
      }
    ],
    properties: ['openFile']
  }, (pathnames) => {
    if (!pathnames || !pathnames[0]) return;

    const pathname = pathnames[0];
    const popup = setInstallHandler();

    setTimeout(() => {
      popup.shown = true;
      setTimeout(() => {
        ipcRenderer.send('pluginInstall--fromFile', pathname);
      }, 600);
    }, 1000);
  });
});

input.prependTo(searchCont);
fileButton.appendTo(searchCont);
