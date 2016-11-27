export interface PackageObject {
  name: string;
  version: string | number;
  displayName?: string;
  description?: string;
  installed?: boolean;
  upToDate?: boolean;
  categories?: string[];
}

export enum ListType {
  Detailed,
  Simple
}
