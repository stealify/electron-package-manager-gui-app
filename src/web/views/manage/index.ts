'use strict';

import TextInputComponent from '../../components/text-input';
import ButtonComponent from '../../components/button';
import {
  ipcRenderer,
  remote
} from 'electron';
const { BrowserWindow } = remote;
import { normalize } from 'path';
const { resCodes } = require('../../resources/messages.json');

const random = (min, max) => (Math.floor(Math.random() * (max - min + 1)) + min);

const inputCont = document.getElementById('manage--inputCont');
const infoPlaceholder = document.getElementById('manage--infoCont-placeholder');
const infoHeader = document.getElementById('manage--infoCont-header');
const infoHeading = document.getElementById('manage--infoCont-heading');
const infoBody = document.getElementById('manage--infoCont-body');
const infoFooter = document.getElementById('manage--infoCont-footer');

const input = new TextInputComponent({
  id: 'manage--inputBox',
  placeholder: 'Enter a package name to manage...'
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
        const uninstallButton = new ButtonComponent({
          text: 'Uninstall...'
        });
        const updateButton = new ButtonComponent({
          text: 'Update...'
        });
        uninstallButton.on('click', () => {
          (<object>window).pageNavbar.setActiveItem(3);
          (<object>window).pageNavManager.softNavigateTo(`${__dirname}/../uninstall/index.html`, res.name);
        });
        updateButton.on('click', () => {
          (<object>window).pageNavbar.setActiveItem(2);
          (<object>window).pageNavManager.softNavigateTo(`${__dirname}/../update/index.html`, res.name);
        });
        infoHeader.appendChild(document.createElement('br'));
        if (res.installed) {
          uninstallButton.appendTo(infoHeader);
          if (!res.upToDate) updateButton.appendTo(infoHeader);
        } else {
          const txt = document.createElement('span');
          txt.innerText = 'It\'s not installed.';
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
