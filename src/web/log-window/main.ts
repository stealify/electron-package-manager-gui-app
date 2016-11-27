'use strict';

import ButtonComponent from '../components/button';
import { ipcRenderer } from 'electron';
import { asyncFor } from 'then-utils';

const logCont = document.getElementById('logCont');
const statusbar = document.getElementById('statusbar');

// make sure performance doesn't tank
const maxLines = 200;

ipcRenderer.on('log-chunk', (e, chunk) => {
  const line = document.createElement('div');
  line.className = 'line';
  line.innerText = chunk;
  let scrollToBottom = false;
  if (logCont.scrollTop === (logCont.scrollHeight - logCont.offsetHeight)) {
    scrollToBottom = true;
  }
  logCont.appendChild(line);
  if (logCont.childElementCount > maxLines) logCont.removeChild(logCont.firstChild);
  if (scrollToBottom) logCont.scrollTop = logCont.scrollHeight;
});

const clearButton = new ButtonComponent({
  text: 'Clear'
});

clearButton.on('click', () => {
  while (logCont.firstChild) logCont.removeChild(logCont.firstChild);
});

clearButton.appendTo(statusbar);
