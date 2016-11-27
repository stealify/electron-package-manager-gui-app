'use strict';

import { ipcRenderer } from 'electron';
import { asyncFor } from 'then-utils';
import CardComponent from '../../../../components/card';
import ButtonComponent from '../../../../components/button';
import ActivityPopupComponent from '../../../../components/activity-popup';

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
          text: 'Uninstall',
          classes: ['settings--plugins-myPlugins-uninstallButton']
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
        card.bodyElm.appendChild(document.createElement('br'));
        removeButton.appendTo(card.bodyElm);
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
