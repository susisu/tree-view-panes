'use babel';

import { Emitter } from 'atom';

import Controller from './controller.js';
import Constants from './constants.js';

export default class DockItem {
  constructor(state) {
    this.controller = new Controller(state || {});

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'tree-view-panes-dock-item');
    this.element.tabIndex = -1;
    this.element.appendChild(this.controller.view.element);

    this.emitter = new Emitter();
  }

  getTitle() {
    return Constants.DOCK_ITEM_TITLE;
  }

  getURI() {
    return Constants.DOCK_ITEM_URI;
  }

  getDefaultLocation() {
    return 'left';
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  destroy() {
    this.controller.destroy();
    this.element.remove();
    this.emitter.emit('did-destroy');
  }

  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback);
  }

  serialize() {
    return Object.assign(
      { deserializer: 'tree-view-panes/DockItem' },
      this.controller.serialize()
    );
  }
}
