'use babel';

import { CompositeDisposable } from 'atom';

import ItemView from './item-view.js';

export default class PaneView {
  constructor(pane, name, state) {
    this.pane            = pane;
    this._name           = name;
    this._expanded       = !!state.expanded;
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

    if (this.pane.isActive()) {
      this._setActive();
    }
    else {
      this._unsetActive();
    }

    if (this._expanded) {
      this.expand();
    }
    else {
      this.collapse();
    }

    // create item-views for the existing items
    const items = this.pane.getItems();
    for (let i = 0; i < items.length; i++) {
      this._addItemView(items[i], i);
    }
    this._setActiveItemView(this.pane.getActiveItem());

    // pane observation
    this._paneSub = new CompositeDisposable();

    this._paneSub.add(this.pane.onDidChangeActive(active => {
      if (active) {
        this._setActive();
      }
      else {
        this._unsetActive();
      }
    }));

    // item observation
    this._itemsSub = new CompositeDisposable();

    this._itemsSub.add(this.pane.onDidAddItem(event => {
      this._addItemView(event.item, event.index);
    }));

    this._itemsSub.add(this.pane.onDidRemoveItem(event => {
      this._removeItemView(event.item, event.index);
    }));

    this._itemsSub.add(this.pane.onDidMoveItem(event => {
      this._moveItemView(event.item, event.oldIndex, event.newIndex);
    }));

    this._itemsSub.add(this.pane.onDidChangeActiveItem(item => {
      this._setActiveItemView(item);
    }));

    if (typeof this.pane.onItemDidTerminatePendingState === 'function') {
      this._itemsSub.add(this.pane.onItemDidTerminatePendingState(item => {
        this._unsetPendingItemView(item);
      }));
    }

    // user interactions
    this._headerElement.onclick = () => {
      this.toggleExpanded();
    };
  }

  get name() {
    return this._name;
  }

  get expanded() {
    return this._expanded;
  }

  setName(name) {
    this._name = name;
    this._nameElement.textContent = name;
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

  toggleExpanded() {
    if (this._expanded) {
      this.collapse();
    }
    else {
      this.expand();
    }
  }

  _setActive() {
    this.element.classList.add('active');
  }

  _unsetActive() {
    this.element.classList.remove('active');
  }

  _addItemView(item, index) {
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

  _removeItemView(item, index) {
    this._itemViews[index].destroy();
    this._itemViews.splice(index, 1);
  }

  _moveItemView(item, oldIndex, newIndex) {
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

  updateItemViewTitles() {
    for (const itemView of this._itemViews) {
      itemView.updateTitle();
    }
  }

  _setActiveItemView(item) {
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

  _unsetPendingItemView(item) {
    for (const itemView of this._itemViews) {
      if (itemView.item === item) {
        itemView.unsetPending();
        break;
      }
    }
  }

  serialize() {
    return {
      expanded: this._expanded
    };
  }

  destroy() {
    this._paneSub.dispose();
    this._itemsSub.dispose();
    this._headerElement.onclick = undefined;
    this.element.remove();
  }
}
