'use strict';

import {
  ipcRenderer,
  remote
} from 'electron';
const { BrowserWindow } = remote;
import { asyncFor } from 'then-utils';
import { normalize } from 'path';
import CardComponent from '../../components/card';
import ButtonComponent from '../../components/button';
import DropdownComponent from '../../components/dropdown';
import LabelComponent from '../../components/label';
import listCache from '../../managers/listCache';
import { PackageObject } from '../../../lib/plugins/pluginDefs';

type PackageFilter = (obj: PackageObject) => boolean;

const pageCont = document.getElementById('pageCont');
const cardCont = document.getElementById('myPackages--cardCont');
const contPlaceholder = document.getElementById('myPackages--cardCont-placeholder');
const contBar = document.getElementById('myPackages--top-bar');
const optView = document.getElementById('myPackages--optCont-view');
const listTypeView = document.getElementById('myPackages--optCont-listType');
const refreshView = document.getElementById('myPackages--optCont-refresh');

const viewDropdown = new DropdownComponent({
  id: 'myPackages--optCont-viewDropdown'
});
const listTypeDropdown = new DropdownComponent({
  id: 'myPackages--optCont-listTypeDropdown'
});
const refreshButton = new ButtonComponent({
  text: 'Refresh'
});

let loadingList: boolean = false;

let cards: CardComponent[] = null;
//let pkgNameIndex: object = {};

enum DefaultViewOptions {
  All,
  Updatable
}

const defaultOpts: string[] = ['All', 'Updatable'];
const defaultFilters: PackageFilter[] = [
  (obj: PackageObject) => !!obj,
  (obj: PackageObject) => obj.upToDate === false
];
const listTypes: string[] = [
  'Detailed',
  'Simple'
];

let opts: string[] = defaultOpts.slice(0);
let filters: PackageFilter[] = defaultFilters.slice(0);
let listType = 0;

viewDropdown.on('select', (opt: HTMLOptionElement, i: number) => {
  while (cards[0]) cards.shift().disown();
  let lst = listCache.cache;
  lst = listCache.cache.filter(filters[i]);
  chunkListener(null, lst);
});
listTypeDropdown.on('select', (opt: HTMLOptionElement, i: number) => {
  listType = i;
  if (listType === 1) {
    // Simple list type doesn't give category data or up to date info
    viewDropdown.selected = DefaultViewOptions.All;
    viewDropdown.disabled = true;
  } else {
    viewDropdown.disabled = false;
  }
  loadList();
});

refreshButton.on('click', () => {
  listCache.cache = null;
  loadList();
});

const chunkListener = (e, chunk: PackageObject[]) => {
  if (chunk.length === 0) return;
  const func = (i: number, item: PackageObject) => {
    if (!filters[viewDropdown.selected](item)) return;
    if (item.removed) return;
    //if (pkgNameIndex[item.name]) return;
    
    //pkgNameIndex[item.name] = true;

    const card = new CardComponent({
      title: item.displayName || item.name,
      body: item.description,
      footer: `${item.name} - ${item.version}`,
      classes: ['my-packages--pkg-card']
    });

    const manageButton = new ButtonComponent({
      text: 'Manage...'
    });

    manageButton.on('click', () => {
      (<object>window).pageNavbar.setActiveItem(4);
      (<object>window).pageNavManager.softNavigateTo(`${__dirname}/../manage/index.html`, item.name, listCache.cache.indexOf(item));
    });

    card.bodyElm.appendChild(document.createElement('br'));
    manageButton.appendTo(card.bodyElm);
    if (item.upToDate === false) {
      const updateLabel = new LabelComponent({
        text: 'Updatable'
      });
      updateLabel.appendTo(card.header);
    }

    asyncFor(item.categories, (i, category) => {
      const label = new LabelComponent({
        text: category
      });
      label.appendTo(card.header);
      return Promise.resolve();
    }).then(() => {
      let scrollToBottom = false;
      if (cardCont.scrollTop === (cardCont.scrollHeight - cardCont.offsetHeight)) {
        scrollToBottom = true;
      }

      card.appendTo(cardCont);

      if (scrollToBottom) cardCont.scrollTop = cardCont.scrollHeight;

      cards.push(card);
    });
  };
  if (chunk.length === 1) {
    func(0, chunk[0]);
  } else {
    asyncFor(chunk, (i, item) => Promise.resolve(func(i, item)));
  }
};

