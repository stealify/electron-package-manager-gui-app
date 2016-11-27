'use strict';

import { Menu } from 'electron';
import { render } from 'mustache';
import { join as joinPath, isAbsolute } from 'path';
import { readFileSync } from 'fs';
import { toObject } from '../lib/menu';

export default (appCfg: string, dir: string, menuJSON?: string, menuCommands?: object) => {
  if (!menuJSON) menuJSON = joinPath(__dirname, 'defaultMenu.json');
  if (!menuCommands) menuCommands = joinPath(__dirname, 'defaultsMenuActions');
  if (!isAbsolute(menuJSON)) menuJSON = joinPath(dir, menuJSON);
  if (!isAbsolute(menuCommands)) menuCommands = joinPath(dir, menuCommands);
  const menu = JSON.parse(render(String(readFileSync(menuJSON)), appCfg));
  const actions = require(menuCommands);
  const base = toObject(menu, appCfg, actions);
  Menu.setApplicationMenu(Menu.buildFromTemplate(base.submenu));
};
