import test from 'ava';
import { rmrf } from 'then-utils';
import { join } from 'path';
import * as mockery from 'mockery';

// setup testing environment
import './helpers/setup-env.js';

// create (minimal) Electron shim
import './helpers/electron-shim.js';

import pluginsManager from '../app/lib/plugins/index.js';

import { app } from 'electron';

test.after.always('cleanup', async () => {
  mockery.disable();
  await rmrf(app.getPath('appData'));
});

test.serial('plugins manager is constructed', async t => t.truthy(pluginsManager));

test.serial('plugins manager can create plugin directory', async t => await t.notThrows(pluginsManager.touchDir()));

test.serial('plugins non-installed plugin is not available', async t => t.false(await pluginsManager.isAvailable('pipam-homebrew')));
test.serial('plugins doesn\'t activate non-installed plugin', async t => await t.throws(pluginsManager.activate('pipam-homebrew'), null));

test.serial('plugin list with no plugins installed', async t => {
  const list = await t.notThrows(pluginsManager.getList());
  t.is(list.length, 1, 'plugin list only contains 1 plugin');
  t.is(list[0].name, 'dummy-plugin', 'plugin list only contains dummy plugin');
});
test.serial('plugins can\'t get info for non-installed plugin', async t => await t.throws(pluginsManager.info('pipam-homebrew'), null));

test.serial('plugins activating dummy plugin doesn\'t throw', async t => await t.notThrows(pluginsManager.activateDummy()));

test.serial('plugins can get properties on plugin', async t => t.truthy(pluginsManager.activePlugin.properties));

test.serial('testing out plugin properties', async t => {
  const oldProperties = (props => props)(pluginsManager.active.module.properties);

  pluginsManager.active.module.properties = null;

  t.truthy(pluginsManager.activePlugin.properties, 'correctly retrieves properties when not specified');

  pluginsManager.active.module.properties = {
    emitsProgressEvents: true,
    isSearchable: true,
    isLoggable: true,
    categories: ['foo', 'bar']
  };

  let props = pluginsManager.activePlugin.properties;
  t.true(props.emitsProgressEvents, 'correctly retrieves emitsProgressEvents property');
  t.true(props.isSearchable, 'correctly retrieves isSearchable property');
  t.true((props.installIsLoggable === true) && (props.updateIsLoggable === true) && (props.uninstallIsLoggable === true), 'correctly retrieves isLoggable property as boolean');
  t.true((props.categories[0] === 'foo') && (props.categories[1] === 'bar'), 'correctly retrieves categories property');

  pluginsManager.active.module.properties = {
    emitsProgressEvents: true,
    isSearchable: true,
    isLoggable: {
      install: true,
      update: true,
      uninstall: true
    },
    categories: ['foo', 'bar']
  };

  props = pluginsManager.activePlugin.properties;
  t.true((props.installIsLoggable === true) && (props.updateIsLoggable === true) && (props.uninstallIsLoggable === true), 'correctly retrieves isLoggable property as object');

  pluginsManager.active.module.properties = {
    emitsProgressEvents: true,
    isSearchable: true,
    isLoggable: {
      install: false,
      update: false,
      uninstall: false
    },
    categories: ['foo', 'bar']
  };

  props = pluginsManager.activePlugin.properties;
  t.true((props.installIsLoggable === false) && (props.updateIsLoggable === false) && (props.uninstallIsLoggable === false), 'correctly retrieves isLoggable property as object');

  pluginsManager.active.module.properties = oldProperties;
});

test.serial('plugins can get package list', async t => t.truthy(pluginsManager.activePlugin.getPackages(0)));
test.serial('plugins canceling list doesn\'t throw', async t => await t.notThrows(pluginsManager.activePlugin.cancelList()));
test.serial('plugins installing doesn\'t throw', async t => await t.notThrows(pluginsManager.activePlugin.install('foobar')));
test.serial('plugins updating doesn\'t throw', async t => await t.notThrows(pluginsManager.activePlugin.update('foobar')));
test.serial('plugins uninstalling doesn\'t throw', async t => await t.notThrows(pluginsManager.activePlugin.uninstall('foobar')));

