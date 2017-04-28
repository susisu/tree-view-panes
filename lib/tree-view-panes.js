'use babel';

import { Disposable, CompositeDisposable } from 'atom';

import Injector from './injector.js';
import DockManager from './dock-manager.js';
import FileIcons from './file-icons.js';
import { CONFIG_PREFIX, COMMAND_PREFIX } from './constants.js';

class TreeViewPanes {
  constructor() {
    this.injector    = null;
    this.dockManager = null;

    this.subscriptions = new CompositeDisposable();
  }

  activate(state) {
    this.injector    = new Injector((state && state.injector) || {});
    this.dockManager = new DockManager();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      [`${COMMAND_PREFIX}toggle-injected-view`]: () => {
        atom.config.set(
          `${CONFIG_PREFIX}injectView`,
          !atom.config.get(`${CONFIG_PREFIX}injectView`)
        );
      }
    }));
  }

  deactivate() {
    this.subscriptions.dispose();

    this.injector.destroy();
    this.dockManager.destroy();
  }

  serialize() {
    return {
      injector: this.injector.serialize()
    };
  }

  updateItemIcons() {
    this.injector.updateItemIcons();
    this.dockManager.updateItemIcons();
  }

  consumeFileIcons(service) {
    FileIcons.setService(service);
    this.updateItemIcons();
    return new Disposable(() => {
      FileIcons.resetService();
      this.updateItemIcons();
    });
  }

  getOrCreateDockItem(state) {
    return this.dockManager.getOrCreateDockItem(state);
  }
}

export default new TreeViewPanes();
