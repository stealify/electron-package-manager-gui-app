'use strict';

import { createReadStream } from 'fs';
import { createUnzip, createInflate } from 'zlib';
import { Extract } from 'tar';
import { dir } from 'tmp';
import { callWithPromiseOrCallback, mv } from 'then-utils';
import { join as joinPath } from 'path';

const types = [
  createUnzip,
  createInflate
];

export default function(pathname: string, outpath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const instream = createReadStream(pathname);

    instream.once('readable', () => {
      // read the ppz type number
      const type = (<Buffer>instream.read(1))[0];
      // read the ppz output folder name length
      const outputNameLen = (<Buffer>instream.read(4)).readUInt32LE(0);
      // read the ppz output folder name
      const outputName = (<Buffer>instream.read(outputNameLen)).toString('utf8');
      // read the plugin name length
      const nameLen = (<Buffer>instream.read(4)).readUInt32LE(0);
      // read the plugin name
      const name = (<Buffer>instream.read(nameLen)).toString('utf8');

      let decompressor = types[type];
      if (!decompressor) return reject(new Error('no such compression type'));

      callWithPromiseOrCallback(dir).then(tmppath => {
        instream.on('error', reject)
        .pipe(decompressor()).on('error', reject)
        .pipe(Extract({
          path: tmppath
        })).on('error', reject).on('end', () => {
          mv(joinPath(tmppath, outputName), joinPath(outpath, name)).then(() => {
            resolve(name);
          }).catch(reject);
        });
      });
    });
  });
};
