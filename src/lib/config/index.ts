'use strict';

import { join as joinPath } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { readFile, writeFile, mkdirp } from 'then-utils';
import { app } from 'electron';

class ConfigManager {
  pathname: string;
  obj: object;
  constructor(pathname: string) {
    this.pathname = pathname;
    let cont: string = '{}';

    try {
      cont = readFileSync(this.pathname, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        this.touchDir().then(() => {
          writeFileSync(this.pathname, cont);
        });
      } else {
        throw e;
      }
    }

    this.obj = JSON.parse(cont);
  }
  touchDir(): Promise<void> {
    return mkdirp(app.getPath('userData'));
  }
  set(key: string, value: any): Promise<void> {
    const obj = this.getParentObjectForKeyPath(key);
    obj[this.getLastKeyPathComponent(key)] = value;
    return this.save();
  }
  get(key: string): Promise<any> {
    const obj = this.getParentObjectForKeyPath(key);
    return Promise.resolve(obj[this.getLastKeyPathComponent(key)]);
  }
  getParentObjectForKeyPath(key: string): object {
    const components = key.split('.');
    let parentObj = this.obj;
    components.pop(); // remove the last (child) component
    for (const component of components) {
      if (!parentObj[component]) parentObj[component] = {};
      parentObj = parentObj[component];
    }
    return parentObj;
  }
  getLastKeyPathComponent(key: string): string {
    const components = key.split('.');
    return components[components.length - 1];
  }
  save(pretty: boolean = false): Promise<void> {
    return writeFile(this.pathname, JSON.stringify(this.obj, null, (pretty) ? 2 : undefined));
  }
}

export default new ConfigManager(joinPath(app.getPath('userData'), 'config.json'));