test.serial('testing out plugin functions', async t => {
  const [ oldInfo, oldSearch, oldInstallLogs, oldUpdateLogs, oldUninstallLogs, oldCancelList, oldCleanup ] = ((...args) => args)(pluginsManager.active.module.info, pluginsManager.active.module.search, pluginsManager.active.module.installLogs, pluginsManager.active.module.updateLogs, pluginsManager.active.module.uninstallLogs, pluginsManager.active.module.cancelList, pluginsManager.active.module.cleanup);

  pluginsManager.active.module.info = pluginsManager.active.module.search = pluginsManager.active.module.installLogs = pluginsManager.active.module.updateLogs = pluginsManager.active.module.uninstallLogs = pluginsManager.active.module.cancelList = pluginsManager.active.module.cleanup = () => null;

  t.true(pluginsManager.activePlugin.info('foobar') instanceof Promise, 'info returns a Promise with a function provided');
  t.true(pluginsManager.activePlugin.search('foobar') instanceof Promise, 'search returns a Promise with a function provided');
  t.true(pluginsManager.activePlugin.installLogs('foobar') instanceof Promise, 'installLogs returns a Promise with a function provided');
  t.true(pluginsManager.activePlugin.updateLogs('foobar') instanceof Promise, 'updateLogs returns a Promise with a function provided');
  t.true(pluginsManager.activePlugin.uninstallLogs('foobar') instanceof Promise, 'uninstallLogs returns a Promise with a function provided');
  t.true(pluginsManager.activePlugin.cancelList() instanceof Promise, 'cancelList returns a Promise with a function provided');
  t.true(pluginsManager.activePlugin.cleanup() instanceof Promise, 'cleanup returns a Promise with a function provided');

  pluginsManager.active.module.info = pluginsManager.active.module.search = pluginsManager.active.module.installLogs = pluginsManager.active.module.updateLogs = pluginsManager.active.module.uninstallLogs = pluginsManager.active.module.cancelList = pluginsManager.active.module.cleanup = null;

  t.true(pluginsManager.activePlugin.info('foobar') instanceof Promise, 'info returns a Promise without a function provided');
  t.true(pluginsManager.activePlugin.search('foobar') instanceof Promise, 'search returns a Promise without a function provided');
  t.true(pluginsManager.activePlugin.installLogs('foobar') instanceof Promise, 'installLogs returns a Promise without a function provided');
  t.true(pluginsManager.activePlugin.updateLogs('foobar') instanceof Promise, 'updateLogs returns a Promise without a function provided');
  t.true(pluginsManager.activePlugin.uninstallLogs('foobar') instanceof Promise, 'uninstallLogs returns a Promise without a function provided');
  t.true(pluginsManager.activePlugin.cancelList() instanceof Promise, 'cancelList returns a Promise without a function provided');
  t.true(pluginsManager.activePlugin.cleanup() instanceof Promise, 'cleanup returns a Promise without a function provided');

  pluginsManager.active.module.info = oldInfo;
  pluginsManager.active.module.search = oldSearch;
  pluginsManager.active.module.installLogs = oldInstallLogs;
  pluginsManager.active.module.updateLogs = oldUpdateLogs;
  pluginsManager.active.module.uninstallLogs = oldUninstallLogs;
  pluginsManager.active.module.cancelList = oldCancelList;
});

test.serial('plugins can cleanup without error', async t => await t.notThrows(pluginsManager.activePlugin.cleanup()));

test.serial('plugins getting install logs without a stream throws', async t => await t.throws(pluginsManager.installLogs(), null));
test.serial('plugins getting update logs without a stream throws', async t => await t.throws(pluginsManager.updateLogs(), null));
test.serial('plugins getting uninstall logs without a stream throws', async t => await t.throws(pluginsManager.uninstallLogs(), null));

test.serial('plugins no updates are available for no plugins installed', async t => await t.is((await pluginsManager.checkForUpdates()), false));

test.serial('plugins plugin install from file doesn\'t throw', async t => await t.notThrows(pluginsManager.installFromFile(join(__dirname, 'fixtures', 'pipam-homebrew.ppz'))));
test.serial('plugins plugin install from invalid ppz throws', async t => await t.throws(pluginsManager.installFromFile(join(__dirname, 'fixtures', 'invalid.ppz')), null));

test.serial('plugins no updates are available for plugins installed from a ppz', async t => await t.is((await pluginsManager.checkForUpdates()), false));

//await t.skip.notThrows(pluginsManager.install('pipam-apt'), 'plugin install from npm doesn\'t throw');

test.serial('plugins updating non-installed plugin throws', async t => await t.throws(pluginsManager.update('pipam-apt'), null));

test.serial('plugins non-installed plugin is not available', async t => t.false(await pluginsManager.isAvailable('pipam-apt')));

test.serial('plugins installed plugin is available', async t => t.true(await pluginsManager.isAvailable('pipam-homebrew')));
test.serial('plugins activating installed plugin doesn\'t throw', async t => await t.notThrows(pluginsManager.activate('pipam-homebrew')));
test.serial('plugin list with (a) plugin(s) installed', async t => {
  const list = await t.notThrows(pluginsManager.getList());
  t.truthy(list[0], 'plugin list is not empty');
  t.is(list[0].name, 'pipam-homebrew', 'plugin list contains installed plugin');
});
test.serial('info for installed plugin', async t => {
  const info = await t.notThrows(pluginsManager.info('pipam-homebrew'));
  t.is(info.name, 'pipam-homebrew', 'plugin info is correct');
});

test.serial('plugins can uninstall installed plugin', async t => await t.notThrows(pluginsManager.uninstall('pipam-homebrew')));