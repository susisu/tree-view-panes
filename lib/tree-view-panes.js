'use babel';

import { Disposable, CompositeDisposable } from 'atom';

import DockItem from './dock-item.js';
import FileIcons from './file-icons.js';
import Constants from './constants.js';

class TreeViewPanes {
  constructor() {
    this.dockItem = null;

    this.sub = new CompositeDisposable();

    this.dockItemSub = null;
  }

  activate() {
    this.sub.add(atom.workspace.addOpener(uri => {
      if (uri === Constants.DOCK_ITEM_URI) {
        return this.getDockItem();
      }
      else {
        return undefined;
      }
    }));
    this.sub.add(atom.commands.add('atom-workspace', {
      'tree-view-panes:toggle-dock-item': () => { this.toggleDockItem(); }
    }));
  }

  deactivate() {
    this.sub.dispose();

    if (this.dockItem) {
      this.dockItem.destroy();
    }
  }

  serialize() {
  }

  consumeFileIcons(service) {
    FileIcons.setService(service);
    if (this.dockItem) {
      this.dockItem.controller.updateItemIcons();
    }
    return new Disposable(() => {
      FileIcons.resetService();
      if (this.dockItem) {
        this.dockItem.controller.updateItemIcons();
      }
    });
  }

  getDockItem(state) {
    if (!this.dockItem) {
      this.dockItem = new DockItem(state);
      this.dockItemSub = this.dockItem.onDidDestroy(() => {
        this.dockItemSub.dispose();
        this.dockItemSub = null;
        this.dockItem = null;
      });
    }
    return this.dockItem;
  }

  toggleDockItem() {
    atom.workspace.toggle(Constants.DOCK_ITEM_URI);
  }
}

export default new TreeViewPanes();
