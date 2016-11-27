'use strict';

import BaseComponent, { BaseOptions } from '../base';
const componentReady = Symbol.for('component.ready');

interface PopupOptions extends BaseOptions {
  hideOnClick?: boolean;
}

class PopupComponent extends BaseComponent {
  elm: HTMLElement;
  overlay: HTMLElement;
  constructor(opts?: PopupOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('div');
    this.overlay = document.createElement('div');

    // Element Classes
    this.elm.className = 'component popup primary-bg';
    this.overlay.className = 'component popup--overlay';

    if (opts && opts.hideOnClick) {
      this.overlay.addEventListener('click', () => {
        this.shown = false;
      });
    }

    this[componentReady]();
  }
  rootElms(): HTMLElement[] {
    return [this.elm, this.overlay];
  }
  get shown(): boolean {
    return this.elm.classList.contains('shown') && this.overlay.classList.contains('shown');
  }
  set shown(val: boolean) {
    val = !!val;
    const titlebar = document.getElementById('titlebar');
    if (val) {
      titlebar.classList.add('shadow');
      this.elm.classList.add('shown');
      this.overlay.classList.add('shown');
    } else {
      titlebar.classList.remove('shadow');
      this.elm.classList.remove('shown');
      this.overlay.classList.remove('shown');
    }
  }
}

export default PopupComponent;
