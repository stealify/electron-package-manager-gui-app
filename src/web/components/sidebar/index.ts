'use strict';

type SidebarOnClickFunction = () => any;

import BaseComponent, { BaseOptions } from '../base';
import { asyncFor } from 'then-utils';

const componentReady = Symbol.for('component.ready');

interface SidebarOptions extends BaseOptions {};
interface SidebarItemObject {
  name?: string;
  onclick?: SidebarOnClickFunction;
  index?: number;
}

class SidebarComponent extends BaseComponent {
  elm: HTMLElement;
  links: HTMLAnchorElement[];
  constructor(opts: SidebarOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('nav');

    // Element Classes
    this.elm.className = 'component sidebar';

    // Class Properties
    this.links = [];

    this[componentReady]();
  }
  addItem({ name = 'Item', onclick = null, index = null }: SidebarItemObject = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Element Creation
      const a = document.createElement('a');

      // Element Properties
      a.href = '#';
      //
      a.onclick = () => {
        this.emit('linkClick', a);
      };

      // Element HTML
      a.innerHTML = name;

      if (!index && index !== 0) {
        this.links.push(a);
        this.elm.appendChild(a);
      } else {
        this.links.splice(index, 0, a);
        this.elm.insertBefore(a, this.links[index]);
      }

      if (onclick) {
        this.on('linkClick', (target) => {
          if (target === a) onclick();
        });
      }

      resolve();
    });
  }
  removeItem({ index = null, name = '' }: SidebarItemObject = {}) {
    return new Promise((resolve, reject) => {
      if (index) {
        if (!this.links[index]) return reject(new Error('The desired item wasn\'t found'));
        const a = this.links.splice(index, 1)[0];
        a.parentNode.removeChild(a);
        resolve();
      } else if (name) {
        asyncFor(this.links, (i: number, link: HTMLAnchorElement) => {
          if (link.innerHTML === name) {
            this.links.splice(i, 1);
            link.parentNode.removeChild(link);
            return Promise.reject(undefined); // TODO: then-utils - make resolving 'true' break the loop
          }
          return Promise.resolve();
        }).then(() => {
          // if it resolves all the way through, the item wasn't found
          reject(new Error('The desired item wasn\'t found'));
        }, () => {
          // if it rejects, then the item was found
          resolve();
        });
      } else {
        reject(new Error('No method for finding the desired item was provided'));
      }
    });
  }
  addItems(items: SidebarItemObject[]): Promise<void> {
    return asyncFor(items, (i, item) => {
      return this.addItem(item);
    });
  }
  setActiveItem(index: number): Promise<void> {
    return asyncFor(this.links, (i: number, link: HTMLAnchorElement) => {
      if (link.classList.contains('active')) link.classList.remove('active');
      return Promise.resolve();
    }).then(() => {
      this.links[index].classList.add('active');
    });
  }
}

export default SidebarComponent;
