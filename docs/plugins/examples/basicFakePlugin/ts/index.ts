'use strict';

import { Readable } from 'stream';
import { PackageObject, ListType } from '../../ts-defs';

const pkgRepo: PackageObject[] = [
  {
    name: 'fake1',
    version: '1.0.0',
    upToDate: true,
    installed: true
  },
  {
    name: 'fake2',
    version: '0.8.0',
    upToDate: false,
    installed: true
  }
];

const myFakeTemporaryListOfPackages: string[] = [
  'fake2'
];

class ListStream extends Readable {
  constructor() {
    super({
      objectMode: true
    });
  }
  _read(): void {}
}

export const properties = {
  emitsProgressEvents: false,
  isSearchable: false,
  isLoggable: false
};

export function packageList(listType: ListType): ListStream {
  const stream = new ListStream();
  setImmediate(() => {
    switch(listType) {
      case ListType.Detailed:
        // you should probably loop asyncronously to avoid blocking
        for (const pkgName of myFakeTemporaryListOfPackages) {
          stream.push(info(pkgName));
        }
        break;
      case ListType.Simple:
        for (const pkgName of myFakeTemporaryListOfPackages) {
          stream.push({
            name: pkgName,
            version: 'unknown'
          });
        }
        break;
    }
  });
  return stream;
};

export function install(pkgName: string): Promise<void> {
  if (myFakeTemporaryListOfPackages.includes(pkgName)) return Promise.resolve();

  // again, you should probably loop asyncronously to avoid blocking
  for (const item of pkgRepo) {
    if (item.name === pkgName) {
      myFakeTemporaryListOfPackages.push(pkgName);
      return Promise.resolve();
    }
  }
  return Promise.reject(new Error('Not found'));
};

export function uninstall(pkgName: string): Promise<void> {
  if (!myFakeTemporaryListOfPackages.includes(pkgName)) return Promise.resolve();

  myFakeTemporaryListOfPackages.splice(myFakeTemporaryListOfPackages.indexOf(pkgName), 1);
  return Promise.resolve();
};

export function info(pkgName: string): Promise<PackageObject> {
  // again, you should probably loop asyncronously to avoid blocking
  for (const item of pkgRepo) {
    if (item.name === pkgName) return Promise.resolve(item);
  }
  return Promise.reject(404);
};

export function update(pkgName: string): Promise<void> {
  if (!myFakeTemporaryListOfPackages.includes(pkgName)) return Promise.reject('Not installed');

  return info(pkgName).then(info => {
    if (info.upToDate) return;
    info.version = '1.0.0';
    info.upToDate = true;
  });
};
