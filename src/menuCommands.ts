'use strict';

export function toggleDevTools(item: any, window: any): void {
  if (window) window.toggleDevTools();
}
export function closeWindow(item: any, window: any): void {
  if (window) window.close();
}
export function wantsAbout(item: any, window: any): void {
  if (window) window.webContents.send('wantsAbout');
}
