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
    this.element.appendChild(this.controller.view.element);

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
