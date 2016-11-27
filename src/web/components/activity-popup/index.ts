'use strict';

import BaseComponent, { BaseOptions } from '../base';
import PopupComponent from '../popup';
import SpinnerComponent from '../spinner';
import ProgressBarComponent from '../progress-bar';
import ButtonComponent from '../button';

const componentReady = Symbol.for('component.ready');

interface ActivityPopupOptions extends BaseOptions {
  title?: string;
  status?: string;
  spinning?: boolean;
  progress?: number;
  error?: boolean;
}

class ActivityPopupComponent extends BaseComponent {
  elm: PopupComponent;
  spinnerElm: SpinnerComponent;
  progressElm: ProgressBarComponent;
  close: ButtonComponent;
  outerCont: HTMLElement;
  cont: HTMLElement;
  bottomCont: HTMLElement;
  header: HTMLElement;
  statusElm: HTMLElement;
  progressCont: HTMLElement;
  constructor(opts?: ActivityPopupOptions) {
    super(opts);

    this.elm = new PopupComponent({
      classes: ['activity-popup']
    });
    this.spinnerElm = new SpinnerComponent();
    this.progressElm = new ProgressBarComponent();
    this.close = new ButtonComponent({
      text: 'Close'
    });

    this.outerCont = document.createElement('div');
    this.cont = document.createElement('div');
    this.bottomCont = document.createElement('div');
    this.header = document.createElement('span');
    this.statusElm = document.createElement('span');
    this.progressCont = document.createElement('div');

    // Element Properties
    this.outerCont.className = 'component activity-popup--outerCont';
    this.cont.className = 'component activity-popup--cont';
    this.bottomCont.className = 'component activity-popup--bottomCont';
    this.progressCont.className = 'component activity-popup--progressCont';
    //
    this.header.className = 'component activity-popup--header';
    //
    this.header.innerHTML = (opts) ? opts.title : 'Activity';
    this.statusElm.innerHTML = (opts) ? opts.status : 'Doin\' stuff...';

    // Component Properties
    this.progressElm.progress = 50;
    this.spinnerElm.spinning = true;
    this.close.shown = false;

    // Component Listeners
    this.close.on('click', () => {
      this.shown = false;
      setTimeout(() => {
        this.emit('close');
      }, 600);
    });

    // Element Appending
    this.cont.appendChild(this.header);
    this.cont.appendChild(this.statusElm);
    this.cont.appendChild(this.progressCont);
    this.outerCont.appendChild(this.cont);
    this.outerCont.appendChild(this.bottomCont);
    this.elm.elm.appendChild(this.outerCont);

    // Component Appending
    this.progressElm.appendTo(this.progressCont);
    this.spinnerElm.appendTo(this.progressCont);
    this.close.appendTo(this.bottomCont);

    if (opts) {
      if (opts.title) this.title = opts.title;
      if (opts.status) this.status = opts.status;
      if (opts.spinning || opts.spinning === false) this.spinning = opts.spinning;
      if (opts.progress) this.progress = opts.progress;
      if (opts.error || opts.error === false) this.error = opts.error;
    }

    this[componentReady]();
  }
  get shown(): boolean {
    return this.elm.shown;
  }
  set shown(val: boolean) {
    this.elm.shown = val;
  }
  get progress(): number {
    return this.progressElm.progress;
  }
  set progress(val: number) {
    this.progressElm.progress = val;
  }
  get spinning(): boolean {
    return this.spinnerElm.shown && this.spinnerElm.spinning;
  }
  set spinning(val: boolean) {
    val = !!val;
    if (val) {
      this.spinnerElm.shown = true;
      this.spinnerElm.spinning = true;
    } else {
      this.spinnerElm.shown = false;
      this.spinnerElm.spinning = false;
    }
  }
  get status(): string {
    return this.statusElm.innerHTML;
  }
  set status(val: string) {
    this.statusElm.innerHTML = val;
  }
  get title(): string {
    return this.header.innerText;
  }
  set title(val: string) {
    this.header.innerText = val;
  }
  get error(): boolean {
    return this.progressElm.error;
  }
  set error(val: boolean) {
    this.progressElm.error = val;
  }
}

export default ActivityPopupComponent;
