'use strict';

import TextInputComponent from '../../components/text-input';
import ButtonComponent from '../../components/button';
import ActivityPopupComponent from '../../components/activity-popup';
import {
  ipcRenderer,
  remote
} from 'electron';
const { BrowserWindow } = remote;
const { resCodes } = require('../../resources/messages.json');
import { normalize } from 'path';
import listCache from '../../managers/listCache';

const random = (min, max) => (Math.floor(Math.random() * (max - min + 1)) + min);

const inputCont = document.getElementById('update--inputCont');
const infoPlaceholder = document.getElementById('update--infoCont-placeholder');
const infoHeader = document.getElementById('update--infoCont-header');
const infoHeading = document.getElementById('update--infoCont-heading');
const infoBody = document.getElementById('update--infoCont-body');
const infoFooter = document.getElementById('update--infoCont-footer');

const input = new TextInputComponent({
  id: 'update--inputBox',
  placeholder: 'Enter a package name to update...'
});

input.on('focus', () => {
  (<object>inputCont.dataset).size = 'large';
});

input.on('blur', () => {
  (<object>inputCont.dataset).size = 'normal';
});

let cacheI = null;

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
          text: 'Update'
        });
        button.on('click', () => {
          const popup = new ActivityPopupComponent({
            title: 'Updating...',
            status: 'Updating the package...',
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
            ipcRenderer.send('manager--update-getLogs');
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
            ipcRenderer.on('manager--update-log-chunk', chunkListener);
            let listenerAdded = true;
            ipcRenderer.once('manager--update-done', () => {
              if (listenerAdded) {
                listenerAdded = false;
                ipcRenderer.removeListener('manager--update-log-chunk', chunkListener);
              }
            });
            logWin.on('closed', () => {
              if (listenerAdded) {
                listenerAdded = false;
                ipcRenderer.removeListener('manager--update-log-chunk', chunkListener);
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

          ipcRenderer.once('manager--update-isLoggable', isLoggable => {
            if (isLoggable) showLogs.shown = true;
          });

          ipcRenderer.on('manager--update-progress', progressListener);

          ipcRenderer.once('manager--update-done', (e, err) => {
            ipcRenderer.removeListener('manager--update-progress', progressListener);
            setTimeout(() => {
              if (err) {
                popup.status = 'Error while updating package. Try again later';
                popup.error = true;
              } else {
                popup.status = 'Done updating package';
                popup.progress = 100;
                if ((cacheI || cacheI === 0) && listCache.cache[cacheI]) listCache.cache[cacheI].upToDate = true;
              }
              popup.spinning = false;
              popup.close.shown = true;
            }, 1000);
          });

          setTimeout(() => {
            popup.shown = true;
            setTimeout(() => {
              ipcRenderer.send('manager--update', res.name);
            }, 600);
          }, 1000);
        });
        infoHeader.appendChild(document.createElement('br'));
        if (!res.upToDate) {
          button.appendTo(infoHeader);
        } else {
          const txt = document.createElement('span');
          if (!res.installed) {
            txt.innerText = 'It\'s not installed.';
          } else {
            txt.innerText = 'It\'s up to date.';
          }
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

(<object>window).onpageviewload = (data, cacheIndex) => {
  if (typeof data === 'string') {
    input.value = data;
    (<object>inputCont.dataset).size = 'normal';
    input.submit();
  }
  if (typeof cacheIndex === 'number') {
    cacheI = cacheIndex;
  }
};
