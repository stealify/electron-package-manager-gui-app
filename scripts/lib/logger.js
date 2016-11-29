'use strict';

const argv = process.argv.slice(2);
const debugEnvVar = (String(process.env.DEBUG) === 'true' || String(process.env.DEBUG) === '1');
const Gauge = require('gauge');
const chalk = require('chalk');
const { parseArgs } = require('then-utils');

function escapeQuotes(str) {
  const strify = JSON.stringify(str);
  return strify.substr(1, strify.length - 2);
}

const bar = new Gauge();

let section = '';
let subsection = '';
let progress = 0;

module.exports = {
  get section() {
    return section;
  },
  set section(val) {
    section = String(val);
    this.renderProgress();
  },
  get subsection() {
    return subsection;
  },
  set subsection(val) {
    subsection = String(val);
    this.renderProgress();
  },
  get progress() {
    return progress;
  },
  set progress(val) {
    let prog = parseFloat(val);
    if (prog > 1) prog = 1;
    if (prog < 0) prog = 0;
    progress = prog;
    this.renderProgress();
  },
  renderProgress() {
    bar.show(section, progress);
    bar.pulse(subsection);
    return Promise.resolve();
  },
  spin() {
    bar.pulse(subsection);
    return Promise.resolve();
  },
  hideProgress() {
    return new Promise((resolve, reject) => {
      bar.hide((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  info(msg) {
    return parseArgs(argv).then((args) => {
      if (!args.v && !args.verbose && !debugEnvVar) return;
      console.log(`<${chalk.cyan('info')} class="${chalk.cyan(section)}" name="${chalk.cyan(escapeQuotes(subsection))}"${(msg) ? `> ${msg} </${chalk.cyan('info')}` : '/'}>`);
    });
  },
  error(msg) {
    process.exitCode = 1;
    return Promise.resolve(console.log(`<${chalk.red('error')} class="${chalk.red(section)}" name="${chalk.red(escapeQuotes(subsection))}"${(msg) ? `> ${msg} </${chalk.red('error')}` : '/'}>`));
  },
  warn(msg) {
    return Promise.resolve(console.log(`<${chalk.yellow('warn')} class="${chalk.yellow(section)} name="${chalk.yellow(escapeQuotes(subsection))}"${(msg) ? `> ${msg} </${chalk.yellow('warn')}` : '/'}>`));
  },
  debug(msg) {
    if (!debugEnvVar) return Promise.resolve();
    return Promise.resolve(console.log(`<${chalk.grey('debug')} class="${chalk.grey(section)}" name="${chalk.grey(escapeQuotes(subsection))}"${(msg) ? `> ${msg} </${chalk.grey('debug')}` : '/'}>`));
  },
  success(msg) {
    return Promise.resolve(console.log(`<${chalk.green('success')} class="${chalk.green(section)}" name="${chalk.green(escapeQuotes(subsection))}"${(msg) ? `> ${msg} </${chalk.green('success')}` : '/'}>`));
  }
};