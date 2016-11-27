# Logs

Great! Your plugin provides a way to install/uninstall/update/&lt;insert action here&gt;! But, that feels like it's taking forever, don'tcha think? Yeah, that spinner isn't going to keep anyone entertained for very long...

**Solution!** Let the user know what your plugin is in the background! How? With logs of course!

## How?

Currently, logs are *kind of* awkward for plugin developers. It's pretty normal if your package manager stores logs in the filesystem, since then you can just tail the log and stream it. However, it gets weird if your logs are simply the output of running a package manager command verbosely.

Nonetheless, streaming it from the command output *is* possible. One solution could be to store a stream in another file which would act as a sort of cache, and then in the respective log function you return it from the cache. An example of this would be `pipam-homebrew`'s method.

## Functions

Each function should return a `Promise` that resolves with the `Readable` stream for the log:

<h3 data-lang="ts">TypeScript</h3>
```ts
import { Readable } from 'stream';

class LogStream extends Readable {
  _read() {}
}

export function installLogs(): Promise<LogStream> {}
export function uninstallLogs(): Promise<LogStream> {}
export function updateLogs(): Promise<LogStream> {}
```

<h3 data-lang="js">JavaScript</h3>
```js
const { Readable } = require('stream');

class LogStream extends Readable {
  _read() {}
}

module.exports = {
  installLogs() {},
  uninstallLogs() {},
  updateLogs() {}
};
```

## I don't want 'em!

You can also disable logs altogether by telling Pipam in your plugin's `properties`:

<h3 data-lang="ts">TypeScript</h3>
```ts
export const properties = {
  isLoggable: false
  // or one at a time:
  isLoggable: {
    install: false,
    uninstall: false,
    update: false
  }
};
```

<h3 data-lang="js">JavaScript</h3>
```js
module.exports = {
  properties: {
    isLoggable: false
    // or one at a time:
    isLoggable: {
      install: false,
      uninstall: false,
      update: false
    }
  }
};
```
