'use babel';

import { basename } from 'path';
import { CompositeDisposable } from 'atom';

import ItemView from './item-view.js';

export default class ItemController {
  constructor(parent, item, index) {
    this.parent      = parent;
    this.item        = item;
    this.index       = index;
    this.pending     = false;
    this.showPending = atom.config.get('tree-view-panes.showPendingItems');

    this.view = new ItemView(
      typeof this.item.getIconName === 'function'
        ? this.item.getIconName()
        : 'file'
    );
    this.updateTitle();
    this.updatePath();
    this.updateModified();
    this.view.setPending(this.pending);
    this.view.setVisibility(!this.pending || this.showPending);

    // item observation
    this.itemSub = new CompositeDisposable();
    if (typeof this.item.onDidChangeTitle === 'function') {
      this.itemSub.add(this.item.onDidChangeTitle(() => {
        this.updateTitle();
      }));
    }
    if (typeof this.item.onDidChangePath === 'function') {
      this.itemSub.add(this.item.onDidChangePath(() => {
        this.updatePath();
      }));
    }
    if (typeof this.item.onDidChangeModified === 'function') {
      this.itemSub.add(this.item.onDidChangeModified(() => {
        this.updateModified();
      }));
    }

    this.configSub = atom.config.observe(
      'tree-view-panes.showPendingItems',
      showPendingItems => {
        this.showPending = showPendingItems;
        this.view.setVisibility(!this.pending || this.showPending);
      }
    );

    this.commandsSub = new CompositeDisposable();
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:close-item',
      () => { this.parent.closeItem(this.item); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:close-other-items',
      () => { this.parent.closeItemsExcept(this.item); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-up',
      () => { this.parent.pane.splitUp({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-down',
      () => { this.parent.pane.splitDown({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-left',
      () => { this.parent.pane.splitLeft({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-right',
      () => { this.parent.pane.splitRight({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-up-and-move',
      () => {
        const pane = this.parent.pane.splitUp();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-down-and-move',
      () => {
        const pane = this.parent.pane.splitDown();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-left-and-move',
      () => {
        const pane = this.parent.pane.splitLeft();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      'tree-view-panes:split-right-and-move',
      () => {
        const pane = this.parent.pane.splitRight();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));

    // DOM events
    this.onClick = () => { this.parent.activateItem(this.item); };
    this.view.element.addEventListener('click', this.onClick);
    this.onDragStart = event => {
      event.stopPropagation();
      this.parent.activateItem(this.item);
      // set data
      event.dataTransfer.setData('tree-view-panes-event', 'true');
      event.dataTransfer.setData('sortable-index', this.index);
      event.dataTransfer.setData('from-pane-index', this.parent.index);
      event.dataTransfer.setData('from-window-id', atom.getCurrentWindow().id);
      // set dragging appearance
      event.dataTransfer.effectAllowed = 'move';
      const dragImage = this.view.nameElement.cloneNode(true);
      dragImage.style.position = 'absolute';
      dragImage.style.top      = '0';
      dragImage.style.left     = '0';
      document.body.appendChild(dragImage);
      window.requestAnimationFrame(() => {
        document.body.removeChild(dragImage);
      });
      event.dataTransfer.setDragImage(dragImage, 0, 0);
    };
    this.view.element.addEventListener('dragstart', this.onDragStart);
    this.onDragOver = event => {
      if (!event.dataTransfer.getData('tree-view-panes-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(true);
    };
    this.view.element.addEventListener('dragover', this.onDragOver);
    this.onDragEnter = event => {
      if (!event.dataTransfer.getData('tree-view-panes-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(true);
    };
    this.view.element.addEventListener('dragenter', this.onDragEnter);
    this.onDragLeave = event => {
      if (!event.dataTransfer.getData('tree-view-panes-event')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(false);
    };
    this.view.element.addEventListener('dragleave', this.onDragLeave);
    this.onDrop = event => {
      if (!event.dataTransfer.getData('tree-view-panes-event')) {
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
      const fromPaneCtrler = this.parent.parent.getPaneControllerAt(
        fromPaneIndex
      );
      if (!fromPaneCtrler) {
        return;
      }
      const itemCtrler = fromPaneCtrler.getItemControllerAt(fromIndex);
      if (!itemCtrler) {
        return;
      }
      // move item
      if (fromPaneCtrler === this.parent && itemCtrler === this) {
        return;
      }
      else {
        const toIndex = fromPaneCtrler === this.parent
          && itemCtrler.index <= this.index
          ? this.index
          : this.index + 1;
        fromPaneCtrler.moveItem(itemCtrler.item, this.parent.pane, toIndex);
      }
    };
    this.view.element.addEventListener('drop', this.onDrop);
    this.onCloseButtonClick = () => { this.parent.destroyItem(this.item); };
    this.view.closeButtonElement.addEventListener(
      'click',
      this.onCloseButtonClick
    );
  }

  setIndex(index) {
    this.index = index;
  }

  setActive(active) {
    this.view.setActive(active);
  }

  setPending(pending) {
    this.pending = pending;
    this.view.setPending(this.pending);
    this.view.setVisibility(!this.pending || this.showPending);
  }

  updateTitle() {
    const title = typeof this.item.getLongTitle === 'function'
      ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function'
        ? this.item.getTitle()
        : 'Unknown';
    this.view.setTitle(title);
  }

  updatePath() {
    if (typeof this.item.getPath === 'function') {
      const path = this.item.getPath();
      if (path) {
        this.view.setName(basename(path));
        this.view.setPath(path);
      }
      else {
        this.view.setName(undefined);
        this.view.setPath(undefined);
      }
    }
    else {
      this.view.setName(undefined);
      this.view.setPath(undefined);
    }
  }

  updateModified() {
    if (typeof this.item.isModified === 'function') {
      this.view.setModified(this.item.isModified());
    }
    else {
      this.view.setModified(false);
    }
  }

  copyItem() {
    if (typeof this.item.copy === 'function') {
      return [this.item.copy()];
    }
    else if (this.parent.pane.deserializerManager
      && typeof this.item.serialize === 'function') {
      return [
        this.parent.pane.deserializerManager.deserialize(this.item.serialize())
      ];
    }
    else {
      return [];
    }
  }

  destroy() {
    this.itemSub.dispose();
    this.configSub.dispose();
    this.commandsSub.dispose();
    this.view.element.removeEventListener('click', this.onClick);
    this.view.element.removeEventListener('dragstart', this.onDragStart);
    this.view.element.removeEventListener('dragover', this.onDragOver);
    this.view.element.removeEventListener('dragenter', this.onDragEnter);
    this.view.element.removeEventListener('dragleave', this.onDragLeave);
    this.view.element.removeEventListener('drop', this.onDrop);
    this.view.closeButtonElement.removeEventListener(
      'click',
      this.onCloseButtonClick
    );

    this.view.destroy();
  }
}
