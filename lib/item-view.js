'use babel';

import { basename } from 'path';
import { TextEditor } from 'atom';

export default class ItemView {
  constructor(pane, item) {
    this.pane    = pane;
    this.item    = item;
    this.pending = false;

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

    this._configSub = atom.config.observe(
      'tree-view-panes.showPendingItems',
      showPendingItems => {
        this.updatePendingAppearance(showPendingItems);
      }
    );

    this.element.onclick = () => {
      this.activateItem();
    };
  }

  setActive() {
    this.element.classList.add('selected');
  }

  unsetActive() {
    this.element.classList.remove('selected');
  }

  setPending() {
    this.pending = true;
    this.element.classList.add('pending-item');
    this.updatePendingAppearance(
      atom.config.get('tree-view-panes.showPendingItems')
    );
  }

  unsetPending() {
    this.pending = false;
    this.element.classList.remove('pending-item');
    this.updatePendingAppearance(
      atom.config.get('tree-view-panes.showPendingItems')
    );
  }

  updateName() {
    const itemTitle
      = typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function' ? this.item.getTitle()
      : 'Unknown';
    this._nameElement.setAttribute('title', itemTitle);
    this._nameElement.textContent = itemTitle;
  }

  updatePendingAppearance(showPendingItems) {
    if (this.pending && !showPendingItems) {
      this.element.classList.add('hidden');
    }
    else {
      this.element.classList.remove('hidden');
    }
  }

  activateItem() {
    this.pane.activateItem(this.item);
    this.pane.activate();
  }

  destroy() {
    this._configSub.dispose();
    this.element.onclick = undefined;
    this.element.remove();
  }
}
