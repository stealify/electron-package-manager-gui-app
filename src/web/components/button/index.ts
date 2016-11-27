'use strict';

import BaseComponent, { BaseOptions } from '../base';

const componentReady = Symbol.for('component.ready');

interface ButtonOptions extends BaseOptions {
  text?: string;
}

class ButtonComponent extends BaseComponent {
  elm: HTMLElement;
  constructor(opts?: ButtonOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('button');

    // Element Classes
    this.elm.className = 'component fadable button';

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
  click(): void {
    this.elm.click();
  }
  get fadable(): boolean {
    return true;
  }
}

export default ButtonComponent;
