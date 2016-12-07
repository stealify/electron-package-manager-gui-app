import { EventEmitter } from 'events';
import * as stream from 'stream';

export enum ListType {
  Detailed,
  Simple
}
export enum InstallType {
  npm,
  Archive
}

export interface PackageObject {
  name: string;
  version: string | number;
  displayName?: string;
  description?: string;
  installed?: boolean;
  upToDate?: boolean;
  categories?: string[];
  removed?: boolean;
}
export interface ValidPackageObject {
  name: string;
  version: string | number;
  displayName: string;
  description: string;
  installed: boolean;
  upToDate: boolean;
  categories: string[];
}
export interface PluginProperties {
  emitsProgressEvents?: boolean;
  isSearchable?: boolean;
  isLoggable?: boolean | {
    install?: boolean;
    uninstall?: boolean;
    update?: boolean;
  };
  categories?: string[];
}
export interface PluginModule {
  properties: PluginProperties;
  init(): Promise<void>;
  cleanup(): Promise<void>;
  packageList(type?: ListType, ...extraData: any[]): stream.Readable | Promise<PackageObject[]>;
  cancelList?(): Promise<void>;
  install(pkgName: string): EventEmitter | Promise<void>;
  installLogs?(pkgName: string): stream.Readable | Promise<stream.Readable>;
  uninstall(pkgName: string): EventEmitter | Promise<void>;
  uninstallLogs?(pkgName: string): stream.Readable | Promise<stream.Readable>;
  update(pkgName: string): EventEmitter | Promise<void>;
  updateLogs?(pkgName: string): stream.Readable | Promise<stream.Readable>;
  search?(searchTerm: string): Promise<stream.Readable | PackageObject[]>;
  info(pkgName: string): Promise<PackageObject>;
}
export interface ActivePlugin {
  displayName: string;
  name: string;
  version: string;
  module: PluginModule;
}
export interface PluginInfoObject {
  displayName?: string;
  description?: string;
  name: string;
  version: string;
  active: boolean;
  uninstallable: boolean;
  installType: InstallType;
  upToDate: boolean;
}