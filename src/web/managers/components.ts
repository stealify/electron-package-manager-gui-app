'use strict';

import BaseComponent from '../components/base';

class ComponentManager {
  repo: WeakMap<HTMLElement | BaseComponent, BaseComponent>;
  constructor() {
    this.repo = new WeakMap();
  }
  register(component: BaseComponent): Promise<void> {
    this.repo.set(component.elm, component);
    return Promise.resolve();
  }
  getByElement(elm: HTMLElement): Promise<BaseComponent> {
    return Promise.resolve(this.repo.get(elm));
  }
}

const def = new ComponentManager();
export default def; // ComponentManager is a singleton
(<object>window).componentManager = def; // Debugging
