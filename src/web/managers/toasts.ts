import ToastComponent, { ToastOptions } from '../components/toast';
import { asyncFor } from 'then-utils';

class ToastManager {
  toasts: ToastComponent[];
  queue: ToastComponent[];
  maxAtOnce = 3;
  //inRender = false;
  //renderQueue: Array<() => void> = [];
  constructor() {
    this.toasts = [];
    this.queue = [];
  }
  add(toast: ToastComponent, milliseconds: number | boolean = toast.timeout): Promise<void> {
    toast.timeout = milliseconds;
    if (this.toasts.length === this.maxAtOnce) {
      if (this.queue.indexOf(toast) !== -1) return Promise.resolve();
      this.queue.push(toast);
      return Promise.resolve();
    }
    if (this.queue.indexOf(toast) !== -1) this.queue.splice(this.queue.indexOf(toast), 1);

    let t = null;
    /*const rerenderFunc = () => {
      if (this.inRender) return new Promise((resolve, reject) => this.renderQueue.push(() => rerenderFunc().then(resolve)));
      if (this.toasts.indexOf(toast) === -1) return;
      const i = this.toasts.indexOf(toast);
      if (!this.toasts[i + 1]) return;
      this.inRender = true;
      const toast2 = this.toasts[i + 1];
      return toast2.offset(10, (() => {
        const style = window.getComputedStyle(toast.elm);
        const parsed = parseFloat(style.bottom);
        const height = parseFloat(style.height);
        return toast2.bottom - (parsed + height + 10);
      })()).then(() => {
        this.inRender = false;
        if (this.renderQueue[0]) this.renderQueue[0]();
      });
    };
    toast.on('rerender', rerenderFunc);*/
    toast.once('hidden', () => {
      //toast.removeListener('rerender', rerenderFunc);
      if (t) clearTimeout(t);
      Promise.resolve(/*rerenderFunc()*/).then(() => this.toasts.splice(this.toasts.indexOf(toast), 1)).then(() => toast.disown()).then(() => {
        if (this.toasts.length === 0 && this.queue[0]) {
          return asyncFor(this.maxAtOnce, (i) => {
            const item = this.queue[0];
            if (!item) return Promise.resolve();
            return this.add(item);
          });
        }
      });
    });

    return toast.offset(10, (() => {
      if (this.toasts.length === 0) return 10;
      const t = this.toasts[this.toasts.length - 1];
      const style = window.getComputedStyle(t.elm);
      const parsed = parseFloat(style.bottom);
      const height = parseFloat(style.height);
      //if (t.elm.classList.contains('shown')) return parsed + height;
      return parsed + height + 10;
    })()).then(() => Promise.resolve(toast.appendTo(document.body))).then(() => {
      const style = window.getComputedStyle(toast.elm);
      return asyncFor(style.transitionProperty.split(','), (i, prop) => {
        style.getPropertyValue(prop.trim()); // force render
        return Promise.resolve();
      });
    }).then(() => this.toasts.push(toast)).then(() => toast.show()).then(() => {
      if (milliseconds !== false) t = setTimeout(() => toast.hide(), milliseconds);
    });
  }
  onetime(opts: ToastOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = new ToastComponent(opts);
      t.once('ready', () => {
        this.add(t).then(() => resolve()).catch(reject);
      });
    });
  }
}

const def = new ToastManager();
export default def; // ToastManager is a singleton
(<object>window).toastManager = def; // Debugging