'use babel';

import { Emitter } from 'atom';

import Controller from './controller.js';
import { DOCK_ITEM_URI, DOCK_ITEM_DESERIALIZER } from './constants.js';

export default class DockItem {
  constructor(state) {
    this.controller = new Controller((state && state.controller) || {});

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'tree-view-panes-dock-item');
    this.element.tabIndex = -1;

    this.wrapperElement = document.createElement('div');
    this.wrapperElement.classList.add('tree-view-wrapper');
    this.wrapperElement.appendChild(this.controller.view.element);

    this.element.appendChild(this.wrapperElement);

    this.cachedWidth = 0;

    this.emitter = new Emitter();
  }

  getTitle() {
    return 'Workspace';
  }

  getURI() {
    return DOCK_ITEM_URI;
  }

  getDefaultLocation() {
    return 'left';
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  getPreferredWidth() {
    this.wrapperElement.classList.add('width-calculation');
    const width = this.wrapperElement.offsetWidth;
    this.wrapperElement.classList.remove('width-calculation');
    // cache width for the case when the element has been removed from the DOM tree
    if (width > 0) {
      this.cachedWidth = width;
    }
    return this.cachedWidth;
  }

  updateItemIcons() {
    this.controller.updateItemIcons();
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
    return {
      deserializer: DOCK_ITEM_DESERIALIZER,
      controller  : this.controller.serialize()
    };
  }
}
