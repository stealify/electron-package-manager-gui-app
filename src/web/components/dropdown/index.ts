'use strict';

type DropdownOnSelectFunction = () => any;

import BaseComponent, { BaseOptions } from '../base';
import { asyncFor, asyncWhile } from 'then-utils';

const componentReady = Symbol.for('component.ready');

interface DropdownOptions extends BaseOptions {};
interface DropdownOptionObject {
  name?: string;
  onselect?: DropdownOnSelectFunction;
  data?: object;
}

class DropdownComponent extends BaseComponent {
  elm: HTMLElement;
  select: HTMLSelectElement;
  constructor(opts?: DropdownOptions) {
    super(opts);

    // Element Creation
    this.elm = document.createElement('div');
    this.select = document.createElement('select');

    // Element Classes
    this.elm.className = 'component fadable dropdown';

    // Element Event Listeners
    this.select.addEventListener('change', () => {
      this.emit('select', this.select.options[this.select.selectedIndex], this.select.selectedIndex);
    });

    // Element Appending
    this.elm.appendChild(this.select);

    this.shown = true;

    this[componentReady]();
  }
  get options(): HTMLOptionElement[] {
    return Array.prototype.slice.call(this.select.options);
  }
  get selected(): number {
    return this.select.selectedIndex;
  }
  set selected(index: number) {
    this.select.options[index].selected = true;
  }
  get disabled(): boolean {
    return this.select.disabled;
  }
  set disabled(val: boolean) {
    val = !!val;
    if (val) {
      this.select.disabled = true;
      this.elm.classList.add('disabled');
    } else {
      this.select.disabled = false;
      this.elm.classList.remove('disabled');
    }
  }
  addOption({
    name = 'Item',
    onselect = null,
    data = {}
  }: DropdownOptionObject = {}): Promise<number> {
    const option = document.createElement('option');

    option.innerHTML = name;
    if (onselect) this.on('select', (opt) => (opt === option) && onselect());

    return asyncFor(data, (key, val) => {
      option.dataset[key] = val;
      return Promise.resolve();
    }).then(() => {
      this.select.appendChild(option);
    }).then(() => Array.prototype.slice.call(this.select.options).indexOf(option));
  }
  removeOption(index: number): Promise<void> {
    this.select.options[index].parentNode.removeChild(this.select.options[index]);
    return Promise.resolve();
  }
  setOptions(arr: DropdownOptionObject[]): Promise<void> {
    return asyncWhile(() => !!this.options[0], () => {
      return this.removeOption(0);
    }).then(() => {
      return asyncFor(arr, (i: number, item: DropdownOptionObject) => {
        return this.addOption({
          name: item.name,
          onselect: item.onselect
        });
      });
    });
  }
  click(): void {
    this.elm.click();
  }
  get fadable(): boolean {
    return true;
  }
}

export default DropdownComponent;
