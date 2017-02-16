'use babel';

import { CompositeDisposable } from 'atom';

import ItemView from './item-view.js';

export default class PaneView {
  constructor(pane, state) {
    this.pane            = pane;
    this._name           = state.name;
    this._expanded       = state.expanded;
    this._itemViews      = [];
    this._activeItemView = null;

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane');
    this.element.classList.add('pane', 'list-nested-item', 'expanded');

    this._nameElement = document.createElement('span');
    this._nameElement.classList.add('name', 'icon', 'icon-file-directory');
    this._nameElement.textContent = this._name;

    this._headerElement = document.createElement('div');
    this._headerElement.classList.add('pane-header', 'header', 'list-item');
    this._headerElement.appendChild(this._nameElement);

    this._itemsElement = document.createElement('ol');
    this._itemsElement.classList.add('list-tree');

    this.element.appendChild(this._headerElement);
    this.element.appendChild(this._itemsElement);

    if (this._expanded) {
      this.expand();
    }
    else {
      this.collapse();
    }

    const items = this.pane.getItems();
    for (let i = 0; i < items.length; i++) {
      this.addItemView(items[i], i);
    }
    this.setActiveItem(this.pane.getActiveItem());

    // item observation
    this._itemSub = new CompositeDisposable();

    this._itemSub.add(this.pane.onDidAddItem(event => {
      this.addItemView(event.item, event.index);
    }));

    this._itemSub.add(this.pane.onDidRemoveItem(event => {
      this.removeItemView(event.item, event.index);
    }));

    this._itemSub.add(this.pane.onDidMoveItem(event => {
      this.moveItemView(event.item, event.oldIndex, event.newIndex);
    }));

    this._itemSub.add(this.pane.onDidChangeActiveItem(item => {
      this.setActiveItem(item);
    }));

    if (typeof this.pane.onItemDidTerminatePendingState === 'function') {
      this._itemSub.add(this.pane.onItemDidTerminatePendingState(item => {
        this.unsetPendingItem(item);
      }));
    }

    this._headerElement.onclick = () => {
      if (this._expanded) {
        this.collapse();
      }
      else {
        this.expand();
      }
    };
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
    this._nameElement.textContent = value;
  }

  expand() {
    this.element.classList.remove('collapsed');
    this.element.classList.add('expanded');
    this._expanded = true;
  }

  collapse() {
    this.element.classList.remove('expanded');
    this.element.classList.add('collapsed');
    this._expanded = false;
  }

  addItemView(item, index) {
    const itemView = new ItemView(this.pane, item);
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

  setActiveItem(item) {
    if (this._activeItemView) {
      this._activeItemView.unsetActive();
    }
    for (const itemView of this._itemViews) {
      if (itemView.item === item) {
        itemView.setActive();
        this._activeItemView = itemView;
        break;
      }
    }
  }

  unsetPendingItem(item) {
    for (const itemView of this._itemViews) {
      if (itemView.item === item) {
        itemView.unsetPending();
        break;
      }
    }
  }

  serialize() {
    return {
      name    : this._name,
      expanded: this._expanded
    };
  }

  destroy() {
    this._itemSub.dispose();
    this._headerElement.onclick = undefined;
    this.element.remove();
  }
}
