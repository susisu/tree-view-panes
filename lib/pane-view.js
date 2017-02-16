'use babel';

import { CompositeDisposable } from 'atom';

export default class PaneView {
  constructor(pane, name) {
    this.pane      = pane;
    this._name     = name;
    this.itemViews = [];

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane');
    this.element.classList.add(
      'pane',
      // 'entry',
      'list-nested-item',
      'expanded'
    );

    this._nameElement = document.createElement('span');
    this._nameElement.classList.add('name', 'icon', 'icon-file-directory');
    this._nameElement.textContent = this._name;

    const headerElement = document.createElement('div');
    headerElement.classList.add('pane-header', 'header', 'list-item');
    headerElement.appendChild(this._nameElement);

    this._itemsElement = document.createElement('ol');
    this._itemsElement.classList.add('entries', 'list-tree');

    this.element.appendChild(headerElement);
    this.element.appendChild(this._itemsElement);

    this.itemSub = new CompositeDisposable();
    this.itemSub.add(this.pane.observeItems(item => {
      this.addItem(item);
    }));
    this.itemSub.add(this.pane.onDidRemoveItem(event => {
      this.removeItem(event.item);
    }));
    this.itemSub.add(this.pane.onDidMoveItem(event => {
      this.moveItem(event.item, event.oldIndex, event.newIndex);
    }));
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
    this._nameElement.textContent = value;
  }

  addItem(item) {
    console.log(item.getTitle());
  }

  removeItem(item) {
    console.log(item.getTitle());
  }

  moveItem(item, oldIndex, newIndex) {
    console.log(item.getTitle(), oldIndex, newIndex);
  }

  destroy() {
    this.itemSub.dispose();
    this.element.remove();
  }
}
