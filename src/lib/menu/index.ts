'use strict';

import { MenuItem, Separator } from './classes';
import * as defaultsMenuActions from './defaultsMenuActions';
import { render as mustacheRender } from 'mustache';
import { readFileSync } from 'fs';
import { join as joinPath } from 'path';

const noop = () => {};

export function toObject(menu: object, appCfg: object, actions: object): object {
  const menuDefaults: object = JSON.parse(mustacheRender(String(readFileSync(joinPath(__dirname, 'menuDefaults.json'))), appCfg));
  const base = new MenuItem('__BASE__', null, null, true);
  const iterator = (parent: object, submenu: object) => {
    for (let itemName in submenu) {
      let item = submenu[itemName];
      if (item instanceof Array) {
        let shortcut = item[0] || null;
        if (typeof shortcut === 'object' && shortcut !== null) {
          if (shortcut.mac && process.platform === 'darwin') {
            shortcut = shortcut.mac;
          } else if (shortcut.default) {
            shortcut = shortcut.default;
          } else {
            shortcut = null;
          }
        }
        parent.submenu.push(new MenuItem(itemName, shortcut, (item[1] || actions[item[2]] || defaultsMenuActions[item[2]] || null)));
      } else if (typeof item === 'string') {
        if (itemName.startsWith('__separator') && item === '__separator') {
          parent.submenu.push(new Separator());
        } else if (itemName === '__default') {
          if (menuDefaults[item]) {
            item = menuDefaults[item];
            iterator(parent, item);
          }
        } else if (itemName === '__role') {
          parent.role = item;
        } else {
          const menuItem = new MenuItem(itemName, null, (actions[item] || defaultsMenuActions[item] || noop));
          let found = false;
          for (let i = 0, len = parent.submenu.length; i < len; i++) {
            if (parent.submenu[i].label === itemName) {
              found = true;
              parent.submenu[i] = menuItem;
            }
          }
          if (!found) parent.submenu.push(menuItem);
        }
      } else if (typeof item === 'object') {
        if (!item.__noChildren) {
          if (itemName.startsWith('__macOnly')) {
            if (process.platform === 'darwin') iterator(parent, item);
          } else if (itemName.startsWith('__exceptMac')) {
            if (process.platform !== 'darwin') iterator(parent, item);
          } else {
            const newItem = new MenuItem(itemName, null, null, true);
            for (let item of parent.submenu) {
              if (item.label === newItem.label) {
                parent.submenu.splice(parent.submenu.indexOf(item), 1);
                break;
              }
            }
            parent.submenu.push(newItem);
            iterator(newItem, item);
          }
        }
      }
    }
  }
  iterator(base, menu);
  return base;
}

export function render(str: string, appCfg: object): object {
  return JSON.parse(mustacheRender(str, appCfg));
}