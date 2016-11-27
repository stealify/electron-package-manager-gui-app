# Plugin Functions

## `init` and `cleanup`

**Synopsis:**<br>
&nbsp;&nbsp;`init(): Promise<void> | void`<br>
&nbsp;&nbsp;`cleanup(): Promise<void> | void`

`init` is called when your plugin is activated and `cleanup` is called when your plugin is deactivated. Note that they can be re-called during Pipam's lifecycle if your plugin is activated or deactivated more than once. In other words, every time the user selects your plugin, `init` is called, and every time they select another plugin (after having chosen yours), `cleanup` is called.

<h3 data-lang="ts">TypeScript</h3>
```ts
export function init() {
  // do whatever you need to do to initialize your plugin
}
export function cleanup() {
  // do whatever to cleanup after yourself
}
```

<h3 data-lang="js">JavaScript</h3>
```js
module.exports = {
  init() {
    // do whatever you need to do to initialize your plugin
  },
  cleanup() {
    // do whatever to cleanup after yourself
  }
};
```

## `info`

**Synopsis:** `info(pkgName: string): Promise<PackageObject>`

`info` is one of the most important functions in your plugin. It provides information about packages like their name, description, whether they're up to date, etc. The format for packages returned from this function (`PackageObject`s) is:

```ts
interface PackageObject {
  name: string;
  version: string | number;
  displayName?: string;
  description?: string;
  installed?: boolean;
  upToDate?: boolean;
  categories?: string[];
}
```

Most of these are pretty straightforward. `name` is the package name, `version` is the package version, etc. Some may not be as straightforward. E.g. `displayName` can be specified to show it instead of the package `name` for headers. `categories` can contain a list of categories the package belongs to, e.g. `['System', 'Dependency']` (note that it can be of any length and any categories can be put in, *except* 'All' or 'Updatable').

If you reuse/call this method when gathering package info for `packageList`, you should probably add an argument to this function to indicate whether it should be simple (i.e. `name` and *maybe* `displayName`) or complete.

<h3 data-lang="ts">TypeScript</h3>
```ts
import { PackageObject } from './examples/ts-defs'; // replace with wherever you store your TS defs
// See ./examples/ts-defs/index.ts for an example definition of PackageObject

export function info(pkgName: string, isSimple: boolean = false): Promise<PackageObject> {
  // if isSimple (i.e. was called from packageList to get a simple list):
  if (isSimple) return { name: pkgName };
  // otherwise, gather your info, create a PackageObject, return it, etc.
}
```

<h3 data-lang="js">JavaScript</h3>
```js
module.exports = {
  info(pkgName, isSimple = false) {
    // if isSimple (i.e. was called from packageList to get a simple list):
    if (isSimple) return { name: pkgName };
    // otherwise, gather your info, create a PackageObject, return it, etc.
  }
};
```

## `packageList` and `cancelList`

**Synopsis:**<br>
&nbsp;&nbsp;`packageList(listType: ListType): ListStream | Promise<PackageObject[]>`<br>
&nbsp;&nbsp;`cancelList(): Promise<void> | void`

`packageList` is called to get a list of the installed packages. It can either return a `Promise` that resolves with an `Array` of objects or it can return a `Readable` stream from Node.js' `stream` module *in object mode* that streams objects.

It receives a single argument, the list type. The list type indicates what kind of list you should return. The default is a detailed list with information on whether packages are up to date, what version they have, a little description, etc. However, the user can also opt-in to a simple list, which **should** only contain the package name and optionally the display name, **and nothing more**. The simple list type is meant to be quick way to get a list of installed packages. List types are:
```js
[
  'Detailed',
  'Simple'
]
```

The objects should be in the same format as the objects returned from `info`. In fact, to keep your code DRY, you should probably just call `info` with each package name to get objects.
<!--
It should be noted that package `name`s **must** be unique (however, `displayName`s don't have to be). If a package `name` is repeated, only the first package with that `name` will be displayed.
-->
It's recomended to return a `Readable` stream instead of a `Promise`, since the results can be streamed live to the user as they're received.

`cancelList` is the opposite of `packageList`. When it's called, you should to stop sending objects if you returned a stream (or resolve with an empty array if you were gonna return a `Promise`). You can continue, of course, but know that after this function is called, any objects return from that call of `packageList` will be ignored.

<h3 data-lang="ts">TypeScript</h3>
```ts
import { Readable } from 'stream';
import { ListType } from './examples/ts-defs'; // replace with wherever you store your TS defs
// See ./examples/ts-defs/index.ts for an example definition of ListType

class ListStream extends Readable {
  constructor() {
    super({ objectMode: true });
  }
  _read() {}
}

let oncancel = () => {};

export function packageList(listType: ListType): ListStream {
  const stream = new ListStream();
  switch(listType) {
    case ListType.Detailed:
      // get your detailed list and `push` resulting objects to the stream
      oncancel = () => {
        // do something to stop pushing objects
        // e.g. set a var and check it at the top of your loop
      }
      break;
    case ListType.Simple:
      // do the same, except with a simple list instead
      oncancel = () => {}; // same as above
      break;
  }
  return stream;
}

export function cancelList() {
  oncancel();
}
```

<h3 data-lang="js">JavaScript</h3>
```js
const { Readable } = require('stream');

module.exports = {
  packageList(listType) {
    const stream = new Readable({
      objectMode: true
    });
    stream._read = () => {};
    switch(listType) {
      case 0:
        // Detailed
        // get your detailed list and `push` resulting objects to the stream
        break;
      case 1:
        // Simple
        // do the same, except with a simple list instead
        break;
    }
    return stream;
  }
};
```

## `install`, `uninstall`, and `update`

**Synopsis:**<br>
&nbsp;&nbsp;`install(pkgName: string): Promise<void> | EventEmitter`<br>
&nbsp;&nbsp;`uninstall(pkgName: string): Promise<void> | EventEmitter`<br>
&nbsp;&nbsp;`update(pkgName: string): Promise<void> | EventEmitter`

When any of these functions are called, you should install/uninstall/update something. You should return a `Promise` if your plugin doesn't emit `progress` events, and it should resolve when you're done and reject when something blows up. If your plugin *does* emit `progress` events, then you need to return an `EventEmitter` that emits `finish` when you're done or `error` if your plugin died, along with `progress` and a percent (out of 100) when you do something.

<h3 data-lang="ts">TypeScript</h3>
```ts
export function install(pkgName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // install the thing...
    resolve();
  });
};
export function uninstall(pkgName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // uninstall the thing...
    resolve();
  });
};
export function update(pkgName: string): Promise<void> {
  // you get the idea
};
```

<h3 data-lang="js">JavaScript</h3>
```js
module.exports = {
  install(pkgName) {
    return new Promise((resolve, reject) => {
      // install the thing...
      resolve();
    });
  }
  uninstall(pkgName) {
    return new Promise((resolve, reject) => {
      // uninstall the thing...
      resolve();
    });
  }
  update(pkgName) {
    // you get the idea
  }
};
```
## More functions

  * The log functions (`installLogs`, `uninstallLogs`, and `updateLogs`) are in [Logs](./logs.md)
  * The search function is in [Search](./search.md)