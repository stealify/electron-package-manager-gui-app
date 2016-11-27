'use strict';

import { ListType } from '../plugins/pluginDefs';

export const properties = {
  emitsProgressEvents: false,
  isSearchable: false,
  isLoggable: false
};
export function init(): Promise<void> {
  return Promise.resolve();
};
export function cleanup(): Promise<void> {
  return Promise.resolve();
};
export function packageList(type: ListType): Promise<any[]> {
  return Promise.resolve([]);
};
export function install(pkg: string): Promise<void> {
  return Promise.resolve();
};
export function uninstall(pkg: string): Promise<void> {
  return Promise.resolve();
};
export function info(pkg: string): Promise<object> {
  return Promise.reject(404);
};
export function update(pkg: string): Promise<void> {
  return Promise.resolve();
};
