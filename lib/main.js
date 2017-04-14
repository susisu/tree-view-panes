'use babel';

import { Disposable } from 'atom';

import Controller from './controller.js';
import FileIcons from './file-icons.js';

export default {
  config: {
    showPendingItems: {
      order      : 1,
      type       : 'boolean',
      default    : true,
      description: 'Show pending items on the tree view.'
    },
    showGitStatus: {
      order      : 2,
      type       : 'boolean',
      default    : true,
      description: 'Show Git statuses of files.'
    }
  },

  controller: null,

  activate(state) {
    this.controller = new Controller(state || {});
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
