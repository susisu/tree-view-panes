'use babel';

export default class View {
  constructor() {
    this.paneViews = [];

    this.element = document.createElement('ol');
    this.element.classList.add('tree-view-panes', 'list-tree', 'has-collapsable-children');
  }

  addPaneViewAt(paneView, index) {
    if (this.paneViews[index]) {
      this.element.insertBefore(paneView.element, this.paneViews[index].element);
      this.paneViews.splice(index, 0, paneView);
    }
    else {
      this.element.appendChild(paneView.element);
      this.paneViews.push(paneView);
    }
  }

  removePaneViewAt(index) {
    if (this.paneViews[index]) {
      this.element.removeChild(this.paneViews[index].element);
      this.paneViews.splice(index, 1);
    }
  }

  destroy() {
    this.element.remove();
  }
}
