'use babel';

import { CompositeDisposable } from 'atom';

import ItemView from './item-view.js';

export default class PaneView {
  constructor(parent, pane, name, index, state) {
    this.parent          = parent;
    this.pane            = pane;
    this._name           = name;
    this._index          = index;
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

    // reflect pane state to the view
    this.setActive(this.pane.isActive());
    this.setExpanded(this._expanded);

    // create item-views for the existing items
    const items = this.pane.getItems();
    for (let i = 0; i < items.length; i++) {
      this._addItemView(items[i], i, false);
    }
    this._setActiveItemView(this.pane.getActiveItem());

    // pane observation
    this._paneSub = new CompositeDisposable();

    this._paneSub.add(this.pane.onDidChangeActive(active => {
      this.setActive(active);
    }));

    // item observation
    this._itemsSub = new CompositeDisposable();

    this._itemsSub.add(this.pane.onDidAddItem(event => {
      this._addItemView(event.item, event.index, true);
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

    // command observation
    this._commandsSub = new CompositeDisposable();
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:close-saved-items',
      () => {
        const items = this.pane.getItems();
        for (const item of items) {
          if (typeof item.isModified !== 'function' || !item.isModified()) {
            this.pane.destroyItem(item);
          }
        }
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this._headerElement,
      'tree-view-panes:split-up',
      () => {
        this.pane.splitUp({ copyActiveItem: true });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this._headerElement,
      'tree-view-panes:split-down',
      () => {
        this.pane.splitDown({ copyActiveItem: true });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this._headerElement,
      'tree-view-panes:split-left',
      () => {
        this.pane.splitLeft({ copyActiveItem: true });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this._headerElement,
      'tree-view-panes:split-right',
      () => {
        this.pane.splitRight({ copyActiveItem: true });
      }
    ));
    this._commandsSub.add(atom.commands.add(
      this.element,
      'tree-view-panes:close-pane',
      () => {
        this.pane.destroy();
      }
    ));

    // user interactions
    this._onClick = () => {
      this.setExpanded(!this._expanded);
    };
    this._headerElement.addEventListener('click', this._onClick);
    this._onDragOver = event => {
      event.stopPropagation();
      event.preventDefault();
    };
    this._headerElement.addEventListener('dragover', this._onDragOver);
    this._onDrop = event => {
      event.stopPropagation();
      event.preventDefault();
      const fromPaneIndex = parseInt(
        event.dataTransfer.getData('from-pane-index'),
        10
      );
      const fromIndex = parseInt(
        event.dataTransfer.getData('item-index'),
        10
      );
      if (Number.isNaN(fromPaneIndex) || Number.isNaN(fromIndex)) {
        return;
      }
      const fromPaneView = this.parent.getPaneViewAt(fromPaneIndex);
      if (!fromPaneView) {
        return;
      }
      const itemView = fromPaneView.getItemViewAt(fromIndex);
      if (!itemView) {
        return;
      }
      fromPaneView.pane.moveItemToPane(
        itemView.item,
        this.pane,
        0
      );
      this.pane.activateItemAtIndex(0);
      this.pane.activate();
    };
    this._headerElement.addEventListener('drop', this._onDrop);
  }

  get name() {
    return this._name;
  }

  get index() {
    return this._index;
  }

  get expanded() {
    return this._expanded;
  }

  setName(name) {
    this._name = name;
    this._nameElement.textContent = name;
  }

  setIndex(index) {
    this._index = index;
  }

  setExpanded(expanded) {
    this._expanded = expanded;
    if (expanded) {
      this.element.classList.remove('collapsed');
      this.element.classList.add('expanded');
    }
    else {
      this.element.classList.remove('expanded');
      this.element.classList.add('collapsed');
    }
  }

  setActive(active) {
    if (active) {
      this.element.classList.add('active');
    }
    else {
      this.element.classList.remove('active');
    }
  }

  getItemViewAt(index) {
    return this._itemViews[index];
  }

  _addItemView(item, index, updateItemViews) {
    const itemView = new ItemView(this, item, index);
    if (typeof this.pane.getPendingItem === 'function'
      && this.pane.getPendingItem() === item) {
      itemView.setPending(true);
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
    if (updateItemViews) {
      this.updateItemViewIndices();
    }
  }

  _removeItemView(item, index) {
    this._itemViews[index].destroy();
    this._itemViews.splice(index, 1);
    this.updateItemViewIndices();
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
    this.updateItemViewIndices();
  }

  updateItemViewTitles() {
    for (const itemView of this._itemViews) {
      itemView.updateTitle();
    }
  }

  updateItemViewIndices() {
    for (let i = 0; i < this._itemViews.length; i++) {
      this._itemViews[i].setIndex(i);
    }
  }

  _setActiveItemView(item) {
    if (this._activeItemView) {
      this._activeItemView.setActive(false);
    }
    for (const itemView of this._itemViews) {
      if (itemView.item === item) {
        itemView.setActive(true);
        this._activeItemView = itemView;
        break;
      }
    }
  }

  _unsetPendingItemView(item) {
    for (const itemView of this._itemViews) {
      if (itemView.item === item) {
        itemView.setPending(false);
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
    this._commandsSub.dispose();
    this._headerElement.removeEventListener('click', this._onClick);
    this._headerElement.removeEventListener('dragover', this._onDragOver);
    this._headerElement.removeEventListener('drop', this._onDrop);
    this.element.remove();
  }
}
