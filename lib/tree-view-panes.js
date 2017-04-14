'use babel';

import Controller from './controller.js';

export default class TreeViewPanes {
  constructor(state) {
    this.controller = new Controller(state || {});

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'tree-view-panes');
    this.element.tabIndex = -1;
    this.element.appendChild(this.controller.view.element);
  }

  getTitle() {
    return 'Workspace';
  }

  getURI() {
    return 'atom://tree-view-panes';
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
  }

  serialize() {
    return Object.assign(
      { deserializer: 'tree-view-panes/TreeViewPanes' },
      this.controller.serialize()
    );
  }
}
