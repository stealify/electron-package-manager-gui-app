/// <reference types="node" />
/// <reference types="es6-promise" />

// Type definitions for then-utils v1.5.4
// Project: https://github.com/facekapow/then-utils
// Definitions by: facekapow <https://github.com/facekapow>

declare module 'then-utils' {
  import * as stream from 'stream';
  import * as child_process from 'child_process';

  type object = any;
  type PromiseConstructorHandler = (resolve: (data?: any) => void, reject: (err?: any) => void) => void;

  interface ChildProcessPromise<T> extends Promise<T> {
    cmd: child_process.ChildProcess;
  }
  interface ChildProcessResult {
    stdout: string | Buffer;
    stderr: string | Buffer;
  }

  interface FileOptions {
    encoding?: string;
    flag?: string;
  }
  interface ReadFileOptions extends FileOptions {}
  interface WriteFileOptions extends FileOptions {
    mode?: number;
  }

  interface FolderOptions {
    recursive?: boolean;
  }
  interface ReaddirOptions extends FolderOptions {
    encoding?: string;
  }
  interface FilterByExtensionOptions extends FolderOptions {}

  export function callWithPromiseOrCallback(func: (...args: any[]) => void | Promise<any>, ...args: any[]): Promise<any>;
  export function returnPromiseOrCallback(callback: (err: Error, data: any) => void, handler: PromiseConstructorHandler): Promise<any>;
  export function asyncFor<T>(array: T[], onloop: (index: number, value: T) => Promise<void>): Promise<void>;
  export function asyncFor(count: number, onloop: (iteration: number) => Promise<void>): Promise<void>;
  export function asyncFor(object: object, onloop: (key: string, value: any) => Promise<void>): Promise<void>;
  export function parseArgs(args: Array<string>): Promise<object>;
  export function sleep(milliseconds: number): Promise<void>;
  export function asyncWhile(oneval: () => boolean, onloop: () => Promise<boolean>): Promise<void>;

  export function rmrf(pathname: string): Promise<void>;
  export function mkdirp(pathname: string): Promise<void>;
  export function writeFile(filename: string | Buffer | number, data: string | Buffer, options?: string | WriteFileOptions): Promise<void>;
  export function readFile(filename: string | Buffer | number, options?: string | ReadFileOptions): Promise<string | Buffer>;
  export function mv(oldpath: string, newpath: string): Promise<void>;
  export function cpr(from: string, to: string): Promise<void>;
  export function readdir(dir: string, options?: ReaddirOptions): Promise<Array<string>>;
  export function filterByExtension(pathname: string, extension: string, options?: FilterByExtensionOptions): Promise<Array<string>>;

  export function exec(command: string, options?: child_process.ExecOptions): Promise<ChildProcessResult>;
  export function spawn(command: string, args?: Array<string>, options?: child_process.SpawnOptions): ChildProcessPromise<void>;

  export {
    ChildProcessResult,
    ReadFileOptions,
    WriteFileOptions,
    ReaddirOptions,
    FilterByExtensionOptions
  };
}