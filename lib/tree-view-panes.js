'use babel';

import { CompositeDisposable } from 'atom';
import TreeViewPanesView from './tree-view-panes-view.js';

export default {
  config: {
    showPendingItems: {
      type       : 'boolean',
      default    : true,
      description: 'Show pending items on the tree view'
    }
  },

  treeViewPanesView: null,

  activate(state) {
    this.treeViewPanesView = new TreeViewPanesView(
      state.treeViewPanesView || {}
    );
    this.sub = new CompositeDisposable();
  },

  deactivate() {
    this.sub.dispose();
    this.treeViewPanesView.destroy();
  },

  serialize() {
    return {
      treeViewPanesView: this.treeViewPanesView.serialize()
    };
  }
};
