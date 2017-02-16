'use babel';

import { CompositeDisposable } from 'atom';
import { requirePackages } from 'atom-utils';

import PaneView from './pane-view.js';

export default class TreeViewPanesView {
  constructor(state) {
    this._destroyed = false;
    this._paneViews = [];

    this.element = document.createElement('ol');
    this.element.classList.add(
      'tree-view-panes',
      'list-tree',
      'has-collapsable-children'
    );
    this.element.tabIndex = -1;

    // add element to the top of the tree view
    requirePackages('tree-view').then(([tv]) => {
      if (!this._destroyed) {
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
      }
    });

    const panes = atom.workspace.getPanes();
    for (let i = 0; i < panes.length; i++) {
      this.addPaneView(panes[i], i, false);
    }
    this.updatePaneViewNames();

    // pane observation
    this._paneSub = new CompositeDisposable();

    this._paneSub.add(atom.workspace.onDidAddPane(event => {
      const index = atom.workspace.getPanes().indexOf(event.pane);
      this.addPaneView(event.pane, index, true);
    }));

    this._paneSub.add(atom.workspace.onDidDestroyPane(event => {
      this.removePaneView(event.pane);
    }));

    // item observation
    this._itemSub = new CompositeDisposable();

    this._itemSub.add(atom.workspace.onDidAddPaneItem(() => {
      this.updateItemViewNames();
    }));

    this._itemSub.add(atom.workspace.onDidDestroyPaneItem(() => {
      this.updateItemViewNames();
    }));
  }

  addPaneView(pane, index, updateNames) {
    const paneView = new PaneView(pane, 'Pane');
    // add pane view to the correct position
    if (this._paneViews[index]) {
      this.element.insertBefore(
        paneView.element,
        this._paneViews[index].element
      );
      this._paneViews.splice(index, 0, paneView);
    }
    else {
      this.element.appendChild(paneView.element);
      this._paneViews.push(paneView);
    }
    if (updateNames) {
      this.updatePaneViewNames();
    }
  }

  removePaneView(pane) {
    for (let i = 0; i < this._paneViews.length; i++) {
      const paneView = this._paneViews[i];
      if (paneView.pane === pane) {
        paneView.destroy();
        this._paneViews.splice(i, 1);
        break;
      }
    }
    this.updatePaneViewNames();
  }

  updatePaneViewNames() {
    if (this._paneViews.length === 1) {
      this._paneViews[0].name = 'Open Files';
    }
    else {
      for (let i = 0; i < this._paneViews.length; i++) {
        this._paneViews[i].name = `Pane ${i + 1}`;
      }
    }
  }

  updateItemViewNames() {
    for (const paneView of this._paneViews) {
      paneView.updateItemViewNames();
    }
  }

  serialize() {
    return {};
  }

  destroy() {
    for (const paneView of this._paneViews) {
      paneView.destroy();
    }
    this._paneSub.dispose();
    this._itemSub.dispose();
    this.element.remove();
    this._destroyed = true;
  }
}
