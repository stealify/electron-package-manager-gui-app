'use strict';

interface PluginsNavItemObject {
  name: string;
  index: number;
  path: string;
}

import { normalize, join } from 'path';
import SidebarComponent from '../../components/sidebar';
import NavigationManager from '../../managers/navigation';
const pluginsNavItems: PluginsNavItemObject[] = require('../../resources/settings-pluginsNav.json');

const settingsContCont = document.getElementById('settingsContCont');
const settingsPluginsCont = document.getElementById('settings--pluginsCont');
const navManager = new NavigationManager(settingsPluginsCont, 'pluginsettings');
const sidebar = new SidebarComponent({
  id: 'settings--plugins-sidebar'
});

sidebar.prependTo(settingsContCont);

sidebar.addItems(pluginsNavItems.sort((a, b) => a.index - b.index).map(obj => {
  const pathname = normalize(join(`${__dirname}/../../resources/`, obj.path));
  return {
    name: obj.name,
    onclick() {
      sidebar.setActiveItem(obj.index);
      navManager.softNavigateTo(pathname);
    }
  };
})).then(() => {
  sidebar.links[0].click();
});
