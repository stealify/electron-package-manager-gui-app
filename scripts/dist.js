#!/usr/bin/env node

'use strict';

const { spawn, mv, mkdirp, asyncFor } = require('then-utils');
const { join: joinPath } = require('path');
const { version: ver } = require('../package.json');
const logger = require('./lib/logger');
const { inspect } = require('util');

const children = [];

function exec(str, opts) {
  const arr = str.split(' ');
  const prom = spawn(arr[0], arr.slice(1), opts);
  children.push(prom.cmd);
  prom.cmd.once('exit', () => {
    //console.log(String(prom.cmd.stderr.read()));
    children.splice(children.indexOf(prom.cmd), 1);
  });
  return prom;
}

process.on('exit', () => {
  for (const child of children) {
    child.kill();
  }
});

process.on('SIGINT', () => process.exit());

logger.section = 'prep';
logger.subsection = 'generating platform and target list';

const availablePlatforms = [
  {
    platform: 'macOS',
    arch: 'x64',
    args: '--macos dmg --x64',
    buildName: joinPath('dist', 'mac', `Pipam-${ver}.dmg`),
    outName: joinPath('dist', 'out', `Pipam-macOS-${ver}.dmg`)
  },
  {
    platform: 'Windows',
    arch: 'x64',
    args: '--windows nsis --x64',
    buildName: joinPath('dist', `Pipam Setup ${ver}.exe`),
    outName: joinPath('dist', 'out', `Pipam-Setup-Windows-x64-${ver}.exe`)
  },
  {
    platform: 'Windows',
    arch: 'IA32',
    args: '--windows nsis --ia32',
    buildName: joinPath('dist', `Pipam Setup ${ver}.exe`),
    outName: joinPath('dist', 'out', `Pipam-Setup-Windows-x86-${ver}.exe`)
  },
  {
    platform: 'Linux',
    arch: 'amd64',
    args: '--linux deb --linux AppImage --x64',
    buildName: joinPath('dist', `pipam_${ver}_amd64.deb`),
    outName: joinPath('dist', 'out', `pipam-linux-amd64-${ver}.deb`),
    extraSteps: [
      () => {
        return mv(joinPath(__dirname, '..', 'dist', `pipam-${ver}-x86_64.AppImage`), joinPath(__dirname, '..', 'dist', 'out', `pipam-linux-x86_64-${ver}.AppImage`));
      }
    ]
  }
];

let platforms = [];

if (process.env.GH_TOKEN) {
  switch (process.platform) {
    case 'win32':
      platforms.push(availablePlatforms[1]);
      break;
    case 'darwin':
      platforms.push(availablePlatforms[0]);
      break;
    case 'linux':
      platforms.push(availablePlatforms[3]);
      break;
    default:
      throw new Error('unsupported build platform');
      break;
  }
} else {
  platforms = availablePlatforms;
}

logger.info(`build platforms and targets are ${inspect(platforms, {
  depth: null,
  colors: true
})}`);

const increment = (0.8 / platforms.length) / 3;

logger.debug(`going to increment progress bar after every step for each platform by ${increment}`); 

function buildFor(platform) {
  logger.section = `build:${platform.platform}:${platform.arch}`;
  logger.subsection = 'executing build command';
  return exec(`${joinPath(__dirname, '..', 'node_modules', '.bin', (process.platform === 'win32') ? 'build.cmd' : 'build')} ${platform.args} --publish never`, {
    cwd: joinPath(__dirname, '..')
  }).then(() => {
    logger.subsection = 'moving build artifacts';
    logger.progress += increment;
    return mv(joinPath(__dirname, '..', platform.buildName), joinPath(__dirname, '..', platform.outName));
  }).then(() => {
    logger.subsection = 'performing any extra build steps';
    if (platform.extraSteps) {
      const incrementEachStep = increment / platform.extraSteps.length;
      return asyncFor(platform.extraSteps, (i, step) => {
        logger.progress += incrementEachStep;
        return Promise.resolve(step());
      });
    } else {
      logger.progress += increment;
    }
    logger.subsection = 'done';
  });
}

logger.progress = 0.1;
logger.section = 'structure';

let spinLoop = null;

logger.subsection = 'removing dist dir';
exec(`rm -rf ${joinPath(__dirname, '..', 'dist')}`).then(() => {
  logger.subsection = 'recreating dist dir';
  return mkdirp(joinPath(__dirname, '..', 'dist', 'out'));
}).then(() => {
  // return Promise.all(platforms.map(obj => buildFor(obj)));
  logger.progress = 0.2;
  logger.section = 'build';
  logger.subsection = 'starting build';
  spinLoop = setInterval(() => {
    logger.spin();
  }, 100);
  spinLoop.unref();
  return asyncFor(platforms, (i, platform) => {
    logger.debug(`file build loop iteration #${i}`);
    return buildFor(platform);
  });
}).then(() => {
  if (spinLoop) clearInterval(spinLoop);
  logger.debug('finished file build loop');
  logger.section = 'wrapup';
  logger.subsection = 'done with everything';
  return logger.hideProgress();
}).then(() => {
  return logger.success('finished building successfully! you\'re good to go!');
}).catch(err => {
  logger.error(err.message);
  logger.debug(err.stack);
});
