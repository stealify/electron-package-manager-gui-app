# Managing Plugins

Pipam provides an dumb-simple interface to manage plugins. Seriously. Like, it couldn't be *any* simpler.

When you install/update/uninstall a plugin, Pipam will automatically reload plugins. Unlike other Electron apps (I'm looking at you, Visual Studio Code), you don't need to reload the window after doing anything to plugins. 

## Installing

Installing plugins in Pipam is pretty simple. There's 2 ways to install a plugin: via npm, or from an archive. For both methods you have open Pipam, so go ahead and do that. Then, you're going to click the `Settings` button in the titlebar and (if it isn't selected already) click the `Plugins` tab. Finally (if it isn't selected) click `Install` in the sidebar.

### Installing via npm

This is probably the best (and recommended) option for installing plugins. Installing from npm allows Pipam to check if there's updates for the plugin (and will check at startup).

To install from npm, just type in the exact name of the package (including `pipam-` if it starts with that) from npm (if you don't know it, search a close guess on [npm](https://npmjs.org)) into the text input (you'll know what it is when you see it) and hit <kbd>Enter</kbd>. After that, just click the `Install` button on the resulting card.

### Installing from an archive

Pipam also supports installing from a `ppz` archive that contains a packaged plugin. You can install from a `ppz` by clicking the `Install from a PPZ` button, it'll prompt you to select a `ppz` file. After that, it'll just install.

> Note that plugins installed from an archive cannot be updated as easily as plugins from npm. You must first uninstall the current version and then install the new `ppz` using this method.

## Updating

Updating plugins in Pipam is even *simpler* than installing. Open up Pipam, click the `Settings` button in the titlebar, click the `Plugins` tab, and finally click `My Plugins` in the sidebar. When the plugins are listed, any plugins that can be updated will have an `Updatable` label. To update an `Updatable` plugin, just click the `Update` button on its card.

## Uninstalling

Uninstall plugins in Pipam is just as easy as updating. Go to the same place as you do to update (`Settings` -> `Plugins` -> `My Plugins`) and click the `Uninstall` button on the plugin's card.

## Activating

To activate plugins, just use the dropdown in the titlebar to select a plugin. Couldn't be easier.