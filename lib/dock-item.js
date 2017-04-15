'use babel';

import { Emitter } from 'atom';

import Controller from './controller.js';

export default class DockItem {
  constructor(state) {
    this.controller = new Controller(state || {});

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'tree-view-panes');
    this.element.tabIndex = -1;
    this.element.appendChild(this.controller.view.element);

    this.emitter = new Emitter();
  }

  getTitle() {
    return 'Workspace';
  }

  getURI() {
    return 'atom://tree-view-panes/dock-item';
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
