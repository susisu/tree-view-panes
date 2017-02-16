'use babel';

import { basename } from 'path';
import { CompositeDisposable } from 'atom';

export default class ItemView {
  constructor(item) {
    this.item = item;
    const itemTitle
      = typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function' ? this.item.getTitle()
      : 'Unknown';

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane-file');
    this.element.classList.add('file', 'list-item');

    this._nameElement = document.createElement('span');
    this._nameElement.classList.add('name', 'icon', 'icon-file');
    this._nameElement.setAttribute('title', itemTitle);
    if (typeof this.item.getPath === 'function') {
      const itemPath = this.item.getPath();
      this._nameElement.setAttribute('data-name', basename(itemPath));
      this._nameElement.setAttribute('data-path', itemPath);
    }
    this._nameElement.textContent = itemTitle;

    this.element.appendChild(this._nameElement);
  }

  updateName() {
    const itemTitle
      = typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function' ? this.item.getTitle()
      : 'Unknown';
    this._nameElement.setAttribute('title', itemTitle);
    this._nameElement.textContent = itemTitle;
  }

  destroy() {
    this.element.remove();
  }
}
