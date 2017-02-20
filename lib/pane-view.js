'use babel';

export default class PaneView {
  constructor(name) {
    this.itemViews = [];

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tree-view-pane');
    this.element.classList.add(
      'list-item-pane',
      'list-nested-item',
      'expanded'
    );

    this.nameElement = document.createElement('span');
    this.nameElement.classList.add('name', 'icon', 'icon-file-directory');
    this.nameElement.textContent = name;

    this.headerElement = document.createElement('div');
    this.headerElement.classList.add(
      'list-item-pane-header',
      'header',
      'list-item'
    );
    this.headerElement.appendChild(this.nameElement);

    this.itemsElement = document.createElement('ol');
    this.itemsElement.classList.add('list-tree');

    this.element.appendChild(this.headerElement);
    this.element.appendChild(this.itemsElement);
  }

  setName(name) {
    this.nameElement.textContent = name;
  }

  setActive(active) {
    if (active) {
      this.element.classList.add('active');
    }
    else {
      this.element.classList.remove('active');
    }
  }

  setExpanded(expanded) {
    if (expanded) {
      this.element.classList.remove('collapsed');
      this.element.classList.add('expanded');
    }
    else {
      this.element.classList.remove('expanded');
      this.element.classList.add('collapsed');
    }
  }

  setDragOver(dragOver) {
    if (dragOver) {
      this.headerElement.classList.add('drag-over');
    }
    else {
      this.headerElement.classList.remove('drag-over');
    }
  }

  addItemViewAt(itemView, index) {
    if (this.itemViews[index]) {
      this.itemsElement.insertBefore(
        itemView.element,
        this.itemViews[index].element
      );
      this.itemViews.splice(index, 0, itemView);
    }
    else {
      this.itemsElement.appendChild(itemView.element);
      this.itemViews.push(itemView);
    }
  }

  removeItemViewAt(index) {
    this.itemsElement.removeChild(this.itemViews[index].element);
    this.itemViews.splice(index, 1);
  }

  moveItemView(oldIndex, newIndex) {
    const itemView = this.itemViews[oldIndex];
    this.itemsElement.removeChild(itemView.element);
    this.itemViews.splice(oldIndex, 1);
    if (this.itemViews[newIndex]) {
      this.itemsElement.insertBefore(
        itemView.element,
        this.itemViews[newIndex].element
      );
      this.itemViews.splice(newIndex, 0, itemView);
    }
    else {
      this.itemsElement.appendChild(itemView.element);
      this.itemViews.push(itemView);
    }
  }

  destroy() {
    this.element.remove();
  }
}
