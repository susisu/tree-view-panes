'use babel';

import { CompositeDisposable } from 'atom';

import DockItem from './dock-item.js';
import { COMMAND_PREFIX, DOCK_ITEM_URI } from './constants.js';

export default class DockManager {
  constructor() {
    this.dockItem    = null;
    this.dockItemSub = null;

    // event subscriptions
    this.subscriptions = new CompositeDisposable();

    // opener
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === DOCK_ITEM_URI) {
        return this.getOrCreateDockItem();
      }
      else {
        return undefined;
      }
    }));

    // commands
    this.subscriptions.add(atom.commands.add(
      'atom-workspace',
      `${COMMAND_PREFIX}toggle-dock-item`,
      () => {
        atom.workspace.toggle(DOCK_ITEM_URI);
      }
    ));
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

  updateItemIcons() {
    if (this.dockItem) {
      this.dockItem.updateItemIcons();
    }
  }

  destroy() {
    this.subscriptions.dispose();

    if (this.dockItem) {
      this.dockItem.destroy();
    }
  }
}
