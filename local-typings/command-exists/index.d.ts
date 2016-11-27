// Type definitions for command-exists v1.0.2
// Project: https://github.com/mathisonian/command-exists
// Definitions by: facekapow <https://github.com/facekapow>

declare module 'command-exists' {
  function commandExists(command: string, callback: (err: Error, commandExists?: boolean) => void): void;
  export = commandExists;
}