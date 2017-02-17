'use babel';

import { basename } from 'path';
import { TextEditor, CompositeDisposable } from 'atom';

export default class ItemView {
  constructor(pane, item) {
    this.pane         = pane;
    this.item         = item;
    this._active      = false;
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

    // config observation
    this._configSub = atom.config.observe(
      'tree-view-panes.showPendingItems',
      showPendingItems => {
        this._showPending = showPendingItems;
        this._updateAppearance();
      }
    );

    // user interactions
    this.element.onclick = () => {
      this._activateItem();
    };

    this._closeButtonElement.onclick = () => {
      this._destroyItem();
    };
  }

  get active() {
    return this._active;
  }

  get pending() {
    return this._pending;
  }

  setActive() {
    this._active = true;
    this.element.classList.add('selected');
  }

  unsetActive() {
    this._active = false;
    this.element.classList.remove('selected');
  }

  setPending() {
    this._pending = true;
    this.element.classList.add('pending-item');
    this._updateAppearance();
  }

  unsetPending() {
    this._pending = false;
    this.element.classList.remove('pending-item');
    this._updateAppearance();
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
    this.element.onclick = undefined;
    this._closeButtonElement.onclick = undefined;
    this.element.remove();
  }
}
