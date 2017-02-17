'use babel';

import { basename } from 'path';
import { CompositeDisposable } from 'atom';

export default class ItemView {
  constructor(pane, item) {
    this.pane         = pane;
    this.item         = item;
    this._pending     = false;
    this._showPending = atom.config.get('tree-view-panes.showPendingItems');

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane-file');
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
        this.pane.destroyItem(this.item);
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:close-other-items',
      () => {
        const items = this.pane.getItems();
        for (const item of items) {
          if (item !== this.item) {
            this.pane.destroyItem(item);
          }
        }
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-up',
      () => {
        this.pane.splitUp({ items: typeof this.item.copy === 'function'
          ? [this.item.copy()]
          : []
        });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-down',
      () => {
        this.pane.splitDown({ items: typeof this.item.copy === 'function'
          ? [this.item.copy()]
          : []
        });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-left',
      () => {
        this.pane.splitLeft({ items: typeof this.item.copy === 'function'
          ? [this.item.copy()]
          : []
        });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:split-right',
      () => {
        this.pane.splitRight({ items: typeof this.item.copy === 'function'
          ? [this.item.copy()]
          : []
        });
      }
    ));

    // user interactions
    this.element.onclick = () => {
      this._activateItem();
    };

    this._closeButtonElement.onclick = () => {
      this._destroyItem();
    };
  }

  get pending() {
    return this._pending;
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
    this.pane.activateItem(this.item);
    this.pane.activate();
  }

  _destroyItem() {
    this.pane.destroyItem(this.item);
  }

  destroy() {
    this._itemSub.dispose();
    this._configSub.dispose();
    this._commandsSub.dispose();
    this.element.onclick = undefined;
    this._closeButtonElement.onclick = undefined;
    this.element.remove();
  }
}
