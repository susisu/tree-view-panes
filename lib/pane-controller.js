'use babel';

import { CompositeDisposable } from 'atom';

import PaneView from './pane-view.js';
import ItemController from './item-controller.js';

export default class PaneController {
  constructor(parent, pane, name, index, state) {
    this.parent   = parent;
    this.pane     = pane;
    this.name     = name;
    this.index    = index;
    this.expanded = !!state.expanded;

    this.view = new PaneView(this.name);
    this.view.setActive(this.pane.isActive());
    this.view.setExpanded(this.expanded);

    this.itemCtrlers      = [];
    this.activeItemCtrler = null;

    // create item-controllers for the existing items
    const items = this.pane.getItems();
    for (let index = 0; index < items.length; index++) {
      this.addItemControllerOf(items[index], index);
    }
    this.updateItemInfo();
    this.setActiveItem(this.pane.getActiveItem());

    // pane observation
    this.paneSub = new CompositeDisposable();
    this.paneSub.add(this.pane.onDidChangeActive(active => {
      this.view.setActive(active);
    }));

    // item observation
    this.itemsSub = new CompositeDisposable();
    this.itemsSub.add(this.pane.onDidAddItem(event => {
      this.addItemControllerOf(event.item, event.index);
      this.updateItemInfo();
    }));
    this.itemsSub.add(this.pane.onDidRemoveItem(event => {
      this.removeItemControllerOf(event.item, event.index);
      this.updateItemInfo();
    }));
    this.itemsSub.add(this.pane.onDidMoveItem(event => {
      this.moveItemControllerOf(event.item, event.oldIndex, event.newIndex);
      this.updateItemInfo();
    }));
    this.itemsSub.add(this.pane.onDidChangeActiveItem(item => {
      this.setActiveItem(item);
    }));
    if (typeof this.pane.onItemDidTerminatePendingState === 'function') {
      this.itemsSub.add(this.pane.onItemDidTerminatePendingState(item => {
        this.unsetPendingItem(item);
      }));
    }

    // command observation
    this.commandsSub = new CompositeDisposable();
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'working-files:close-saved-items',
      () => { this.closeSavedItems(); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.headerElement,
      'working-files:split-up',
      () => { this.pane.splitUp({ copyActiveItem: true }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.headerElement,
      'working-files:split-down',
      () => { this.pane.splitDown({ copyActiveItem: true }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.headerElement,
      'working-files:split-left',
      () => { this.pane.splitLeft({ copyActiveItem: true }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.headerElement,
      'working-files:split-right',
      () => { this.pane.splitRight({ copyActiveItem: true }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'working-files:close-pane',
      () => { this.pane.destroy(); }
    ));

    // DOM events
    this.onClick = () => {
      this.expanded = !this.expanded;
      this.view.setExpanded(this.expanded);
    };
    this.onDragOver = event => {
      if (!event.dataTransfer.getData('working-files-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(true);
    };
    this.onDragEnter = event => {
      if (!event.dataTransfer.getData('working-files-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(true);
    };
    this.onDragLeave = event => {
      if (!event.dataTransfer.getData('working-files-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(false);
    };
    this.onDrop = event => {
      if (!event.dataTransfer.getData('working-files-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(false);
      // get data
      const fromWindowId = parseInt(
        event.dataTransfer.getData('from-window-id')
      );
      const fromPaneIndex = parseInt(
        event.dataTransfer.getData('from-pane-index')
      );
      const fromIndex = parseInt(
        event.dataTransfer.getData('sortable-index')
      );
      // dropping from other window is (currently) not supported
      if (fromWindowId !== atom.getCurrentWindow().id) {
        return;
      }
      // find controllers
      const fromPaneCtrler = this.parent.getPaneControllerAt(fromPaneIndex);
      if (!fromPaneCtrler) {
        return;
      }
      const itemCtrler = fromPaneCtrler.getItemControllerAt(fromIndex);
      if (!itemCtrler) {
        return;
      }
      // move item
      fromPaneCtrler.moveItem(itemCtrler.item, this.pane, 0);
    };
    this.view.headerElement.addEventListener('click', this.onClick);
    this.view.headerElement.addEventListener('dragover', this.onDragOver);
    this.view.headerElement.addEventListener('dragenter', this.onDragEnter);
    this.view.headerElement.addEventListener('dragleave', this.onDragLeave);
    this.view.headerElement.addEventListener('drop', this.onDrop);
  }

  setName(name) {
    this.name = name;
    this.view.setName(name);
  }

  setIndex(index) {
    this.index = index;
  }

  activateItem(item) {
    this.pane.activateItem(item);
    this.pane.activate();
  }

  destroyItem(item) {
    this.pane.destroyItem(item);
  }

  moveItem(item, pane, index) {
    if (this.pane === pane) {
      this.pane.moveItem(item, index);
    }
    else {
      this.pane.moveItemToPane(item, pane, index);
    }
    pane.activateItemAtIndex(index);
    pane.activate();
  }

  getItemControllerAt(index) {
    return this.itemCtrlers[index];
  }

  addItemControllerOf(item, index) {
    const itemCtrler = new ItemController(this, item, index);
    if (typeof this.pane.getPendingItem === 'function'
      && this.pane.getPendingItem() === item) {
      itemCtrler.setPending(true);
    }
    this.itemCtrlers.splice(index, 0, itemCtrler);
    this.view.addItemViewAt(itemCtrler.view, index);
  }

  removeItemControllerOf(item, index) {
    const itemCtrler = this.itemCtrlers[index];
    if (itemCtrler.item !== item) {
      throw new Error('item index does not match');
    }
    this.view.removeItemViewAt(index);
    this.itemCtrlers.splice(index, 1);
    itemCtrler.destroy();
  }

  moveItemControllerOf(item, oldIndex, newIndex) {
    const itemCtrler = this.itemCtrlers[oldIndex];
    if (itemCtrler.item !== item) {
      throw new Error('item index does not match');
    }
    this.itemCtrlers.splice(oldIndex, 1);
    this.view.moveItemView(oldIndex, newIndex);
    this.itemCtrlers.splice(newIndex, 0, itemCtrler);
  }

  updateItemInfo() {
    for (let index = 0; index < this.itemCtrlers.length; index++) {
      const itemCtrler = this.itemCtrlers[index];
      itemCtrler.setIndex(index);
    }
  }

  updateItemTitles() {
    for (const itemCtrler of this.itemCtrlers) {
      itemCtrler.updateTitle();
    }
  }

  updateItemIcons() {
    for (const itemCtrler of this.itemCtrlers) {
      itemCtrler.updateIcon();
    }
  }

  setActiveItem(item) {
    if (this.activeItemCtrler) {
      this.activeItemCtrler.setActive(false);
    }
    for (const itemCtrler of this.itemCtrlers) {
      if (itemCtrler.item === item) {
        itemCtrler.setActive(true);
        this.activeItemCtrler = itemCtrler;
        break;
      }
    }
  }

  unsetPendingItem(item) {
    for (const itemCtrler of this.itemCtrlers) {
      if (itemCtrler.item === item) {
        itemCtrler.setPending(false);
        break;
      }
    }
  }

  closeItem(item) {
    this.pane.destroyItem(item);
  }

  closeItemsExcept(exceptItem) {
    const items = this.pane.getItems();
    for (const item of items) {
      if (item !== exceptItem) {
        this.pane.destroyItem(item);
      }
    }
  }

  closeSavedItems() {
    const items = this.pane.getItems();
    for (const item of items) {
      if (typeof item.isModified !== 'function' || !item.isModified()) {
        this.pane.destroyItem(item);
      }
    }
  }

  destroy() {
    this.paneSub.dispose();
    this.itemsSub.dispose();
    this.commandsSub.dispose();
    this.view.headerElement.removeEventListener('click', this.onClick);
    this.view.headerElement.removeEventListener('dragover', this.onDragOver);
    this.view.headerElement.removeEventListener('dragenter', this.onDragEnter);
    this.view.headerElement.removeEventListener('dragleave', this.onDragLeave);
    this.view.headerElement.removeEventListener('drop', this.onDrop);

    for (const itemCtrler of this.itemCtrlers) {
      itemCtrler.destroy();
    }

    this.view.destroy();
  }

  serialize() {
    return {
      expanded: this.expanded
    };
  }
}
