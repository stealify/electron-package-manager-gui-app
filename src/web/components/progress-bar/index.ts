'use strict';

import BaseComponent, { BaseOptions } from '../base';

const componentReady = Symbol.for('component.ready');

interface ProgressBarOptions extends BaseOptions {};

class ProgressBarComponent extends BaseComponent {
  elm: HTMLElement;
  innerProgress: HTMLElement;
  constructor(opts?: ProgressBarOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('div');
    this.innerProgress = document.createElement('div');

    // Element Classes
    this.elm.className = 'component progress-bar';
    this.innerProgress.className = 'component progress-bar--innerProgress';

    // Element Appending
    this.elm.appendChild(this.innerProgress);

    this.progress = 0;

    this[componentReady]();
  }
  get progress(): number {
    return parseFloat((<object>this.elm.dataset).progress);
  }
  set progress(val: number) {
    (<object>this.elm.dataset).progress = val;
    this.innerProgress.style.width = `${val}%`;
  }
  get error(): boolean {
    return this.elm.classList.contains('error');
  }
  set error(val: boolean) {
    val = !!val;
    if (val) {
      this.elm.classList.add('error');
    } else {
      this.elm.classList.remove('error');
    }
  }
}

export default ProgressBarComponent;
