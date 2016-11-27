'use strict';

import pluginsManager from './index';
import { ActivePlugin, ListType } from './pluginDefs';
import { Readable as ReadableStream } from 'stream';

class LogStream extends ReadableStream {
  _read() {}
}

class ActivePluginManager {
  parent: typeof pluginsManager;
  constructor(parent: typeof pluginsManager) {
    this.parent = parent;
  }
  get handle(): ActivePlugin {
    return this.parent.active;
  }
  get properties(): object {
    const obj = {
      emitsProgressEvents: false,
      isSearchable: false,
      installIsLoggable: false,
      uninstallIsLoggable: false,
      updateIsLoggable: false,
      categories: []
    };

    if (this.handle.module.properties) {
      if (this.handle.module.properties.emitsProgressEvents) {
        obj.emitsProgressEvents = true;
      }
      if (this.handle.module.properties.isSearchable) {
        obj.isSearchable = true;
      }
      if (this.handle.module.properties.isLoggable === true) {
        obj.installIsLoggable = true;
        obj.uninstallIsLoggable = true;
        obj.updateIsLoggable = true;
      } else if (typeof this.handle.module.properties.isLoggable === 'object') {
        if (this.handle.module.properties.isLoggable.install === true) {
          obj.installIsLoggable = true;
        }
        if (this.handle.module.properties.isLoggable.uninstall === true) {
          obj.uninstallIsLoggable = true;
        }
        if (this.handle.module.properties.isLoggable.update === true) {
          obj.updateIsLoggable = true;
        }
      }
      if (this.handle.module.properties.categories instanceof Array) {
        obj.categories = this.handle.module.properties.categories;
      }
    }

    return obj;
  }
  init() {
    if (this.handle.module.init) return Promise.resolve(this.handle.module.init());
    return Promise.resolve();
  }
  cleanup() {
    if (this.handle.module.cleanup) return Promise.resolve(this.handle.module.cleanup());
    return Promise.resolve();
  }
  getPackages(type: ListType) {
    return this.handle.module.packageList(type);
  }
  cancelList() {
    if (this.handle.module.cancelList) return Promise.resolve(this.handle.module.cancelList());
    return Promise.resolve();
  }
  install(name: string) {
    return this.handle.module.install(name);
  }
  installLogs(name: string) {
    if (this.handle.module.installLogs) return Promise.resolve(this.handle.module.installLogs(name));
    const stream = new LogStream();
    setImmediate(() => stream.push(null));
    return Promise.resolve(stream);
  }
  uninstall(name: string) {
    return this.handle.module.uninstall(name);
  }
  uninstallLogs(name: string) {
    if (this.handle.module.uninstallLogs) return Promise.resolve(this.handle.module.uninstallLogs(name));
    const stream = new LogStream();
    setImmediate(() => stream.push(null));
    return Promise.resolve(stream);
  }
  info(name: string) {
    if (this.handle.module.info) return Promise.resolve(this.handle.module.info(name))
    return Promise.resolve({
      name
    });
  }
  search(term: string) {
    if (this.handle.module.search) return Promise.resolve(this.handle.module.search(term));
    return Promise.resolve([]);
  }
  update(name: string) {
    return this.handle.module.update(name);
  }
  updateLogs(name: string) {
    if (this.handle.module.updateLogs) return Promise.resolve(this.handle.module.updateLogs(name));
    const stream = new LogStream();
    setImmediate(() => stream.push(null));
    return Promise.resolve(stream);
  }
}

export default ActivePluginManager;
