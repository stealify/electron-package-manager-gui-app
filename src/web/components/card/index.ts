'use strict';

import BaseComponent, { BaseOptions } from '../base';

const componentReady = Symbol.for('component.ready');

interface CardOptions extends BaseOptions {
  title: string;
  body: string;
  footer?: string;
}

class CardComponent extends BaseComponent {
  elm: HTMLElement;
  header: HTMLElement;
  heading: HTMLElement;
  bodyElm: HTMLElement;
  footerElm: HTMLElement;
  constructor(opts?: CardOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('div');
    this.header = document.createElement('div');
    this.heading = document.createElement('span');
    this.bodyElm = document.createElement('div');
    this.footerElm = document.createElement('div');

    // Element Classes
    this.elm.className = 'component fadable card';
    this.header.className = 'component card--header';
    this.heading.className = 'component card--heading';
    this.bodyElm.className = 'component card--body primary-bg';
    this.footerElm.className = 'component card--footer';

    // Element Properties
    this.heading.innerText = opts.title;
    this.bodyElm.innerHTML = opts.body;
    if (opts && opts.footer) this.footerElm.innerHTML = opts.footer;

    // Element Appending
    this.header.appendChild(this.heading);
    this.elm.appendChild(this.header);
    this.elm.appendChild(this.bodyElm);
    if (opts && opts.footer) this.elm.appendChild(this.footerElm);

    this.shown = true;

    this[componentReady]();
  }
  childCont(): HTMLElement {
    return this.bodyElm;
  }
  get body(): string {
    return this.bodyElm.innerHTML;
  }
  set body(html: string) {
    this.bodyElm.innerHTML = html;
  }
  get title(): string {
    return this.heading.innerText;
  }
  set title(text: string) {
    this.heading.innerText = text;
  }
  get footer(): string {
    return this.footerElm.innerHTML;
  }
  set footer(html: string) {
    this.footerElm.innerHTML = html;
  }
  get fadable(): boolean {
    return true;
  }
}

export default CardComponent;
