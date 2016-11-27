'use strict';

import {
  ipcRenderer,
  remote
} from 'electron';
const { BrowserWindow } = remote;
import { asyncFor } from 'then-utils';
import CardComponent from '../../components/card';
import ButtonComponent from '../../components/button';
import TextInputComponent from '../../components/text-input';

const pageCont = document.getElementById('pageCont');
const cardCont = document.getElementById('search--cardCont');
const contPlaceholder = document.getElementById('search--cardCont-placeholder');
const contBar = document.getElementById('search--top-bar');
const inputCont = document.getElementById('search--inputCont');

const input = new TextInputComponent({
  id: 'search--inputBox',
  placeholder: 'Search for a package...'
});

input.on('focus', () => {
  (<object>inputCont.dataset).size = 'large';
});

input.on('blur', () => {
  (<object>inputCont.dataset).size = 'normal';
});

let loadingList = false;

function loadList() {
  if (loadingList) return ipcRenderer.send('search--cancelList');
  const chunkListener = (e, chunk) => {
    asyncFor(chunk, (i, item) => {
      const card = new CardComponent({
        title: item.displayName || item.name,
        body: item.description,
        footer: `${item.name} - ${item.version}`
      });

      const moreButton = new ButtonComponent({
        text: 'More...'
      });

      moreButton.on('click', () => {
        (<object>window).pageNavbar.setActiveItem(1);
        (<object>window).pageNavManager.softNavigateTo(`${__dirname}/../install/index.html`, item.name);
      });

      card.bodyElm.appendChild(document.createElement('br'));
      moreButton.appendTo(card.bodyElm);
      let scrollToBottom = false;
      if (cardCont.scrollTop === (cardCont.scrollHeight - cardCont.offsetHeight)) {
        scrollToBottom = true;
      }
      card.appendTo(cardCont);
      if (scrollToBottom) cardCont.scrollTop = cardCont.scrollHeight;

      return Promise.resolve();
    });
  };

  ipcRenderer.once('search--list-chunk', () => {
    // on the first chunk
    contPlaceholder.classList.remove('shown');
    cardCont.classList.remove('no-scroll');
    contBar.classList.add('shown');
    pageCont.classList.add('barShown');
  });
  ipcRenderer.on('search--list-chunk', chunkListener);
  ipcRenderer.once('search--list-end', (e, totalLength) => {
    (<object>window).onbeforepageviewunload = null;
    ipcRenderer.removeListener('search--list-chunk', chunkListener);
    contBar.classList.remove('shown');
    pageCont.classList.remove('barShown');
    loadingList = false;
    if (totalLength === 0) {
      contPlaceholder.innerHTML = 'Nope.';
      contPlaceholder.classList.add('shown');
      cardCont.classList.add('no-scroll');
    }
  });

  contPlaceholder.innerHTML = 'Loading...';
  contPlaceholder.classList.add('shown');
  cardCont.classList.add('no-scroll');

  asyncFor(Array.prototype.slice.call(cardCont.children), (i, child) => {
    if (child !== contPlaceholder && child !== contBar) {
      child.parentNode.removeChild(child);
    }
    return Promise.resolve();
  }).then(() => {
    (<object>window).onbeforepageviewunload = () => {
      ipcRenderer.send('search--cancelList');
      loadingList = false;
      pageCont.classList.remove('barShown');
    };
    loadingList = true;
    ipcRenderer.send('search--getList');
  });
}

input.on('submit', () => {
  input.blur();
  contPlaceholder.innerHTML = 'Loading...';
  contPlaceholder.classList.add('shown');
  cardCont.classList.add('no-scroll');
  const packageName = input.value;
  for (const child of Array.prototype.slice.call(cardCont.children)) {
    if (child !== contPlaceholder) child.parentNode.removeChild(child);
  }
  setTimeout(() => {
    ipcRenderer.once('search--find-result', (e, code) => {
      if (code === 200) {
        loadList();
        return;
      }

      if (!resCodes[code]) code = 500;
      contPlaceholder.innerHTML = resCodes[code][random(0, resCodes[code].length-1)];
      contPlaceholder.classList.add('shown');
    });
    ipcRenderer.send('search--find', packageName);
  }, 600);
});

input.prependTo(inputCont);
