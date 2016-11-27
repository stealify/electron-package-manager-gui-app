'use strict';

import BaseComponent, { BaseOptions } from '../base';
import { asyncFor, asyncWhile, sleep } from 'then-utils';

const componentReady = Symbol.for('component.ready');

export enum ToastType {
  Default,
  Success,
  Error
}

export interface ToastAction {
  label?: string;
  onclick?: () => void;
}

export interface ToastOptions extends BaseOptions {
  title?: string;
  text?: string;
  actions?: ToastAction[];
  timeout?: number | boolean;
  type?: ToastType;
}

class ToastComponent extends BaseComponent {
  elm: HTMLElement;
  headerElm: HTMLElement;
  bodyElm: HTMLElement;
  actionElm: HTMLElement;
  actions: HTMLElement[];
  right: number;
  bottom: number;
  timeout: number | boolean;
  type: ToastType;
  constructor(opts?: ToastOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('div');
    this.headerElm = document.createElement('div');
    this.bodyElm = document.createElement('div');
    this.actionElm = document.createElement('div');

    // Element Classes
    this.elm.className = 'component toast';
    this.headerElm.className = 'component toast--header';
    this.bodyElm.className = 'component toast--body';
    this.actionElm.className = 'component toast--action-container';

    this.actions = [];

    // Element Event Listeners
    this.elm.addEventListener('click', () => {
      this.emit('click');
    });

    this.title = 'Toast';
    this.text = 'Text';
    this.timeout = 2000;
    this.type = ToastType.Default;

    let prom = Promise.resolve();

    if (!opts || !opts.actions) {
      prom = this.addAction({
        label: 'Ok',
        onclick: () => this.hide()
      });
    } 

    prom.then(() => {
      this.elm.appendChild(this.headerElm);
      this.elm.appendChild(this.bodyElm);
      this.elm.appendChild(this.actionElm);

      if (opts) {
        if (opts.title) this.title = opts.title;
        if (opts.text) this.text = opts.text;
        if (opts.actions) this.setActions(opts.actions);
        if (opts.timeout) this.timeout = opts.timeout;
        if (opts.type) this.type = opts.type;
      }

      switch (this.type) {
        case ToastType.Error:
          this.elm.classList.add('error');
          break;
        case ToastType.Success:
          this.elm.classList.add('success');
          break;
        default:
          break;
      }

      this[componentReady]();
    });
  }
  get title(): string {
    return this.headerElm.innerText;
  }
  set title(val: string) {
    this.headerElm.innerText = val;
  }
  get text(): string {
    return this.bodyElm.innerHTML;
  }
  set text(val: string) {
    this.bodyElm.innerHTML = val;
  }
  show(): Promise<void> {
    this.elm.classList.add('shown');
    return sleep(parseFloat(window.getComputedStyle(this.elm).transitionDuration) * 1000).then(() => this.emit('shown'));
  }
  hide(): Promise<void> {
    this.elm.classList.remove('shown');
    return sleep(parseFloat(window.getComputedStyle(this.elm).transitionDuration) * 1000).then(() => this.emit('hidden'));
  }
  offset(right: number, bottom: number): Promise<void> {
    this.elm.style.right = `${right}px`;
    this.elm.style.bottom  = `${bottom}px`;
    this.right = right;
    this.bottom = bottom;
    return sleep(parseFloat(window.getComputedStyle(this.elm).transitionDuration) * 1000).then(() => this.emit('rerender'));
  }
  addAction({
    label = 'Action',
    onclick = null
  }: ToastAction = {}): Promise<number> {
    const action = document.createElement('span');

    action.className = 'component toast--action';

    this.actions.push(action);

    action.innerHTML = label;
    if (onclick) this.on('action', (act) => (act === action) && onclick());
    
    action.addEventListener('click', () => {
      this.emit('action', action, this.actions.indexOf(action));
    });

    this.actionElm.appendChild(action);
    return Promise.resolve(this.actions.indexOf(action));
  }
  removeAction(index: number): Promise<void> {
    this.actions[index].parentNode.removeChild(this.actions[index]);
    this.actions.splice(index, 1);
    return Promise.resolve();
  }
  setActions(actions: ToastAction[]): Promise<void> {
    return asyncWhile(() => !!this.actions[0], () => {
      return this.removeAction(0);
    }).then(() => {
      return asyncFor(actions, (i, action) => this.addAction(action));
    });
  }
}

export default ToastComponent;
(<object>window).ToastComponent = ToastComponent; // Debugging