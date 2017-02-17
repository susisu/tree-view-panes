'use babel';

import { basename } from 'path';
import { CompositeDisposable } from 'atom';

export default class ItemView {
  constructor(parent, item, index) {
    this.parent       = parent;
    this.item         = item;
    this._index       = index;
    this._pending     = false;
    this._showPending = atom.config.get('tree-view-panes.showPendingItems');

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane-file');
    this.element.setAttribute('draggable', 'true');
    this.element.classList.add('item', 'list-item');

    this._nameElement = document.createElement('span');
    this._nameElement.classList.add(
      'name',
      'icon',
      typeof this.item.getIconName === 'function'
        ? `icon-${this.item.getIconName()}`
        : 'icon-file'
    );

    this._closeButtonElement = document.createElement('div');
    this._closeButtonElement.classList.add('close-button');

    this.element.appendChild(this._closeButtonElement);
    this.element.appendChild(this._nameElement);

    this.updateTitle();
    this._updatePath();
    this._updateModified();

    // item observation
    this._itemSub = new CompositeDisposable();
    if (typeof this.item.onDidChangeTitle === 'function') {
      this._itemSub.add(this.item.onDidChangeTitle(() => {
        this.updateTitle();
      }));
    }
    if (typeof this.item.onDidChangePath === 'function') {
      this._itemSub.add(this.item.onDidChangePath(() => {
        this._updatePath();
      }));
    }
    if (typeof this.item.onDidChangeModified === 'function') {
      this._itemSub.add(this.item.onDidChangeModified(() => {
        this._updateModified();
      }));
    }

    // config observation
    this._configSub = atom.config.observe(
      'tree-view-panes.showPendingItems',
      showPendingItems => {
        this._showPending = showPendingItems;
        this._updateAppearance();
      }
    );

    // command observation
    this._commandsSub = new CompositeDisposable();
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:close-item',
      () => {
        this.parent.pane.destroyItem(this.item);
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:close-other-items',
      () => {
        const items = this.parent.pane.getItems();
        for (const item of items) {
          if (item !== this.item) {
            this.parent.pane.destroyItem(item);
          }
        }
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-up',
      () => {
        this.parent.pane.splitUp({
          items: typeof this.item.copy === 'function'
            ? [this.item.copy()]
            : []
        });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-down',
      () => {
        this.parent.pane.splitDown({
          items: typeof this.item.copy === 'function'
            ? [this.item.copy()]
            : []
        });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-left',
      () => {
        this.parent.pane.splitLeft({
          items: typeof this.item.copy === 'function'
            ? [this.item.copy()]
            : []
        });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-right',
      () => {
        this.parent.pane.splitRight({
          items: typeof this.item.copy === 'function'
            ? [this.item.copy()]
            : []
        });
      }
    ));

    // user interactions
    this._onClick = () => {
      this._activateItem();
    };
    this.element.addEventListener('click', this._onClick);
    this._onDragStart = event => {
      event.stopPropagation();
      event.dataTransfer.setData('from-pane-index', this.parent.index);
      event.dataTransfer.setData('item-index', this.index);
    };
    this.element.addEventListener('dragstart', this._onDragStart);
    this._onDragOver = event => {
      event.stopPropagation();
      event.preventDefault();
    };
    this.element.addEventListener('dragover', this._onDragOver);
    this._onDrop = event => {
      event.stopPropagation();
      event.preventDefault();
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
      const fromPaneView = this.parent.parent.getPaneViewAt(fromPaneIndex);
      if (!fromPaneView) {
        return;
      }
      const itemView = fromPaneView.getItemViewAt(fromIndex);
      if (!itemView) {
        return;
      }
      if (fromPaneView === this.parent) {
        if (itemView === this) {
          this._activateItem();
        }
        else {
          const toIndex = itemView.index <= this.index
            ? this.index
            : this.index + 1;
          this.parent.pane.moveItem(itemView.item, toIndex);
          this.parent.pane.activateItemAtIndex(toIndex);
          this.parent.pane.activate();
        }
      }
      else {
        fromPaneView.pane.moveItemToPane(
          itemView.item,
          this.parent.pane,
          this.index + 1
        );
        this.parent.pane.activateItemAtIndex(this.index + 1);
        this.parent.pane.activate();
      }
    };
    this.element.addEventListener('drop', this._onDrop);

    this._onCloseButtonClick = () => {
      this._destroyItem();
    };
    this._closeButtonElement.addEventListener(
      'click',
      this._onCloseButtonClick
    );
  }

  get index() {
    return this._index;
  }

  get pending() {
    return this._pending;
  }

  setIndex(index) {
    return this._index = index;
  }

  setActive(active) {
    if (active) {
      this.element.classList.add('selected');
    }
    else {
      this.element.classList.remove('selected');
    }
  }

  setPending(pending) {
    this._pending = pending;
    if (pending) {
      this.element.classList.add('pending-item');
      this._updateAppearance();
    }
    else {
      this.element.classList.remove('pending-item');
      this._updateAppearance();
    }
  }

  updateTitle() {
    const itemTitle
      = typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function' ? this.item.getTitle()
      : 'Unknown';
    this._nameElement.setAttribute('title', itemTitle);
    this._nameElement.textContent = itemTitle;
  }

  _updatePath() {
    if (typeof this.item.getPath === 'function') {
      const itemPath = this.item.getPath();
      if (itemPath) {
        this._nameElement.setAttribute('data-name', basename(itemPath));
        this._nameElement.setAttribute('data-path', itemPath);
      }
    }
  }

  _updateModified() {
    if (typeof this.item.isModified === 'function') {
      if (this.item.isModified()) {
        this.element.classList.add('modified');
      }
      else {
        this.element.classList.remove('modified');
      }
    }
  }

  _updateAppearance() {
    if (this._pending && !this._showPending) {
      this.element.classList.add('hidden');
    }
    else {
      this.element.classList.remove('hidden');
    }
  }

  _activateItem() {
    this.parent.pane.activateItem(this.item);
    this.parent.pane.activate();
  }

  _destroyItem() {
    this.parent.pane.destroyItem(this.item);
  }

  destroy() {
    this._itemSub.dispose();
    this._configSub.dispose();
    this._commandsSub.dispose();
    this.element.removeEventListener('click', this._onClick);
    this.element.removeEventListener('dragstart', this._onDragStart);
    this.element.addEventListener('dragover', this._onDragOver);
    this.element.addEventListener('drop', this._onDrop);
    this._closeButtonElement.removeEventListener(
      'click',
      this._onCloseButtonClick
    );
    this.element.remove();
  }
}
