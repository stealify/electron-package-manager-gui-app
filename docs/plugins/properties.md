# Plugin Properties

A plugin's `properties` can provide some info about it. It can contain various fields, like...

## `emitsProgressEvents`

**Type**: `boolean`<br>
**Defaults to:** `false`

This tells Pipam whether the plugin emits progress events when you return an `EventEmitter` from `install`, `uninstall`, or `update`. If this is `false`, Pipam will automatically start the progress bar on these actions at 50%; otherwise, if it's `true`, Pipam will only update the bar with the percent from a `progress` event on the emitter.

## `isSearchable`

**Type**: `boolean`<br>
**Defaults to:** `false`

Lets Pipam know if the plugin provides a `search` function, so it knows if it should show or hide the `Search` tab in the navigation.

## `isLoggable`

**Type**: `boolean | Object`<br>
**Defaults to**: `false`

Tells Pipam if it can request logs from your plugin through `installLogs`, `uninstallLogs`, and `updateLogs`. This will also allow it to show or hide a `Show Logs` button on each of the action's popups. If it's an object, you can set `install`, `uninstall`, and `update` specifically to `true` or `false`. If it's a boolean, every property available in the object will be set to the value provided.

e.g.
<h3 data-lang="ts">TypeScript</h3>
```ts
export const properties = {
  isLoggable: {
    install: false,
    uninstall: false,
    update: false
  },
  // this is the same as:
  isLoggable: false
};
```

<h3 data-lang="js">JavaScript</h3>
```js
module.exports = {
  properties: {
    isLoggable: {
      install: false,
      uninstall: false,
      update: false,
    }
    // this is the same as:
    isLoggable: false
  }
};
```

> More about logs over in [Logs](./logs.md)
