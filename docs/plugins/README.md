# Plugins

Pipam really isn't much of anything without its plugins. They're the most vital part of the application. Pipam plugins provide a way to interface package managers with a generic GUI; typically, the package managers that are interfaced are those that provide CLI-only interfaces.

> This doc is about *writing* Pipam plugins; for help on installing and updating plugins, see [Managing Plugins](../managing-plugins.md)

If you've found out that your favorite package manager doesn't have a GUI, you're in luck! There's probably already a plugin for it (especially major package managers like apt-get, Homebrew, Chocolatey, etc.; you can see all available plugins by doing an [npm keyword search](https://www.npmjs.com/browse/keyword/pipam)), however if there's not, it's really easy to write one!

## Getting Started

Let's create an example plugin, for our pretend package manager `pkgs`, called `pipam-pkgs`.

> It's a good idea to prepend any Pipam plugin's name with `pipam-`, so it can easily be identified as a Pipam plugin

Let's create a new folder for our little plugin; make it wherever you like best:

<h3 data-os="unix">Unix</h3>
```bash
mkdir pipam-pkgs
cd pipam-pkgs
```

<h3 data-os="win">Windows</h3>
```bat
mkdir pipam-pkgs
cd pipam-pkgs
```

Pipam plugins are Node.js modules at their core, so we'll need to do an `npm init` with our plugin's information to get us up and running:

<h3 data-os="unix">Unix</h3>
```bash
npm init
# Answer the questions it asks (i.e. name = pipam-pkgs, author = you, description = whatever you like, etc.)
```

<h3 data-os="win">Windows</h3>
```bat
npm init
REM Answer the questions it asks (i.e. name = pipam-pkgs, author = you, description = whatever you like, etc.)
```

However, Pipam expects a bit more information than the default that npm provides in a module's `package.json`, so we need to open up an editor and open `package.json`. We're going to add a `pipam` field at the root of the JSON, which provides things like the `displayName` of the plugin.

```json
{
  "name": "pipam-pkgs",
  "other-stuff": "...",
  "pipam": {
    "displayName": "Pkgs"
  }
}
```

The `displayName` is usually the only thing in there, and what it does it provide a different name than the package name (because seeing `pipam-whatever` for every item in the manager dropdown in Pipam is just plain annoying). Also, without the `pipam` field, Pipam will reject loading your plugin (it will assume it's not a Pipam plugin without the field).

## Write all the code!

Now let's actually write some code. Let's provide all they basic functions that Pipam requires, but for now let's leave them empty.

<h3 data-lang="ts">TypeScript</h3>
```ts
// index.ts

export const properties = {};
export function packageList() {};
export function install(pkgName: string) {};
export function uninstall(pkgName: string) {};
export function info(pkgName: string) {};
export function update(pkgName: string) {};
```

<h3 data-lang="js">JavaScript</h3>
```js
// index.js
'use strict';

module.exports = {
  properties: {},
  packageList() {},
  install(pkgName) {},
  uninstall(pkgName) {},
  info(pkgName) {},
  update(pkgName) {}
};
```

## What is all this?

Let's see what each of these things actually do.

### `properties`

`properties` provides a bit of information about your plugin. The amount of detail was so overwhelming that it overflowed into another file! See [Properties](./properties.md).

### The functions

Well, guess what? The functions were too much information to stuff in here, too. So... go read [Functions](./functions.md). Go. Read it. Now. C'mon, I know you don't read that fast.

Read it? Yes? No? I'm watching you...

## Make it actually do stuff

If you didn't read those other 2 docs, just... *sigh* you're going to be lost from here on out. Go back and read them.

If you did read it, good job! You win... **knowledge** 👍 .

Well, now we need to actually have it do things, otherwise it's not much of a plugin. So let's have our plugin pretend to do stuff. I mean, there's not actually a package manager called `pkgs`, is there? You can figure out how to apply all of this to a real package manager later on your own.

<h3 data-lang="ts">TypeScript</h3>
<span>See [`examples/basicFakePlugin/ts/index.ts`](./examples/basicFakePlugin/ts/index.ts) for the completed example.</span>

<h3 data-lang="js">JavaScript</h3>
<span>See [`examples/basicFakePlugin/js/index.js`](./examples/basicFakePlugin/js/index.js) for the completed example.</span>
