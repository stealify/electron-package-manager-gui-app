'use strict';

import { ipcRenderer } from 'electron';
import { join, normalize } from 'path';
import NavbarComponent from '../components/navbar';
import NavigationManager from '../managers/navigation';
const pageNavItems = require('../resources/pageNav.json');
const settingsNavItems = require('../resources/settingsNav.json');

const pageCont = document.getElementById('pageCont');
const settingsCont = document.getElementById('settingsCont');
const settingsContCont = document.getElementById('settingsContCont');

(<object>window).pageNavManager = new NavigationManager(pageCont, 'page');
(<object>window).settingsNavManager = new NavigationManager(settingsContCont, 'settings');

const pageNav = (<object>window).pageNavbar = new NavbarComponent({
  id: 'pageNav'
});
const settingsNav = (<object>window).settingsNavbar = new NavbarComponent({
  id: 'settingsNav'
});

let searchI = null;

function reloadSearch() {
  let prom = null;
  if (searchI || searchI === 0) {
    prom = pageNav.removeItem({
      index: searchI
    });
  } else {
    prom = Promise.resolve();
  }
  prom.then(() => {
    ipcRenderer.once('nav--can-search-result', (e, canSearch) => {
      if (canSearch) {
        pageNav.addItem({
          name: 'Search',
          onclick() {
            pageNav.setActiveItem(searchI);
            (<object>window).pageNavManager.softNavigateTo(`${__dirname}/../views/search/index.html`);
          }
        }).then(itemI => {
          searchI = itemI;
        });
      }
    });
    ipcRenderer.send('nav--can-search');
  });
}

ipcRenderer.on('reloadPlugins', reloadSearch);

pageNav.addItems(pageNavItems.sort((a, b) => a.index - b.index).map(obj => {
  const pathname = normalize(join(`${__dirname}/../resources/`, obj.path));
  return {
    name: obj.name,
    onclick() {
      pageNav.setActiveItem(obj.index);
      (<object>window).pageNavManager.softNavigateTo(pathname);
    }
  };
})).then(() => {
  pageNav.links[0].click();
  reloadSearch();
});

settingsNav.addItems(settingsNavItems.sort((a, b) => a.index - b.index).map(obj => {
  const pathname = normalize(join(`${__dirname}/../resources/`, obj.path));
  return {
    name: obj.name,
    onclick() {
      settingsNav.setActiveItem(obj.index);
      (<object>window).settingsNavManager.softNavigateTo(pathname);
    }
  };
}));

pageNav.once('ready', () => {
  pageNav.insertBeforeOn(document.body, pageCont);
});

settingsNav.once('ready', () => {
  settingsNav.prependTo(settingsCont);
});
