// Type definitions for getos v2.8.2
// Project: https://github.com/retrohacker/getos
// Definitions by: facekapow <https://github.com/facekapow>

declare module 'getos' {
  interface OSInfoObject {
    dist?: string;
    codename?: string;
    release?: string;
  }

  function getos(callback: (err: Error, os?: OSInfoObject) => void): void;

  export = getos;
}