/// <reference path="index.d.ts" />
'use strict';

// bootstrap global state
import './startup.js';

import { join as joinPath } from 'path';
import { userInfo } from 'os';
import { execFileSync } from 'child_process';
import { rmrf, asyncFor, callWithPromiseOrCallback } from 'then-utils';
import getos = require('getos');
import commandExists = require('command-exists');
import { app, BrowserWindow, ipcMain } from 'electron';
import { Readable as ReadableStream } from 'stream';
import { EventEmitter } from 'events';
import config from './lib/config';
import plugins from './lib/plugins';
const menu = require('./menu.json');
import loadMenu from './menu/loadMenu';
import { ListType, PackageObject, ValidPackageObject } from './lib/plugins/pluginDefs';

const appJson = require('./app.json');
let appCfg = appJson;

if (process.env.NODE_ENV === 'testing') {
  appCfg = appJson.testing;
}

function splitIntoChunks<T>(arr: T[], size: number): T[] {
  const chunks: T[] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(...arr.slice(i, i + size));
  }
  return chunks;
}

function toValidPkg(pkg: PackageObject): ValidPackageObject {
  const ret: ValidPackageObject = {
    name: '',
    version: '',
    displayName: '',
    description: '',
    installed: false,
    upToDate: true,
    categories: []
  };

  if (pkg.name) ret.name = pkg.name;
  if (pkg.version || pkg.version === 0) ret.version = pkg.version;
  if (pkg.displayName) {
    ret.displayName = pkg.displayName;
  } else {
    ret.displayName = pkg.name;
  }
  if (pkg.description) ret.description = pkg.description;
  if (pkg.installed) ret.installed = true;
  if (pkg.upToDate === false) ret.upToDate = false;
  if (pkg.categories) ret.categories = pkg.categories;

  return ret;
}

if (require('electron-squirrel-startup')) {} else {

if (process.platform !== 'win32') {
  process.env.PATH = execFileSync(userInfo().shell, ['-i', '-c', 'echo $PATH']).toString().trim();
} else {
  process.env.PATH = execFileSync('C:\\Windows\\System32\\cmd.exe', ['/C', 'echo %PATH%']).toString().trim();
}

const defaultPlugins: {
  [x: string]: () => Promise<string>;
} = {
  darwin() {
    return callWithPromiseOrCallback(commandExists, 'brew').then(exists => {
      if (exists) return 'homebrew';
      return null;
    });
  },
  // not available yet
  /*win32() {
    return callWithPromiseOrCallback(commandExists, 'choco').then(exists => {
      if (exists) return 'chocolatey';
      return null;
    });
  },*/
  linux() {
    return callWithPromiseOrCallback(getos).then(os => {
      switch (os.dist.split(' ')[0]) {
        case 'Ubuntu':
        case 'Debian':
          return 'apt';
        default:
          return null;
      }
    });
  }
};

let defaultPlugin: string = null;
let window: Electron.BrowserWindow = null;

function createWindow() {
  window = new BrowserWindow({
    icon: joinPath(__dirname, 'assets', 'icon.png'),
    frame: (process.platform === 'darwin') ? true : false,
    titleBarStyle: 'hidden-inset',
    title: 'Pipam',
    minWidth: 470,
    minHeight: 200
    //shown: false
  });
  /*window.on('ready-to-show', () => {
    window.show();
  });*/
  window.on('closed', () => {
    window = null;
  });
}

function loadWindowMain() {
  window.loadURL(`file://${joinPath(__dirname, 'web', 'index.html')}`);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (window) return window.show();
  createWindow();
  loadWindowMain();
});

