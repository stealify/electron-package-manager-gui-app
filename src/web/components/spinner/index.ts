'use strict';

import BaseComponent, { BaseOptions } from '../base';

const componentReady = Symbol.for('component.ready');

interface SpinnerOptions extends BaseOptions {};

class SpinnerComponent extends BaseComponent {
  elm: HTMLElement;
  constructor(opts?: SpinnerOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('div');

    // Element Classes
    this.elm.className = 'component fadable spinner';

    this.shown = true;

    this[componentReady]();
  }
  get spinning(): boolean {
    return this.elm.classList.contains('spinning');
  }
  set spinning(val: boolean) {
    val = !!val;
    if (val) {
      this.elm.classList.add('spinning');
    } else {
      this.elm.classList.remove('spinning');
    }
  }
  get fadable(): boolean {
    return true;
  }
}

export default SpinnerComponent;
