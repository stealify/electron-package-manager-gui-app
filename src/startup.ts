'use strict';

import { app } from 'electron';
import { join as joinPath } from 'path';

(<object>global).app = app;

const appJson = require('./app.json');
let appCfg = appJson;

if (process.env.NODE_ENV === 'testing') {
  appCfg = appJson.testing;
}

app.setPath('userData', joinPath(app.getPath('appData'), appCfg.titleBarName));