import { PackageObject } from '../../lib/plugins/pluginDefs';

class ListCacheManager {
  cache: PackageObject[];
  constructor() {
    this.cache = null;
  }
}

export default new ListCacheManager();