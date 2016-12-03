'use strict';

import {
  readdir,
  asyncFor,
  callWithPromiseOrCallback,
  mkdirp,
  readFile,
  writeFile,
  mv,
  rmrf,
  exec
} from 'then-utils';
import { homedir } from 'os';
import { stat } from 'fs';
import { fork } from 'child_process';
import config from '../config';
import ActivePluginManager from './active-plugin-manager';
import decompressPpz from './decompressPpz';
import { Readable as ReadableStream } from 'stream';
import { join as joinPath } from 'path';
import { ActivePlugin, InstallType, PluginInfoObject } from './pluginDefs';
import { gt } from 'semver';
import { app } from 'electron';
import fetch from 'node-fetch';

const streams = {
  install: null,
  update: null
};

class LogStream extends ReadableStream {
  _read() {}
}

class OkReject {};

function writeInstallType(pkgPath: string, installType: InstallType) {
  return readFile(`${pkgPath}/package.json`, 'utf8').then((jsonStr: string) => {
    const pkgJson = JSON.parse(jsonStr);
    pkgJson.pipam = pkgJson.pipam || {};
    pkgJson.pipam._installType = installType;
    return writeFile(joinPath(pkgPath, 'package.json'), JSON.stringify(pkgJson, null, 2));
  });
}

