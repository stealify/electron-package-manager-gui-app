#!/usr/bin/env node
'use strict';

const logger = require('./lib/logger');
const mktree = require('directory-tree');
const { join: joinPath, extname, basename } = require('path');
const { readdir, asyncFor, readFile, callWithPromiseOrCallback, writeFile } = require('then-utils');

const index = {};
const docdir = joinPath(__dirname, '..', 'docs');
const except = {
  [joinPath(docdir, 'plugins', 'examples')]: true
};
function relativeToDocdir(pathname) {
  if (pathname.substr(0, docdir.length) === docdir) return pathname.substr(docdir.length + 1);
  return pathname;
}

logger.section = 'mktree';
logger.subsection = 'generating directory tree';
Promise.resolve(mktree(docdir, ['.md'])).then(tree => {
  logger.progress = 0.1;

  logger.section = 'gen';
  logger.subsection = 'recursing tree';
  const recurseTree = (indexPart, treePart) => {
    logger.section = 'gen:recurse';
    logger.subsection = 'reading directory README.md';

    return readFile(joinPath(treePart.path, 'README.md'), 'utf8').then(cont => {
      logger.subsection = 'extracting needed content from README.md';

      const partTitle = cont.substring(0, cont.indexOf('\n')).substr(2);
      indexPart.title = partTitle;
      indexPart.path = joinPath(relativeToDocdir(treePart.path), 'README.md');
      indexPart.children = [];


      logger.subsection = 'recursing child nodes';
      return asyncFor(treePart.children, (i, child) => {
        if (except[child.path]) return Promise.resolve();
        if (child.children) {
          const part = {};
          indexPart.children.push(part);
          return recurseTree(part, child);
        }
        if (child.name === 'README.md') return Promise.resolve();

        logger.subsection = 'reading child';
        return readFile(child.path, 'utf8').then(cont => {
          const title = cont.substring(0, cont.indexOf('\n')).substr(2);
          logger.subsection = 'extracting needed content from child';

          indexPart.children.push({
            title,
            path: relativeToDocdir(child.path)
          });
        });
      });
    }).then(() => indexPart);
  };
  return recurseTree(index, tree);
}).then(index => {
  logger.section = 'wrapup';
  logger.subsection = 'writing index';
  return writeFile(joinPath(process.cwd(), 'docs-index.json'), JSON.stringify(index, null, 2));
}).then(() => {
  logger.subsection = 'done';
  logger.success(`wrote "${joinPath(process.cwd(), 'docs-index.json')}". all done!`);
});
