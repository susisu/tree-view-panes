'use babel';

import { basename } from 'path';
import { TextEditor } from 'atom';

export default class ItemView {
  constructor(pane, item) {
    this.pane         = pane;
    this.item         = item;
    this._active      = false;
    this._pending     = false;
    this._showPending = atom.config.get('tree-view-panes.showPendingItems');

    const itemTitle
      = typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function' ? this.item.getTitle()
      : 'Unknown';

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane-file');
    this.element.classList.add('item', 'list-item');

    this._nameElement = document.createElement('span');
    this._nameElement.classList.add(
      'name',
      'icon',
      this.item instanceof TextEditor ? 'icon-file' : 'icon-tools'
    );
    this._nameElement.setAttribute('title', itemTitle);
    if (typeof this.item.getPath === 'function') {
      const itemPath = this.item.getPath();
      this._nameElement.setAttribute('data-name', basename(itemPath));
      this._nameElement.setAttribute('data-path', itemPath);
    }
    this._nameElement.textContent = itemTitle;

    this.element.appendChild(this._nameElement);

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

  destroy() {
    this._configSub.dispose();
    this.element.onclick = undefined;
    this.element.remove();
  }
}
