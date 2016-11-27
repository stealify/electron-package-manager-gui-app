# Search

Because sometimes you don't exactly what you're looking for, right?

**First of all**, you need to have `isSearchable` set to true in your plugin's `properties` in order for Pipam to know that you can search with your plugin. **Second**, you need to know the function:

**Synopsis:** `search(searchTerm: string): Promise<stream.Readable | PackageObject[]>`

It's the same as `packageList`, except that you should search for the `searchTerm` and return a list containing the results from the search instead. Also (unlike `packageList`), instead of returning the stream directly, you should return a `Promise` and resolve the stream. 

<h3 data-lang="ts">TypeScript</h3>
```ts
import { Readable } from 'stream';

class ListStream extends Readable {
  constructor() {
    super({
      objectMode: true
    });
  }
  _read(): void {}
}

export function search(searchTerm: string): Promise<ListStream | PackageObject[]> {
  // do yo thang
}
```

<h3 data-lang="js">JavaScript</h3>
```js
const { Readable } = require('stream');

class ListStream extends Readable {
  constructor() {
    super({
      objectMode: true
    });
  }
  _read(): void {}
}

module.exports = {
  search(searchTerm: string): Promise<ListStream | PackageObject[]> {
    // do yo thang
  }
};
```

## Nope, don't need it.

That's cool, the default value in `properties` for `isSearchable` is `false`, so just leave it as that (or if you want to be all explicit... just do `isSearchable: false`).