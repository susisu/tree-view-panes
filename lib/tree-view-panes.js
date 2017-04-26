'use babel';

import { Disposable, CompositeDisposable } from 'atom';

import Injector from './injector.js';
import DockItem from './dock-item.js';
import FileIcons from './file-icons.js';
import { CONFIG_PREFIX, COMMAND_PREFIX, DOCK_ITEM_URI } from './constants.js';

class TreeViewPanes {
  constructor() {
    this.injector = null;
    this.dockItem = null;

    this.subscriptions = new CompositeDisposable();
    this.dockItemSub = null;
  }

  activate(state) {
    this.injector = new Injector(state && state.injector);

    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === DOCK_ITEM_URI) {
        return this.getOrCreateDockItem();
      }
      else {
        return undefined;
      }
    }));

    this.subscriptions.add(atom.config.observe(
      `${CONFIG_PREFIX}injectView`,
      injectView => {
        if (injectView) {
          this.injector.injectView();
        }
        else {
          this.injector.ejectView();
        }
      }
    ));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      [`${COMMAND_PREFIX}toggle-injected-view`]: () => {
        atom.config.set(
          `${CONFIG_PREFIX}injectView`,
          !atom.config.get(`${CONFIG_PREFIX}injectView`)
        );
      },
      [`${COMMAND_PREFIX}toggle-dock-item`]: () => {
        atom.workspace.toggle(DOCK_ITEM_URI);
      }
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
}

export default new TreeViewPanes();
