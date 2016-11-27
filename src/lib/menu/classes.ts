'use strict';

type MenuItemClickListener = () => any;

const exists = obj => (typeof obj !== 'undefined' && obj !== undefined && obj !== null);

class Separator {
  type: 'separator';
}

class MenuItem {
  label: string;
  submenu?: object[];
  accelerator?: string;
  click?: MenuItemClickListener;
  role?: string;
  constructor(label: string, accelerator?: string, roleOrClick?: (string | MenuItemClickListener), submenu?: boolean) {
    this.label = label;
    if (exists(submenu) && submenu === true) this.submenu = [];
    if (exists(accelerator)) this.accelerator = accelerator;
    if (exists(roleOrClick)) {
      if (typeof roleOrClick === 'function') this.click = roleOrClick;
      if (typeof roleOrClick === 'string') this.role = roleOrClick;
    }
  }
}

export { Separator, MenuItem };