const concatListener = (e, chunk: PackageObject[]) => {
  listCache.cache.push(...chunk);
};

let endListener = null;

function loadList() {
  if (loadingList) {
    ipcRenderer.once('packages--list-cancelled', () => {
      loadingList = false;
      loadList();
    });
    ipcRenderer.removeListener('packages--list-chunk', concatListener);
    ipcRenderer.removeListener('packages--list-chunk', chunkListener);
    ipcRenderer.removeListener('packages--list-end', endListener);
    return ipcRenderer.send('packages--cancelList');
  }

  opts = defaultOpts.slice(0);
  filters = defaultFilters.slice(0);
  viewDropdown.setOptions(opts.map(obj => ({ name: obj }))).then(() => {
    ipcRenderer.once('packages--categories', (e, categories: string[]) => {
      if (categories.length === 0) return;
      opts.push(...categories);
      filters.push(...(categories.map(category => ((obj: PackageObject) => obj.categories && obj.categories.includes(category)))));
      viewDropdown.setOptions(opts.map(obj => ({ name: obj })));
    });
    ipcRenderer.send('packages--getCategories');

    cards = [];
    //pkgNameIndex = {};

    if (listCache.cache) return chunkListener(null, listCache.cache);

    listCache.cache = [];

    ipcRenderer.once('packages--list-chunk', () => {
      // on the first chunk
      contPlaceholder.classList.remove('shown');
      cardCont.classList.remove('no-scroll');
      contBar.classList.add('shown');
      pageCont.classList.add('barShown');
      //viewDropdown.disabled = true;
    });
    endListener = (e, totalLength) => {
      (<object>window).onbeforepageviewunload = () => {
        ipcRenderer.removeListener('reloadPlugins', loadList);
      };
      ipcRenderer.removeListener('packages--list-chunk', concatListener);
      ipcRenderer.removeListener('packages--list-chunk', chunkListener);
      contBar.classList.remove('shown');
      pageCont.classList.remove('barShown');
      //viewDropdown.disabled = false;
      loadingList = false;
      if (totalLength === 0) {
        contPlaceholder.innerHTML = 'It\'s lonely in here! Go install something!';
        contPlaceholder.classList.add('shown');
        cardCont.classList.add('no-scroll');
      }
    };
    ipcRenderer.on('packages--list-chunk', concatListener);
    ipcRenderer.on('packages--list-chunk', chunkListener);
    ipcRenderer.once('packages--list-end', endListener);

    contPlaceholder.innerHTML = 'Loading...';
    contPlaceholder.classList.add('shown');
    cardCont.classList.add('no-scroll');

    return asyncFor(Array.prototype.slice.call(cardCont.children), (i, child) => {
      if (child !== contPlaceholder && child !== contBar) {
        child.parentNode.removeChild(child);
      }
      return Promise.resolve();
    }).then(() => {
      (<object>window).onbeforepageviewunload = () => {
        ipcRenderer.send('packages--cancelList');
        ipcRenderer.removeListener('packages--list-chunk', concatListener);
        ipcRenderer.removeListener('packages--list-chunk', chunkListener);
        ipcRenderer.removeListener('packages--list-end', endListener);
        loadingList = false;
        ipcRenderer.removeListener('reloadPlugins', loadList);
      };
      loadingList = true;
      ipcRenderer.send('packages--getList', listType);
    });
  });
}

listTypeDropdown.setOptions(listTypes.map(obj => ({ name: obj }))).then(() => {
  listTypeDropdown.appendTo(listTypeView);
  return viewDropdown.setOptions(opts.map(obj => ({ name: obj })));
}).then(() => {
  viewDropdown.appendTo(optView);
  refreshButton.appendTo(refreshView);
  loadList();
});

ipcRenderer.on('reloadPlugins', loadList);

(<object>window).onbeforepageviewunload = () => {
  ipcRenderer.removeListener('reloadPlugins', loadList);
};
