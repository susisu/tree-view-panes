'use babel';

import { CompositeDisposable } from 'atom';

export default class ItemView {
  constructor(item) {
    this.item = item;

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane-file');
    this.element.classList.add('file', 'list-item');
    this.element.textContent = item.getTitle();
  }

  destroy() {
    this.element.remove();
  }
}
