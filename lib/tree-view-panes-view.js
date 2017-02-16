'use babel';

import { requirePackages } from 'atom-utils';

export default class TreeViewPanesView {
  constructor(state) {
    void state;
    this.element = document.createElement('div');
    this.element.textContent = 'Hello';
    requirePackages('tree-view').then(([tv]) => {
      const tvElement = tv.treeView.element;
      const scroller = tvElement.querySelector('.tree-view-scroller');
      if (!scroller) {
        return;
      }
      const view = scroller.querySelector('.tree-view');
      if (!view) {
        return;
      }
      scroller.insertBefore(this.element, view);
    });
  }

  serialize() {
    return {};
  }

  destroy() {
    this.element.remove();
  }
}
