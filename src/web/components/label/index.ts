'use strict';

import BaseComponent, { BaseOptions } from '../base';

const componentReady = Symbol.for('component.ready');

interface LabelOptions extends BaseOptions {
  text?: string;
}

class LabelComponent extends BaseComponent {
  elm: HTMLElement;
  constructor(opts?: LabelOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('span');

    // Element Classes
    this.elm.className = 'component fadable label';

    // Element Event Listeners
    this.elm.addEventListener('click', () => {
      this.emit('click');
    });

    if (opts && opts.text) {
      this.elm.innerHTML = opts.text;
    }

    this.shown = true;

    this[componentReady]();
  }
  get text(): string {
    return this.elm.innerHTML;
  }
  set text(val: string) {
    this.elm.innerHTML = val;
  }
  get fadable(): boolean {
    return true;
  }
}

export default LabelComponent;
