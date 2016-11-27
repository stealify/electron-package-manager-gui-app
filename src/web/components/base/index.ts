'use strict';

import { EventEmitter } from 'events';
import componentManager from '../../managers/components';

const componentReady = Symbol.for('component.ready');

interface BaseOptions {
  id?: string;
  classes?: string[];
  children?: Array<BaseComponent | HTMLElement>
}

class BaseComponent extends EventEmitter {
  elm: HTMLElement | BaseComponent;
  constrOpts: BaseOptions;
  constructor(opts?: BaseOptions) {
    super();

    this.constrOpts = opts;

    // Element Creation
    this.elm = document.createElement('div');

    // Element Classes
    this.elm.className = 'component';

    this[componentReady]();
  }
  [componentReady](): void {
    if (this.constrOpts) {
      if (this.constrOpts.id) {
        (<HTMLElement>this.elm).id = this.constrOpts.id;
      }
      if (this.constrOpts.classes) {
        for (const className of this.constrOpts.classes) (<HTMLElement>this.elm).classList.add(className);
      }
      if (this.constrOpts.children) {
        for (const child of this.constrOpts.children) {
          if (child instanceof BaseComponent) {
            child.appendTo(this.childCont());
          } else {
            this.childCont().appendChild(child);
          }
        }
      }
    }
    componentManager.register(this);
    setImmediate(() => {
      this.emit('ready');
    });
  }
  childCont(): HTMLElement {
    return (<HTMLElement>this.elm);
  }
  rootElms(): Array<HTMLElement | BaseComponent> {
    return [this.elm];
  }
  appendTo(elm: HTMLElement): void {
    for (const elem of this.rootElms()) {
      if (elem instanceof BaseComponent) {
        elem.appendTo(elm);
      } else {
        elm.appendChild(elem);
      }
    }
  }
  prependTo(elm: HTMLElement): void {
    for (const elem of this.rootElms()) {
      if (elem instanceof BaseComponent) {
        elem.prependTo(elm);
      } else {
        elm.insertBefore(elem, elm.firstChild);
      }
    }
  }
  insertBeforeOn(elm: HTMLElement, sibling: HTMLElement): void {
    for (const elem of this.rootElms()) {
      if (elem instanceof BaseComponent) {
        elem.insertBeforeOn(elm, sibling);
      } else {
        elm.insertBefore(elem, sibling);
      }
    }
  }
  disown(): void {
    for (const elem of this.rootElms()) {
      if (elem instanceof BaseComponent) {
        elem.disown();
      } else {
        elem.parentNode.removeChild(elem);
      }
    }
  }
  get shown(): boolean {
    return (<HTMLElement>this.elm).classList.contains('shown');
  }
  set shown(val: boolean) {
    val = !!val;
    if (val) {
      (<HTMLElement>this.elm).classList.add('shown');
    } else {
      (<HTMLElement>this.elm).classList.remove('shown');
    }
  }
  get fadable(): boolean {
    return false;
  }
}

export default BaseComponent;
export { BaseOptions };