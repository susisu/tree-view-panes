'use babel';

import { Disposable, CompositeDisposable } from 'atom';

import Injector from './injector.js';
import DockItem from './dock-item.js';
import FileIcons from './file-icons.js';
import Constants from './constants.js';

class TreeViewPanes {
  constructor() {
    this.injector = null;
    this.dockItem = null;

    this.subscriptions = new CompositeDisposable();
    this.dockItemSub = null;
  }

  activate(state) {
    this.injector = new Injector(state);

    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === Constants.DOCK_ITEM_URI) {
        return this.getOrCreateDockItem();
      }
      else {
        return undefined;
      }
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'tree-view-panes:toggle-dock-item': () => { this.toggleDockItem(); }
    }));
  }

  deactivate() {
    this.subscriptions.dispose();

    this.injector.destroy();
    this.unsetDockItem();
  }

  serialize() {
    if (this.injector) {
      return this.injector.serialize();
    }
    else {
      return undefined;
    }
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

  setDockItem(dockItem) {
    if (!this.dockItem) {
      this.dockItem    = dockItem;
      this.dockItemSub = this.dockItem.onDidDestroy(() => {
        this.unsetDockItem();
      });
    }
  }

  unsetDockItem() {
    if (this.dockItem) {
      this.dockItemSub.dispose();
      this.dockItemSub = null;
      this.dockItem    = null;
    }
  }

  getOrCreateDockItem(state) {
    if (!this.dockItem) {
      this.setDockItem(new DockItem(state));
    }
    return this.dockItem;
  }

  toggleDockItem() {
    atom.workspace.toggle(Constants.DOCK_ITEM_URI);
  }
}

export default new TreeViewPanes();
