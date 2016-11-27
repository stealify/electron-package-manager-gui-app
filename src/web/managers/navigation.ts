'use strict';

import { asyncFor, callWithPromiseOrCallback } from 'then-utils';
import { readFile } from 'fs';

class NavigationManager {
  elm: HTMLElement;
  handlerKey: string;
  loadKey: string;
  constructor(elm: HTMLElement, handlerPrefix: string) {
    this.elm = elm;
    this.handlerKey = `onbefore${handlerPrefix}viewunload`;
    this.loadKey = `on${handlerPrefix}viewload`;
  }
  navigateTo(url: string, extraData?: any): Promise<void> {
    if (window[this.handlerKey]) window[this.handlerKey]();
    window[this.handlerKey] = null;
    return callWithPromiseOrCallback(readFile, url, 'utf8').then((txt: string) => {
      return new Promise((resolve, reject) => {
        const func2 = () => {
          (<object>this.elm.dataset).url = url;
          resolve();
        };
        const func1 = () => {
          this.elm.innerHTML = txt;
          const listener2 = () => {
            this.elm.removeEventListener('transitionend', listener2);
            func2();
          };
          if (!this.elm.classList.contains('shown')) {
            this.elm.addEventListener('transitionend', listener2);
            this.elm.classList.add('shown');
          } else {
            func2();
          }
        };
        if (this.elm.classList.contains('shown')) {
          const listener1 = () => {
            this.elm.removeEventListener('transitionend', listener1);
            func1();
          };
          this.elm.addEventListener('transitionend', listener1);
          this.elm.classList.remove('shown');
        } else {
          func1();
        }
      });
    }).then(() => {
      return asyncFor(Array.prototype.slice.call(this.elm.getElementsByTagName('script')), (i, script) => {
        const newScript = document.createElement('script');

        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.innerText = script.innerText;
        }

        script.parentNode.replaceChild(newScript, script);

        return Promise.resolve();
      });
    }).then(() => {
      if (window[this.loadKey]) window[this.loadKey](extraData);
      window[this.loadKey] = null;
    });
  }
  softNavigateTo(url: string, extraData?: any) {
    if ((<object>this.elm.dataset).url === url) return Promise.resolve();
    return this.navigateTo(url, extraData);
  }
}

export default NavigationManager;
