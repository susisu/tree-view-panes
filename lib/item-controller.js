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

    // DOM events
    this.onClick = () => { this.parent.activateItem(this.item); };
    this.view.element.addEventListener('click', this.onClick);
    this.onDragStart = event => {
      event.stopPropagation();
      event.dataTransfer.setData('tree-view-pane-item', '1');
      event.dataTransfer.setData('from-pane-index', this.parent.index);
      event.dataTransfer.setData('item-index', this.index);
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
      event.stopPropagation();
      event.preventDefault();
      if (event.dataTransfer.getData('tree-view-pane-item')) {
        this.view.setDragOver(true);
      }
    };
    this.view.element.addEventListener('dragover', this.onDragOver);
    this.onDragEnter = event => {
      event.stopPropagation();
      event.preventDefault();
      if (event.dataTransfer.getData('tree-view-pane-item')) {
        this.view.setDragOver(true);
      }
    };
    this.view.element.addEventListener('dragenter', this.onDragEnter);
    this.onDragLeave = event => {
      event.stopPropagation();
      event.preventDefault();
      if (event.dataTransfer.getData('tree-view-pane-item')) {
        this.view.setDragOver(false);
      }
    };
    this.view.element.addEventListener('dragleave', this.onDragLeave);
    this.onDrop = event => {
      event.stopPropagation();
      event.preventDefault();
      if (event.dataTransfer.getData('tree-view-pane-item')) {
        this.view.setDragOver(false);
        const fromPaneIndex = parseInt(
          event.dataTransfer.getData('from-pane-index'),
          10
        );
        const fromIndex = parseInt(
          event.dataTransfer.getData('item-index'),
          10
        );
        if (Number.isNaN(fromPaneIndex) || Number.isNaN(fromIndex)) {
          return;
        }
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
        if (fromPaneCtrler === this.parent && itemCtrler === this) {
          this.parent.activateItem(this.item);
        }
        else {
          const toIndex = fromPaneCtrler === this.parent
            && itemCtrler.index <= this.index
            ? this.index
            : this.index + 1;
          fromPaneCtrler.moveItem(itemCtrler.item, this.parent.pane, toIndex);
        }
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
    return typeof this.item.copy === 'function'
      ? [this.item.copy()]
      : [];
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
