'use strict';

const argv = process.argv.slice(2);
const debugEnvVar = (String(process.env.DEBUG) === 'true' || String(process.env.DEBUG) === '1');
import * as chalk from 'chalk';
import { parseArgs } from 'then-utils';

function escapeQuotes(str) {
  const strify = JSON.stringify(str);
  return strify.substr(1, strify.length - 2);
}

class Logger {
  info(msg: string, where?: string): Promise<void> {
    return parseArgs(argv).then((args) => {
      if (!args.v && !args.verbose && !debugEnvVar) return;
      console.log(`<${chalk.cyan('info')}${(where) ? `class="${chalk.cyan(escapeQuotes(where))}"` : ''}${(msg) ? `> ${msg} </${chalk.cyan('info')}` : '/'}>`);
    });
  }
  error(msg: string | Error, where?: string): Promise<void> {
    process.exitCode = 1;
    return Promise.resolve(console.log(`<${chalk.red('error')}${(where) ? ` class="${chalk.red(escapeQuotes(where))}"` : ' '}${(msg) ? `> ${(msg instanceof Error) ? msg.stack : msg} </${chalk.red('error')}` : '/'}>`));
  }
  warn(msg: string, where?: string): Promise<void> {
    return Promise.resolve(console.log(`<${chalk.yellow('warn')}${(where) ? ` class="${chalk.yellow(escapeQuotes(where))}"` : ' '}${(msg) ? `> ${msg} </${chalk.yellow('warn')}` : '/'}>`));
  }
  debug(msg: string, where?: string): Promise<void> {
    if (!debugEnvVar) return Promise.resolve();
    return Promise.resolve(console.log(`<${chalk.grey('debug')}${(where) ? ` class="${chalk.grey(escapeQuotes(where))}"` : ' '}${(msg) ? `> ${msg} </${chalk.grey('debug')}` : '/'}>`));
  }
  success(msg: string, where?: string): Promise<void> {
    return Promise.resolve(console.log(`<${chalk.green('success')}${(where) ? ` class="${chalk.green(escapeQuotes(where))}"` : ' '}${(msg) ? `> ${msg} </${chalk.green('success')}` : '/'}>`));
  }
}

export default new Logger();
export {
  Logger
};