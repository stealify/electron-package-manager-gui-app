import test from 'ava';
import { rmrf } from 'then-utils';
import { join } from 'path';
import * as mockery from 'mockery';

// setup testing environment
import './helpers/setup-env.js';

// create (minimal) Electron shim
import './helpers/electron-shim.js';

import configManager from '../app/lib/config/index.js';

import { app } from 'electron';

test.after.always('cleanup', async () => {
  mockery.disable();
  await rmrf(app.getPath('appData'));
});

test.serial('config manager is constructed', t => t.truthy(configManager));

test.serial('config manager sets root values', async t => await t.notThrows(configManager.set('foo', 'bar')));
test.serial('config manager gets root values', async t => t.is(await configManager.get('foo'), 'bar'));
test.serial('config manager retrieves root parent object', t => t.is(configManager.getParentObjectForKeyPath('foo'), configManager.obj));
test.serial('config manager retrieves desired key on root object', t => t.is(configManager.getLastKeyPathComponent('foo'), 'foo'));

test.serial('config manager sets non-root values', async t => await t.notThrows(configManager.set('baz.qux', 'ok')));
test.serial('config manager gets non-root values', async t => t.is(await configManager.get('baz.qux'), 'ok'));
test.serial('config manager retrieves non-root parent object', t => t.is(configManager.getParentObjectForKeyPath('baz.qux'), configManager.obj.baz));
test.serial('config manager retrieves desired key on non-root object', t => t.is(configManager.getLastKeyPathComponent('baz.qux'), 'qux'));