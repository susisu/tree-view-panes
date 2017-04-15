'use babel';

import { Disposable, CompositeDisposable } from 'atom';

import DockItem from './dock-item.js';
import FileIcons from './file-icons.js';

class TreeViewPanes {
  constructor() {
  }

  activate() {
    this.dockItems = new Set();

    this.sub = new CompositeDisposable();
    this.sub.add(atom.workspace.addOpener(uri => {
      if (uri === 'atom://tree-view-panes') {
        const dockItem = new DockItem();
        this.dockItems.add(dockItem);
        return dockItem;
      }
      else {
        return undefined;
      }
    }));
    this.sub.add(atom.commands.add('atom-workspace', {
      'tree-view-panes:toggle': () => {
        this.toggle();
      }
    }));
  }

  toggle() {
    atom.workspace.toggle('atom://tree-view-panes');
  }

  deactivate() {
    this.sub.dispose();

    for (const dockItem of this.dockItems) {
      dockItem.destroy();
    }
  }

  consumeFileIcons(service) {
    FileIcons.setService(service);
    for (const dockItem of this.dockItems) {
      dockItem.controller.updateItemIcons();
    }
    return new Disposable(() => {
      FileIcons.resetService();
      for (const dockItem of this.dockItems) {
        dockItem.controller.updateItemIcons();
      }
    });
  }

  serialize() {
  }

  deserializeDockItem(state) {
    return new DockItem(state);
  }
}

export default new TreeViewPanes();