class PluginsManager {
  active: ActivePlugin;
  activePlugin: ActivePluginManager;
  constructor() {
    this.active = null;
    this.activePlugin = new ActivePluginManager(this);
  }
  touchDir(): Promise<void> {
    return mkdirp(joinPath(app.getPath('userData'), 'plugins'));
  }
  isAvailable(plugin: string): Promise<boolean> {
    return readdir(joinPath(app.getPath('userData'), 'plugins')).then(files => {
      return asyncFor(files, (i, file) => {
        if (file === plugin) {
          return Promise.reject(undefined);
        }
        return Promise.resolve();
      }).then(() => Promise.resolve(false), () => Promise.resolve(true));
    });
  }
  activate(plugin: string): Promise<void> {
    return (() => {
      if (this.active && this.active.module) return this.activePlugin.cleanup();
      return Promise.resolve();
    })().then(() => readFile(joinPath(app.getPath('userData'), 'plugins', plugin, 'package.json'), 'utf8')).then((cont: string) => {
      const parsed = JSON.parse(cont);
      if (typeof parsed.pipam !== 'object') return Promise.reject('The package is not a pipam plugin');
      this.active = {
        displayName: parsed.pipam.displayName,
        name: parsed.name,
        version: parsed.version,
        module: require(`${app.getPath('userData')}/plugins/${plugin}`)
      };
      return config.set('lastActivePlugin', plugin).then(() => this.activePlugin.init());
    });
  }
  activateDummy(): Promise<void> {
    return (() => {
      if (this.active && this.active.module) return this.activePlugin.cleanup();
      return Promise.resolve();
    })().then(() => readFile(joinPath(__dirname, '..', 'dummy-plugin', 'package.json'), 'utf8')).then((cont: string) => {
      const parsed = JSON.parse(cont);
      if (typeof parsed.pipam !== 'object') return Promise.reject('The package is not a pipam plugin');
      this.active = {
        displayName: parsed.pipam.displayName,
        name: parsed.name,
        version: parsed.version,
        module: require(`${__dirname}/../dummy-plugin`)
      };
      return Promise.resolve(this.activePlugin.init());
    });
  }
  getList(): Promise<PluginInfoObject[]> {
    const res = [];
    return readdir(joinPath(app.getPath('userData'), 'plugins')).then((files: string[]) => {
      return asyncFor(files, (i, file) => {
        return callWithPromiseOrCallback(stat, joinPath(app.getPath('userData'), 'plugins', file)).then(stats => {
          if (!stats.isDirectory()) {
            return Promise.resolve();
          }
          return readFile(joinPath(app.getPath('userData'), 'plugins', file, 'package.json'), 'utf8').then((cont: string) => {
            const parsed = JSON.parse(cont);
            if (typeof parsed.pipam !== 'object') return;

            const installType: InstallType = (parsed.pipam._installType || parsed.pipam._installType === 0) ? parsed.pipam._installType : InstallType.Archive;
            let upToDate = true;

            let prom = Promise.resolve();

            if (installType === InstallType.npm) {
              prom = fetch(`https://registry.npmjs.org/${parsed.name}/latest`).then(res => {
                if (!res.ok) return Promise.reject(new Error('Couldn\'t get that package, sorry...'));
                return res.json();
              }).then(json => {
                if (gt(json.version, parsed.version)) {
                  upToDate = false;
                }
              });
            }
            
            return prom.then(() => {
              res.push({
                displayName: parsed.pipam.displayName,
                description: parsed.description,
                name: parsed.name,
                version: parsed.version,
                active: (this.active && this.active.name === parsed.name) ? true : false,
                uninstallable: true,
                installType,
                upToDate
              });
            });
          });
        });
      });
    }).then(() => {
      if (res.length === 0) {
        return [
          {
            displayName: 'None',
            description: 'A dummy plugin (actived when there\'s absolutely no other plugins available)',
            name: 'dummy-plugin',
            version: '1.0.0',
            active: true,
            uninstallable: false,
            installType: InstallType.Archive,
            upToDate: true
          }
        ];
      } else {
        return res;
      }
    });
  }
  install(plugin: string, fromUpdate?: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = fork(joinPath(__dirname, '..', '..', 'node_modules', 'npm', 'bin', 'npm-cli.js'), ['install', '--loglevel', 'silly', `${plugin}@latest`], {
        cwd: joinPath(app.getPath('userData'), 'plugins'),
        silent: true,
        env: {
          npm_config_target: (<object>process.versions).electron,
          npm_config_arch: process.arch,
          npm_config_target_arch: process.arch,
          npm_config_disturl: 'https://atom.io/download/atom-shell',
          npm_config_runtime: 'electron',
          npm_config_build_from_source: true,
          HOME: joinPath(homedir(), '.electron-gyp')
        }
      });

      const key = (fromUpdate) ? 'update' : 'install';

      const myRef = streams[key] = new LogStream();
      myRef.pause();

      const dataHandler = chunk => setImmediate(() => myRef.push(chunk));
      let endI = 0;
      const endHandler = () => {
        endI++;
        if (endI === 2) {
          // both streams are done
          myRef.push(null);
        }
      };
      child.stdout.on('data', dataHandler);
      child.stderr.on('data', dataHandler);
      child.stdout.once('end', endHandler);
      child.stderr.once('end', endHandler);

      myRef.once('end', () => {
        // make sure that we don't remove a different stream
        if (streams[key] === myRef) {
          streams[key] = null;
        }
      });

      child.once('error', reject);
      child.once('exit', (code, signal) => {
        if (code !== 0) return reject(new Error('The process exited with a non-zero return code'));
        writeInstallType(joinPath(app.getPath('userData'), 'plugins', 'node_modules', plugin), InstallType.npm).then(() => {
          return mv(joinPath(app.getPath('userData'), 'plugins', 'node_modules', plugin), joinPath(app.getPath('userData'), 'plugins', plugin));
        }).then(() => {
          return mv(joinPath(app.getPath('userData'), 'plugins', 'node_modules'), joinPath(app.getPath('userData'), 'plugins', plugin, 'node_modules'));
        }).then(() => resolve()).catch(reject);
      });
    });
  }
  installFromFile(pathname: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const key = 'install';

      const myRef = streams[key] = new LogStream();
      myRef.pause();

      myRef.once('end', () => {
        // make sure that we don't remove a different stream
        if (streams[key] === myRef) {
          streams[key] = null;
        }
      });

      myRef.push('Decompressing ppz...');

      decompressPpz(pathname, joinPath(app.getPath('userData'), 'plugins')).then(plugin => {
        return writeInstallType(joinPath(app.getPath('userData'), 'plugins', plugin), InstallType.Archive);
      }).then(() => {
        myRef.push('Done!');
        myRef.push(null);
        resolve();
      }).catch(reject);
    });
  }
  installLogs(): Promise<LogStream> {
    if (streams.install === null) return Promise.reject(new Error('Nope.'));
    return Promise.resolve(streams.install);
  }
  update(plugin: string): Promise<void> {
    return this.uninstall(plugin).then(() => {
      return this.install(plugin, true);
    });
  }
  updateLogs(): Promise<LogStream> {
    if (streams.update === null) return Promise.reject(new Error('Nope.'));
    return Promise.resolve(streams.update);
  }
  uninstall(plugin: string): Promise<void> {
    return rmrf(joinPath(app.getPath('userData'), 'plugins', plugin));
  }
  uninstallLogs(): Promise<LogStream> {
    return Promise.reject(new Error('Nope.'));
  }
  info(plugin: string): Promise<object> {
    return readFile(joinPath(app.getPath('userData'), 'plugins', plugin, 'package.json'), 'utf8').then((cont: string) => {
      const parsed = JSON.parse(cont);
      if (typeof parsed.pipam !== 'object') return Promise.reject('The package is not a pipam plugin');
      return Promise.resolve({
        description: parsed.pipam.description || parsed.description || 'No description provided',
        displayName: parsed.pipam.displayName,
        name: parsed.name,
        version: parsed.version
      });
    });
  }
  checkForUpdates(): Promise<boolean> {
    let res: boolean = false;
    return this.getList().then((list: PluginInfoObject[]) => {
      return asyncFor(list, (i, item) => {
        if (item.installType !== InstallType.npm) return Promise.resolve();
        if (item.upToDate) return Promise.resolve();
        return Promise.reject(new OkReject());
      }).catch(err => {
        if (err instanceof OkReject) {
          res = true;
          return Promise.resolve();
        }
      });
    }).then(() => {
      return res;
    });
  }
}

export default new PluginsManager();
