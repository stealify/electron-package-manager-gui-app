'use strict';

import TextInputComponent from '../../components/text-input';
import ButtonComponent from '../../components/button';
import ActivityPopupComponent from '../../components/activity-popup';
import {
  ipcRenderer,
  remote
} from 'electron';
const { BrowserWindow } = remote;
import { normalize } from 'path';
const { resCodes } = require('../../resources/messages.json');

const random = (min, max) => (Math.floor(Math.random() * (max - min + 1)) + min);

const inputCont = document.getElementById('install--inputCont');
const infoPlaceholder = document.getElementById('install--infoCont-placeholder');
const infoHeader = document.getElementById('install--infoCont-header');
const infoHeading = document.getElementById('install--infoCont-heading');
const infoBody = document.getElementById('install--infoCont-body');
const infoFooter = document.getElementById('install--infoCont-footer');

const input = new TextInputComponent({
  id: 'install--inputBox',
  placeholder: 'Enter a package name to install...'
});

input.on('focus', () => {
  (<object>inputCont.dataset).size = 'large';
});

input.on('blur', () => {
  (<object>inputCont.dataset).size = 'normal';
});

input.on('submit', () => {
  input.blur();
  const packageName = input.value;
  infoPlaceholder.innerHTML = 'Loading...';
  for (const child of Array.prototype.slice.call(infoHeader.children)) {
    if (child !== infoHeading) child.parentNode.removeChild(child);
  }
  infoHeading.innerHTML = '';
  infoBody.innerHTML = '';
  infoFooter.innerHTML = '';
  setTimeout(() => {
    ipcRenderer.once('packages--info-result', (e, res, code) => {
      if (code === 200) {
        infoHeading.innerText = res.displayName || res.name;
        infoBody.innerHTML = res.description.split('\n\n').map(str => `<p>${str}</p>`).join('\n');
        infoFooter.innerHTML = `<span>${res.name} - ${res.version}</span>`;
        const button = new ButtonComponent({
          text: 'Install'
        });
        button.on('click', () => {
          const popup = new ActivityPopupComponent({
            title: 'Installing...',
            status: 'Installing the package...',
            spinning: true,
            progress: 0
          });
          const showLogs = new ButtonComponent({
            text: 'Show Logs'
          });
          let logWin = null;

          showLogs.shown = false;

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
            ipcRenderer.on('manager--install-log-chunk', chunkListener);
            let listenerAdded = true;
            ipcRenderer.once('manager--install-done', () => {
              if (listenerAdded) {
                listenerAdded = false;
                ipcRenderer.removeListener('manager--install-log-chunk', chunkListener);
              }
            });
            logWin.on('closed', () => {
              if (listenerAdded) {
                listenerAdded = false;
                ipcRenderer.removeListener('manager--install-log-chunk', chunkListener);
              }
              logWin = null;
            });
            logWin.loadURL(`file://${normalize(`${__dirname}/../../log-window/index.html`)}`);
            logWin.on('ready-to-show', () => {
              logWin.show();
            });
          });

          showLogs.appendTo(popup.bottomCont);
          popup.appendTo(document.body);

          const progressListener = (e, progress) => {
            popup.progress = progress;
          };

          ipcRenderer.once('manager--install-isLoggable', isLoggable => {
            if (isLoggable) showLogs.shown = true;
          });

          ipcRenderer.on('manager--install-progress', progressListener);

          ipcRenderer.once('manager--install-done', (e, err) => {
            ipcRenderer.removeListener('manager--install-progress', progressListener);
            setTimeout(() => {
              if (err) {
                popup.status = 'Error while installing package. Try again later';
                popup.error = true;
              } else {
                popup.status = 'Done installing package';
                popup.progress = 100;
              }
              popup.spinning = false;
              popup.close.shown = true;
            }, 1000);
          });

          setTimeout(() => {
            popup.shown = true;
            setTimeout(() => {
              ipcRenderer.send('manager--install', res.name);
            }, 600);
          }, 1000);
        });
        infoHeader.appendChild(document.createElement('br'));
        if (!res.installed) {
          button.appendTo(infoHeader);
        } else {
          const txt = document.createElement('span');
          txt.innerText = 'It\'s installed.';
          infoHeader.appendChild(txt);
        }
        infoPlaceholder.classList.remove('shown');
        return;
      }

      if (!resCodes[code]) code = 500;
      infoPlaceholder.innerHTML = resCodes[code][random(0, resCodes[code].length-1)];
      infoPlaceholder.classList.add('shown');
    });
    ipcRenderer.send('packages--info', packageName);
  }, 600);
});

input.prependTo(inputCont);

(<object>window).onpageviewload = (data) => {
  if (typeof data === 'string') {
    input.value = data;
    (<object>inputCont.dataset).size = 'normal';
    input.submit();
  }
};
