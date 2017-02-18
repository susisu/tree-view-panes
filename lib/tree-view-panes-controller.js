'use babel';

import { CompositeDisposable } from 'atom';
import { requirePackages } from 'atom-utils';

import TreeViewPanesView from './tree-view-panes-view.js';
import PaneController from './pane-controller.js';

export default class TreeViewPanesController {
  constructor(state) {
    this.destroyed = false;
    this.wrapped   = false;

    this.view = new TreeViewPanesView();

    this.paneCtrlers = [];

    this.parentElement   = null;
    this.originalElement = null;
    this.wrapperElement  = null;

    requirePackages('tree-view').then(([tv]) => {
      if (!this.destroyed) {
        // add element to the top of the tree view
        const tvElement = tv.treeView.element;
        this.parentElement = tvElement.querySelector('.tree-view-scroller');
        if (!this.parentElement) {
          return;
        }
        this.originalElement = this.parentElement.querySelector('.tree-view');
        if (!this.originalElement) {
          return;
        }
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.classList.add('tree-view-wrapper');
        this.parentElement.replaceChild(
          this.wrapperElement,
          this.originalElement
        );
        this.wrapperElement.appendChild(this.view.element);
        this.wrapperElement.appendChild(this.originalElement);
        this.wrapped = true;
      }
    });

    // create pane-controllers for the existing panes
    const panes = atom.workspace.getPanes();
    for (let index = 0; index < panes.length; index++) {
      this.addPaneControllerOf(
        panes[index],
        'Pane',
        index,
        (state.panes && state.panes[index]) || { expanded: true }
      );
    }
    this.updatePanesInfo();

    // pane observation
    this.panesSub = new CompositeDisposable();

    this.panesSub.add(atom.workspace.onDidAddPane(event => {
      const index = atom.workspace.getPanes().indexOf(event.pane);
      this.addPaneControllerOf(
        event.pane,
        'Pane',
        index,
        { expanded: true }
      );
      this.updatePanesInfo();
    }));

    this.panesSub.add(atom.workspace.onDidDestroyPane(event => {
      this.removePaneControllerOf(event.pane);
      this.updatePanesInfo();
    }));

    // item observation
    this.itemsSub = new CompositeDisposable();
    this.itemsSub.add(atom.workspace.onDidAddPaneItem(() => {
      this.updateItemsTitle();
    }));

    this.itemsSub.add(atom.workspace.onDidDestroyPaneItem(() => {
      this.updateItemsTitle();
    }));
  }

  getPaneControllerAt(index) {
    return this.paneCtrlers[index];
  }

  addPaneControllerOf(pane, name, index, state) {
    const paneCtrler = new PaneController(this, pane, name, index, state);
    this.paneCtrlers.splice(index, 0, paneCtrler);
    this.view.addPaneViewAt(paneCtrler.view, index);
  }

  removePaneControllerOf(pane) {
    for (let index = 0; index < this.paneCtrlers.length; index++) {
      const paneCtrler = this.paneCtrlers[index];
      if (paneCtrler.pane === pane) {
        this.view.removePaneViewAt(index);
        this.paneCtrlers.splice(index, 1);
        paneCtrler.destroy();
        break;
      }
    }
  }

  updatePanesInfo() {
    for (let index = 0; index < this.paneCtrlers.length; index++) {
      const paneCtrler = this.paneCtrlers[index];
      if (index === 0 && this.paneCtrlers.length === 1) {
        paneCtrler.setName('Open Files');
      }
      else {
        paneCtrler.setName(`Pane ${index + 1}`);
      }
      paneCtrler.setIndex(index);
    }
  }

  updateItemsTitle() {
    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.updateItemsTitle();
    }
  }

  destroy() {
    this.panesSub.dispose();
    this.itemsSub.dispose();

    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.destroy();
    }
    this.view.destroy();

    if (this.wrapped) {
      // remove wrapper
      this.wrapperElement.removeChild(this.originalElement);
      this.parentElement.replaceChild(
        this.originalElement,
        this.wrapperElement
      );
    }
    this.destroyed = true;
  }

  serialize() {
    return {
      panes: this.paneCtrlers.map(paneCtrler => paneCtrler.serialize())
    };
  }
}
