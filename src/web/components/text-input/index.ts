'use strict';

import BaseComponent, { BaseOptions } from '../base';

const componentReady = Symbol.for('component.ready');

interface TextInputOptions extends BaseOptions {
  placeholder?: string;
};

class TextInputComponent extends BaseComponent {
  elm: HTMLInputElement;
  constructor(opts?: TextInputOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('input');

    // Element Classes
    this.elm.className = 'component fadable text-input';

    // Element Properties
    this.elm.type = 'text';
    //
    if (opts && opts.placeholder) this.elm.placeholder = opts.placeholder;

    // Element Listeners
    this.elm.addEventListener('change', () => this.emit('change'));
    this.elm.addEventListener('input', () => this.emit('input'));
    this.elm.addEventListener('keyup', (e) => {
      if (e.keyCode === 13) {
        // Enter
        this.emit('submit');
      }
    });
    this.elm.addEventListener('focus', () => this.emit('focus'));
    this.elm.addEventListener('blur', () => this.emit('blur'));

    this.shown = true;

    this[componentReady]();
  }
  focus(): void {
    this.elm.focus();
  }
  blur(): void {
    this.elm.blur();
  }
  submit(): void {
    this.emit('submit');
  }
  get value(): string {
    return this.elm.value;
  }
  set value(val: string) {
    this.elm.value = val;
  }
  get fadable(): boolean {
    return true;
  }
}

export default TextInputComponent;
