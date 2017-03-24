'use babel';

import { Disposable } from 'atom';

import TreeViewPanesController from './tree-view-panes-controller.js';
import FileIcons from './file-icons.js';

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

  consumeFileIcons(service) {
    FileIcons.setService(service);
    this.controller.updateItemIcons();
    return new Disposable(() => {
      FileIcons.resetService();
      this.controller.updateItemIcons();
    });
  },

  serialize() {
    return this.controller.serialize();
  }
};