app.on('ready', () => {
  defaultPlugins[process.platform]().then(plugin => {
    defaultPlugin = plugin;
  }).then(() => {
    return plugins.touchDir();
  }).then(() => {
    return config.get('lastActivePlugin');
  }).then(lastActivePlugin => {
    if (lastActivePlugin) {
      return plugins.isAvailable(lastActivePlugin).then(isAvailable => {
        if (isAvailable) {
          return plugins.activate(lastActivePlugin);
        } else if (defaultPlugin) {
          return plugins.isAvailable(`pipam-${defaultPlugin}`).then(defaultIsAvailable => {
            if (defaultIsAvailable) {
              return plugins.activate(`pipam-${defaultPlugin}`);
            } else {
              return plugins.activateDummy();
            }
          });
        } else {
          return plugins.activateDummy();
        }
      });
    } else if (defaultPlugin) {
      return plugins.isAvailable(`pipam-${defaultPlugin}`).then(defaultIsAvailable => {
        if (defaultIsAvailable) {
          return plugins.activate(`pipam-${defaultPlugin}`);
        } else {
          return plugins.activateDummy();
        }
      });
    } else {
      return plugins.activateDummy();
    }
  }).then(() => {
    createWindow();
    ipcMain.on('closeWindow', () => {
      window.close();
    });
    ipcMain.on('minimizeWindow', () => {
      window.minimize();
    });
    ipcMain.on('toggleMaximization', () => {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    });
    ipcMain.on('getPluginList', (e: Electron.Event) => {
      plugins.getList().then(list => {
        e.sender.send('pluginList', list);
      });
    });
    ipcMain.on('activatePlugin', (e: Electron.Event, name: string) => {
      plugins.activate(name).then(() => {
        e.sender.send('reloadPlugins');
      });
    });
    ipcMain.on('pluginInstall', (e: Electron.Event, name: string) => {
      let isDone = false;
      let doneCb = () => {};
      const prom = plugins.install(name);

      const getLogsListener = () => {
        const tryLog = () => {
          if (isDone) return;
          plugins.installLogs().then(stream => {
            const chunkListener = (chunk: string | Buffer) => {
              e.sender.send('pluginInstall--log-chunk', String(chunk));
            };
            doneCb = () => {
              stream.removeListener('data', chunkListener);
            };
            stream.on('data', chunkListener);
          }).catch(err => {
            setTimeout(tryLog, 5000);
          });
        };
        tryLog();
      };

      ipcMain.once('pluginInstall--getLogs', getLogsListener);

      prom.then(() => {
        isDone = true;
        doneCb();
        ipcMain.removeListener('pluginInstall--getLogs', getLogsListener);
        e.sender.send('pluginInstall--done');
        e.sender.send('reloadPlugins');
      }).catch(err => {
        isDone = true;
        doneCb();
        ipcMain.removeListener('pluginInstall--getLogs', getLogsListener);
        e.sender.send('pluginInstall--error', err.stack);
      });
    });
    ipcMain.on('pluginInstall--fromFile', (e: Electron.Event, pathname: string) => {
      let isDone = false;
      let doneCb = () => {};
      const prom = plugins.installFromFile(pathname);

      const getLogsListener = () => {
        const tryLog = () => {
          if (isDone) return;
          plugins.installLogs().then(stream => {
            const chunkListener = (chunk: string | Buffer) => {
              e.sender.send('pluginInstall--log-chunk', String(chunk));
            };
            doneCb = () => {
              stream.removeListener('data', chunkListener);
            };
            stream.on('data', chunkListener);
          }).catch(err => {
            setTimeout(tryLog, 5000);
          });
        };
        tryLog();
      };

      ipcMain.once('pluginInstall--getLogs', getLogsListener);

      prom.then(() => {
        isDone = true;
        doneCb();
        ipcMain.removeListener('pluginInstall--getLogs', getLogsListener);
        e.sender.send('pluginInstall--done');
        e.sender.send('reloadPlugins');
      }).catch(err => {
        isDone = true;
        doneCb();
        ipcMain.removeListener('pluginInstall--getLogs', getLogsListener);
        e.sender.send('pluginInstall--error', err.stack);
      });
    });
    ipcMain.on('uninstallPlugin', (e: Electron.Event, name: string) => {
      plugins.uninstall(name).then(() => {
        e.sender.send('uninstallPlugin--done');
        e.sender.send('reloadPlugins');
      }).catch(err => {
        e.sender.send('uninstallPlugin--error', err.stack);
      });
    });
    ipcMain.on('getUpdatablePlugins', (e: Electron.Event) => {
      plugins.checkForUpdates().then(list => {
        e.sender.send('updatablePlugins', list);
      });
    });
    ipcMain.on('updatePlugin', (e: Electron.Event, name: string) => {
      let isDone = false;
      let doneCb = () => {};
      const prom = plugins.install(name);

      const getLogsListener = () => {
        const tryLog = () => {
          if (isDone) return;
          plugins.installLogs().then(stream => {
            const chunkListener = (chunk: string | Buffer) => {
              e.sender.send('updatePlugin--log-chunk', String(chunk));
            };
            doneCb = () => {
              stream.removeListener('data', chunkListener);
            };
            stream.on('data', chunkListener);
          }).catch(err => {
            setTimeout(tryLog, 5000);
          });
        };
        tryLog();
      };

      ipcMain.once('updatePlugin--getLogs', getLogsListener);

      prom.then(() => {
        isDone = true;
        doneCb();
        ipcMain.removeListener('updatePlugin--getLogs', getLogsListener);
        e.sender.send('updatePlugin--done');
        e.sender.send('reloadPlugins');
      }).catch(err => {
        isDone = true;
        doneCb();
        ipcMain.removeListener('updatePlugin--getLogs', getLogsListener);
        e.sender.send('updatePlugin--error', err.stack);
      });
    });
    ipcMain.on('manager--uninstall', (e: Electron.Event, name: string) => {
      const ret = plugins.activePlugin.uninstall(name);
      let isDone = false;
      let getLogsListener: () => void = null;
      let doneCb = () => {};
      e.sender.send('manager--uninstall-isLoggable', plugins.activePlugin.properties.uninstallIsLoggable === true);
      if (plugins.activePlugin.properties.uninstallIsLoggable === true) {
        getLogsListener = () => {
          const tryLog = () => {
            if (isDone) return;
            plugins.activePlugin.uninstallLogs(name).then(stream => {
              /*doneCb = () => {
                stream.push(null);
              };*/
              stream.on('data', chunk => {
                e.sender.send('manager--uninstall-log-chunk', chunk);
              });
            }).catch(err => {
              setTimeout(tryLog, 5000);
            });
          };
          tryLog();
        };
        ipcMain.once('manager--uninstall-getLogs', getLogsListener);
      }
      if (ret instanceof EventEmitter) {
        if (plugins.activePlugin.properties.emitsProgressEvents === true) {
          ret.on('progress', (progress: number) => {
            e.sender.send('manager--uninstall-progress', progress);
          });
        } else {
          e.sender.send('manager--uninstall-progress', 50);
        }
        ret.once('error', (err: Error) => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--uninstall-getLogs', getLogsListener);
          e.sender.send('manager--uninstall-done', true);
        });
        ret.once('finish', () => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--uninstall-getLogs', getLogsListener);
          e.sender.send('manager--uninstall-done', false);
        });
      } else {
        ret.then(() => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--uninstall-getLogs', getLogsListener);
          e.sender.send('manager--uninstall-done', false);
        }, () => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--uninstall-getLogs', getLogsListener);
          e.sender.send('manager--uninstall-done', true);
        });
      }
    });
    ipcMain.on('manager--install', (e: Electron.Event, name: string) => {
      const ret = plugins.activePlugin.install(name);
      let isDone = false;
      let getLogsListener: () => void = null;
      let doneCb = () => {};
      e.sender.send('manager--install-isLoggable', plugins.activePlugin.properties.installIsLoggable === true);
      if (plugins.activePlugin.properties.installIsLoggable === true) {
        getLogsListener = () => {
          const tryLog = () => {
            if (isDone) return;
            plugins.activePlugin.installLogs(name).then(stream => {
              const chunkListener = (chunk: string | Buffer) => {
                e.sender.send('manager--install-log-chunk', String(chunk));
              };
              doneCb = () => {
                stream.removeListener('data', chunkListener);
              };
              stream.on('data', chunkListener);
            }).catch(err => {
              setTimeout(tryLog, 5000);
            });
          };
          tryLog();
        };
        ipcMain.once('manager--install-getLogs', getLogsListener);
      }
      if (ret instanceof EventEmitter) {
        if (plugins.activePlugin.properties.emitsProgressEvents === true) {
          ret.on('progress', (progress: number) => {
            e.sender.send('manager--install-progress', progress);
          });
        } else {
          e.sender.send('manager--install-progress', 50);
        }
        ret.once('error', (err: Error) => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--install-getLogs', getLogsListener);
          e.sender.send('manager--install-done', true);
        });
        ret.once('finish', () => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--install-getLogs', getLogsListener);
          e.sender.send('manager--install-done', false);
        });
      } else {
        ret.then(() => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--install-getLogs', getLogsListener);
          e.sender.send('manager--install-done', false);
        }, () => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--install-getLogs', getLogsListener);
          e.sender.send('manager--install-done', true);
        });
      }
    });
    ipcMain.on('packages--info', (e: Electron.Event, name: string) => {
      plugins.activePlugin.info(name).then(info => {
        e.sender.send('packages--info-result', info, 200);
      }, err => {
        if (err instanceof Error) {
          e.sender.send('packages--info-result', null, 500);
        } else {
          e.sender.send('packages--info-result', null, err);
        }
      });
    });
    ipcMain.on('packages--getList', (e: Electron.Event, type: ListType) => {
      const listRes = plugins.activePlugin.getPackages(type);
      if (listRes instanceof ReadableStream) {
        let len = 0;
        let cancelListener: () => void = null;
        const readListener = () => {
          const chunk = toValidPkg(listRes.read());
          if (chunk === null) return;
          len++;
          e.sender.send('packages--list-chunk', [chunk]);
        };
        const endListener = () => {
          e.sender.send('packages--list-end', len);
          ipcMain.removeListener('packages--cancelList', cancelListener);
        };
        cancelListener = () => {
          plugins.activePlugin.cancelList().then(() => {
            e.sender.send('packages--list-cancelled');
          });
          listRes.removeListener('readable', readListener);
          listRes.removeListener('end', endListener);
        };
        ipcMain.once('packages--cancelList', cancelListener);
        listRes.on('readable', readListener);
        listRes.once('end', endListener);
      } else {
        listRes.then(list => {
          const chunks = splitIntoChunks(list, 15).map(toValidPkg);
          asyncFor(chunks, (i, chunk) => {
            e.sender.send('packages--list-chunk', chunk);
            return Promise.resolve(undefined);
          }).then(() => {
            e.sender.send('packages--list-end', list.length);
          });
        });
      }
    });
    ipcMain.on('search--find', (e: Electron.Event, name: string) => {
      plugins.activePlugin.search(name).then(list => {
        e.sender.send('search--find-result', 200);
        ipcMain.once('search--getList', () => {
          if (list instanceof ReadableStream) {
            let len = 0;
            let cancelListener: () => void = null;
            const readListener = () => {
              const chunk = list.read();
              if (chunk === null) return;
              len++;
              e.sender.send('search--list-chunk', [chunk]);
            };
            const endListener = () => {
              e.sender.send('search--list-end', len);
              ipcMain.removeListener('search--cancelList', cancelListener);
            };
            cancelListener = () => {
              list.removeListener('readable', readListener);
              list.removeListener('end', endListener);
            };
            ipcMain.once('search--cancelList', cancelListener);
            list.on('readable', readListener);
            list.once('end', endListener);
          } else {
            const chunks = splitIntoChunks(list, 15);
            asyncFor(chunks, (i, chunk) => {
              e.sender.send('search--list-chunk', chunk);
              return Promise.resolve(undefined);
            }).then(() => {
              e.sender.send('search--list-end', list.length);
            });
          }
        });
      }, err => {
        if (err instanceof Error) {
          e.sender.send('search--find-result', 500);
        } else {
          e.sender.send('search--find-result', err);
        }
      });
    });
    ipcMain.on('nav--can-search', (e: Electron.Event) => {
      e.sender.send('nav--can-search-result', plugins.activePlugin.properties.isSearchable || false);
    });
    ipcMain.on('manager--update', (e: Electron.Event, name: string) => {
      const ret = plugins.activePlugin.update(name);
      let isDone = false;
      let doneCb = () => {};
      let getLogsListener: () => void = null;
      e.sender.send('manager--update-isLoggable', plugins.activePlugin.properties.updateIsLoggable === true);
      if (plugins.activePlugin.properties.updateIsLoggable === true) {
        getLogsListener = () => {
          const tryLog = () => {
            if (isDone) return;
            plugins.activePlugin.updateLogs(name).then(stream => {
              const chunkListener = (chunk: string | Buffer) => {
                e.sender.send('manager--update-log-chunk', String(chunk));
              };
              doneCb = () => {
                stream.removeListener('data', chunkListener);
              };
              stream.on('data', chunkListener);
            }).catch(err => {
              setTimeout(tryLog, 5000);
            });
          };
          tryLog();
        };
        ipcMain.once('manager--update-getLogs', getLogsListener);
      }
      if (ret instanceof EventEmitter) {
        if (plugins.activePlugin.properties.emitsProgressEvents === true) {
          ret.on('progress', (progress: number) => {
            e.sender.send('manager--update-progress', progress);
          });
        } else {
          e.sender.send('manager--update-progress', 50);
        }
        ret.once('error', (err: Error) => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--update-getLogs', getLogsListener);
          e.sender.send('manager--update-done', true);
        });
        ret.once('finish', () => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--update-getLogs', getLogsListener);
          e.sender.send('manager--update-done', false);
        });
      } else {
        ret.then(() => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--update-getLogs', getLogsListener);
          e.sender.send('manager--update-done', false);
        }, () => {
          doneCb();
          if (getLogsListener) ipcMain.removeListener('manager--update-getLogs', getLogsListener);
          e.sender.send('manager--update-done', true);
        });
      }
    });
    ipcMain.on('packages--getCategories', (e: Electron.Event) => {
      e.sender.send('packages--categories', plugins.activePlugin.properties.categories);
    });
    ipcMain.on('listeningOnIPC', (e: Electron.Event) => {
      config.get('firstTime').then(value => {
        if (value === undefined || value === true) {
          return new Promise((resolve, reject) => {
            e.sender.send('firstTime');
            ipcMain.once('firstTime--messageShown', () => {
              const done = () => {
                e.sender.send('reloadPlugins');
                e.sender.send('firstTime--done');
                return config.set('firstTime', false).then(() => {
                  resolve();
                }).catch(err => {
                  const func = () => {
                    e.sender.send('firstTime--error', err.stack);
                    resolve();
                  };
                  return rmrf(joinPath(app.getPath('userData'), 'plugins')).then(() => {
                    return rmrf(joinPath(app.getPath('userData'), 'config.json'));
                  }).then(func).catch(func);
                });
              };
              if (!defaultPlugin) {
                e.sender.send('firstTime--noDefaultPlugin');
                return done();
              }
              e.sender.send('firstTime--installingDefaultPlugin', defaultPlugin);

              let isDone = false;
              let doneCb = () => {};
              const prom = plugins.install(`pipam-${defaultPlugin}`);

              const getLogsListener = () => {
                const tryLog = () => {
                  if (isDone) return;
                  plugins.installLogs().then(stream => {
                    const chunkListener = (chunk: string | Buffer) => {
                      e.sender.send('firstTime--log-chunk', String(chunk));
                    };
                    doneCb = () => {
                      stream.removeListener('data', chunkListener);
                    };
                    stream.on('data', chunkListener);
                  }).catch(err => {
                    setTimeout(tryLog, 5000);
                  });
                };
                tryLog();
              };

              ipcMain.once('firstTime--getLogs', getLogsListener);

              prom.then(() => {
                isDone = true;
                doneCb();
                ipcMain.removeListener('firstTime--getLogs', getLogsListener);
                return plugins.activate(`pipam-${defaultPlugin}`);
              }).then(() => {
                return done();
              }).catch(err => {
                isDone = true;
                doneCb();
                ipcMain.removeListener('firstTime--getLogs', getLogsListener);
                const func = () => {
                  e.sender.send('firstTime--error', err.stack);
                  resolve();
                };
                return rmrf(joinPath(app.getPath('userData'), 'plugins')).then(() => {
                  return rmrf(joinPath(app.getPath('userData'), 'config.json'));
                }).then(func).catch(func);
              });
            });
          });
        } else {
          return Promise.resolve();
        }
      });
    });
    loadWindowMain();
    loadMenu(appCfg, __dirname, 'menu.json', 'menuCommands');
  }).catch(err => {
    console.error(err.stack);
  });
});

}
