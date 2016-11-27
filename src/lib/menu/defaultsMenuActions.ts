'use strict';

import { app } from 'electron';

export function onToggleFullScreen(item: any, window: any): void {
  window.setFullScreen(!window.isFullScreen());
};

export function onQuit(item: any, window: any): void {
  app.quit();
};
