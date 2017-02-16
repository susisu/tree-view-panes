'use babel';

import { CompositeDisposable } from 'atom';

import ItemView from './item-view.js';

export default class PaneView {
  constructor(pane, name) {
    this.pane       = pane;
    this._name      = name;
    this._itemViews = [];

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane');
    this.element.classList.add('pane', 'list-nested-item', 'expanded');

    this._nameElement = document.createElement('span');
    this._nameElement.classList.add('name', 'icon', 'icon-file-directory');
    this._nameElement.textContent = this._name;

    const headerElement = document.createElement('div');
    headerElement.classList.add('pane-header', 'header', 'list-item');
    headerElement.appendChild(this._nameElement);

    this._itemsElement = document.createElement('ol');
    this._itemsElement.classList.add('list-tree');

    this.element.appendChild(headerElement);
    this.element.appendChild(this._itemsElement);

    const items = this.pane.getItems();
    for (let i = 0; i < items.length; i++) {
      this.addItemView(items[i], i);
    }

    // item observation
    this.itemSub = new CompositeDisposable();

    this.itemSub.add(this.pane.onDidAddItem(event => {
      this.addItemView(event.item, event.index);
    }));

    this.itemSub.add(this.pane.onDidRemoveItem(event => {
      this.removeItemView(event.item, event.index);
    }));

    this.itemSub.add(this.pane.onDidMoveItem(event => {
      this.moveItemView(event.item, event.oldIndex, event.newIndex);
    }));

    if (typeof this.pane.onItemDidTerminatePendingState === 'function') {
      this.itemSub.add(this.pane.onItemDidTerminatePendingState(item => {
        this.clearItemPendingState(item);
      }));
    }
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
    this._nameElement.textContent = value;
  }

  addItemView(item, index) {
    const itemView = new ItemView(item);
    if (typeof this.pane.getPendingItem === 'function'
      && this.pane.getPendingItem() === item) {
      itemView.setPending();
    }
    if (this._itemViews[index]) {
      this._itemsElement.insertBefore(
        itemView.element,
        this._itemViews[index].element
      );
      this._itemViews.splice(index, 0, itemView);
    }
    else {
      this._itemsElement.appendChild(itemView.element);
      this._itemViews.push(itemView);
    }
  }

  removeItemView(item, index) {
    this._itemViews[index].destroy();
    this._itemViews.splice(index, 1);
  }

  moveItemView(item, oldIndex, newIndex) {
    const itemView = this._itemViews[oldIndex];
    this._itemsElement.removeChild(itemView.element);
    this._itemViews.splice(oldIndex, 1);
    if (this._itemViews[newIndex]) {
      this._itemsElement.insertBefore(
        itemView.element,
        this._itemViews[newIndex].element
      );
      this._itemViews.splice(newIndex, 0, itemView);
    }
    else {
      this._itemsElement.appendChild(itemView.element);
      this._itemViews.push(itemView);
    }
  }

  updateItemViewNames() {
    for (const itemView of this._itemViews) {
      itemView.updateName();
    }
  }

  clearItemPendingState(item) {
    for (const itemView of this._itemViews) {
      if (itemView.item === item) {
        itemView.clearPending();
        break;
      }
    }
  }

  destroy() {
    this.itemSub.dispose();
    this.element.remove();
  }
}
