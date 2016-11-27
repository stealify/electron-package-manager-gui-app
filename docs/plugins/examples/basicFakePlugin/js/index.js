'use strict';

const { Readable } = require('stream');

const pkgRepo = [
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

const myFakeTemporaryListOfPackages = [
  'fake2'
];

module.exports = {
  properties: {
    emitsProgressEvents: false,
    isSearchable: false,
    isLoggable: false
  },
  packageList() {
    const stream = new Readable({
      objectMode: true
    });
    stream._read = () => {};
    setImmediate(() => {
      // you should probably loop asyncronously to avoid blocking
      for (const pkgName of myFakeTemporaryListOfPackages) {
        stream.push(module.exports.info(pkgName));
      }
    });
    return stream;
  },
  install(pkgName) {
    if (myFakeTemporaryListOfPackages.includes(pkgName)) return Promise.resolve();

    // again, you should probably loop asyncronously to avoid blocking
    for (const item of pkgRepo) {
      if (item.name === pkgName) {
        myFakeTemporaryListOfPackages.push(pkgName);
        return Promise.resolve();
      }
    }
    return Promise.reject(new Error('Not found'));
  },
  uninstall(pkgName) {
    if (!myFakeTemporaryListOfPackages.includes(pkgName)) return Promise.resolve();

    myFakeTemporaryListOfPackages.splice(myFakeTemporaryListOfPackages.indexOf(pkgName), 1);
    return Promise.resolve();
  },
  info(pkgName) {
    // again, you should probably loop asyncronously to avoid blocking
    for (const item of pkgRepo) {
      if (item.name === pkgName) return Promise.resolve(item);
    }
    return Promise.reject(404);
  },
  update(pkgName) {
    if (!myFakeTemporaryListOfPackages.includes(pkgName)) return Promise.reject('Not installed');

    return module.exports.info(pkgName).then(info => {
      if (info.upToDate) return;
      info.version = '1.0.0';
      info.upToDate = true;
    });
  }
}