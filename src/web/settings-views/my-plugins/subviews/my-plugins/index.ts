'use strict';

import { ipcRenderer, remote } from 'electron';
import { asyncFor } from 'then-utils';
import CardComponent from '../../../../components/card';
import ButtonComponent from '../../../../components/button';
import ActivityPopupComponent from '../../../../components/activity-popup';
import LabelComponent from '../../../../components/label';
import { normalize } from 'path';
const { BrowserWindow } = remote;

const cardCont = document.getElementById('settings--plugins-myPlugins-cardCont');
let cards = [];

const onpluginlist = (e, list) => {
  asyncFor(cards, (i, card) => {
    card.disown();
    return Promise.resolve();
  }).then(() => {
    cards = [];
    return asyncFor(list, (i, plugin) => {
      const card = new CardComponent({
        title: plugin.displayName,
        body: plugin.description,
        footer: `${plugin.name} - ${plugin.version}`
      });
      if (plugin.uninstallable) {
        const removeButton = new ButtonComponent({
          text: 'Uninstall'
        });
        const updateButton = new ButtonComponent({
          text: 'Update'
        });
        removeButton.on('click', () => {
          const popup = new ActivityPopupComponent({
            title: 'Uninstalling...',
            status: 'Uninstalling the plugin/package...',
            progress: 50,
            spinning: true
          });

          popup.once('close', () => {
            popup.disown();
          });

          popup.appendTo(document.body);

          ipcRenderer.once('uninstallPlugin--error', () => {
            setTimeout(() => {
              popup.status = 'Error while uninstalling plugin. Try again later';
              popup.error = true;
              popup.spinning = false;
            }, 1000);
          });

          ipcRenderer.once('uninstallPlugin--done', () => {
            setTimeout(() => {
              popup.status = 'Done uninstalling plugin';
              popup.progress = 100;
              popup.spinning = false;
              setTimeout(() => {
                popup.close.shown = true;
              }, 1000);
            }, 1000);
          });

          setTimeout(() => {
            popup.shown = true;
            setTimeout(() => {
              ipcRenderer.send('uninstallPlugin', plugin.name);
            }, 600);
          }, 1000);
        });
        updateButton.on('click', () => {
          const popup = new ActivityPopupComponent({
            title: 'Updating...',
            status: 'Updating the plugin...',
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
            ipcRenderer.send('updatePlugin--getLogs');
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
            ipcRenderer.on('updatePlugin--log-chunk', chunkListener);
            let listenerAdded = true;
            ipcRenderer.once('updatePlugin--done', () => {
              if (listenerAdded) {
                listenerAdded = false;
                ipcRenderer.removeListener('updatePlugin--log-chunk', chunkListener);
              }
            });
            logWin.on('closed', () => {
              if (listenerAdded) {
                listenerAdded = false;
                ipcRenderer.removeListener('updatePlugin--log-chunk', chunkListener);
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

          ipcRenderer.once('updatePlugin--error', () => {
            setTimeout(() => {
              popup.status = 'Error while updating plugin. Try again later';
              popup.error = true;
              popup.spinning = false;
              popup.close.shown = true;
            }, 1000);
          });

          ipcRenderer.once('updatePlugin--done', () => {
            setTimeout(() => {
              popup.status = 'Done updating plugin';
              popup.progress = 100;
              popup.spinning = false;
              setTimeout(() => {
                popup.close.shown = true;
              }, 1000);
            }, 1000);
          });

          setTimeout(() => {
            popup.shown = true;
            setTimeout(() => {
              ipcRenderer.send('updatePlugin', plugin.name);
            }, 600);
          }, 1000);
        });
        card.bodyElm.appendChild(document.createElement('br'));
        removeButton.appendTo(card.bodyElm);
        if (!plugin.upToDate) {
          const updateLabel = new LabelComponent({
            text: 'Updatable'
          });
          updateLabel.appendTo(card.header);
          updateButton.appendTo(card.bodyElm);
        }
      }
      card.appendTo(cardCont);
      cards.push(card);
      return Promise.resolve();
    });
  });
};

const onreloadplugins = () => {
  ipcRenderer.send('getPluginList');
};

ipcRenderer.on('pluginList', onpluginlist);
ipcRenderer.on('reloadPlugins', onreloadplugins);

onreloadplugins();

(<object>window).onbeforepluginsettingsviewunload = () => {
  ipcRenderer.removeListener('pluginList', onpluginlist);
  ipcRenderer.removeListener('reloadPlugins', onreloadplugins);
};
