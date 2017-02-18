'use babel';

import TreeViewPanesController from './tree-view-panes-controller.js';

export default {
  config: {
    showPendingItems: {
      type       : 'boolean',
      default    : true,
      description: 'Show pending items on the tree view'
    }
  },

  controller: null,

  activate(state) {
    this.controller = new TreeViewPanesController(state || {});
  },

  deactivate() {
    this.controller.destroy();
  },

  serialize() {
    return this.controller.serialize();
  }
};
