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
        const wrapper = document.createElement('div');
        wrapper.classList.add('tree-view-wrapper');
        scroller.insertBefore(wrapper, view);
        scroller.removeChild(view);
        wrapper.appendChild(this.element);
        wrapper.appendChild(view);
      }
    });

    // create pane-views for the existing panes
    const panes = atom.workspace.getPanes();
    for (let i = 0; i < panes.length; i++) {
      this._addPaneView(
        panes[i],
        'Pane',
        i,
        (state.paneViews && state.paneViews[i])
          || { expanded: true },
        false
      );
    }
    this.updatePaneViewNames();

    // pane observation
    this._panesSub = new CompositeDisposable();

    this._panesSub.add(atom.workspace.onDidAddPane(event => {
      const index = atom.workspace.getPanes().indexOf(event.pane);
      this._addPaneView(
        event.pane,
        'Pane',
        index,
        { expanded: true },
        true
      );
    }));

    this._panesSub.add(atom.workspace.onDidDestroyPane(event => {
      this._removePaneView(event.pane);
    }));

    // item observation
    this._itemsSub = new CompositeDisposable();

    this._itemsSub.add(atom.workspace.onDidAddPaneItem(() => {
      this.updateItemViewTitles();
    }));

    this._itemsSub.add(atom.workspace.onDidDestroyPaneItem(() => {
      this.updateItemViewTitles();
    }));
  }

  getPaneViewAt(index) {
    return this._paneViews[index];
  }

  _addPaneView(pane, name, index, state, updatePaneViews) {
    const paneView = new PaneView(this, pane, name, index, state);
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
    if (updatePaneViews) {
      this.updatePaneViewNames();
      this.updatePaneViewIndices();
    }
  }

  _removePaneView(pane) {
    for (let i = 0; i < this._paneViews.length; i++) {
      const paneView = this._paneViews[i];
      if (paneView.pane === pane) {
        paneView.destroy();
        this._paneViews.splice(i, 1);
        break;
      }
    }
    this.updatePaneViewNames();
    this.updatePaneViewIndices();
  }

  updatePaneViewNames() {
    if (this._paneViews.length === 1) {
      this._paneViews[0].setName('Open Files');
    }
    else {
      for (let i = 0; i < this._paneViews.length; i++) {
        this._paneViews[i].setName(`Pane ${i + 1}`);
      }
    }
  }

  updatePaneViewIndices() {
    for (let i = 0; i < this._paneViews.length; i++) {
      this._paneViews[i].setIndex(i);
    }
  }

  updateItemViewTitles() {
    for (const paneView of this._paneViews) {
      paneView.updateItemViewTitles();
    }
  }

  serialize() {
    return {
      paneViews: this._paneViews.map(paneView => paneView.serialize())
    };
  }

  destroy() {
    for (const paneView of this._paneViews) {
      paneView.destroy();
    }
    this._panesSub.dispose();
    this._itemsSub.dispose();
    this.element.remove();
    this._destroyed = true;
  }
}
