const { join } = require('path');
const { existsSync, mkdirSync } = require('fs');
const mockery = require('mockery');

const paths = Symbol();

class App {
  constructor() {
    this[paths] = {};

    this.setPath('appData', join(__dirname, '..', 'tmp-app'));
    this.setPath('userData', join(this.getPath('appData'), 'PipamTesting'));
  }
  getPath(key) {
    if (!this[paths][key]) return null;
    return this[paths][key];
  }
  setPath(key, value) {
    if (!existsSync(value)) mkdirSync(value);
    this[paths][key] = value;
  }
}

const electron = {
  app: new App()
};

mockery.registerMock('electron', electron);