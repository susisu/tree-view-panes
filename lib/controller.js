'use babel';

import { CompositeDisposable } from 'atom';

import View from './view.js';
import PaneController from './pane-controller.js';

export default class Controller {
  constructor(state) {
    this.view = new View();

    this.parentElement   = null;
    this.originalElement = null;
    this.wrapperElement  = null;

    this.viewInjected = false;

    if (atom.packages.isPackageActive('tree-view')) {
      this.injectView();
    }

    this.paneCtrlers = [];

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
    this.updatePaneInfo();

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
      this.updatePaneInfo();
    }));
    this.panesSub.add(atom.workspace.onDidDestroyPane(event => {
      this.removePaneControllerOf(event.pane);
      this.updatePaneInfo();
    }));

    // item observation
    this.itemsSub = new CompositeDisposable();
    this.itemsSub.add(atom.workspace.onDidAddPaneItem(() => {
      this.updateItemTitles();
    }));
    this.itemsSub.add(atom.workspace.onDidDestroyPaneItem(() => {
      this.updateItemTitles();
    }));

    // packages observation
    this.packagesSub = new CompositeDisposable();
    this.packagesSub.add(atom.packages.onDidActivatePackage(pkg => {
      if (pkg.name === 'tree-view') {
        this.injectView();
      }
    }));
    this.packagesSub.add(atom.packages.onDidDeactivatePackage(pkg => {
      if (pkg.name === 'tree-view') {
        this.ejectView();
      }
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

  updatePaneInfo() {
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

  updateItemTitles() {
    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.updateItemTitles();
    }
  }

  updateItemIcons() {
    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.updateItemIcons();
    }
  }

  injectView() {
    if (!this.viewInjected) {
      const pkg = atom.packages.getActivePackage('tree-view');
      if (!pkg) {
        return;
      }
      const tvElement = pkg.mainModule.treeView.element;
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

      this.viewInjected = true;
    }
  }

  ejectView() {
    if (this.viewInjected) {
      this.wrapperElement.removeChild(this.originalElement);
      this.parentElement.replaceChild(
        this.originalElement,
        this.wrapperElement
      );
      this.parentElement   = null;
      this.originalElement = null;
      this.wrapperElement  = null;

      this.viewInjected = false;
    }
  }

  destroy() {
    this.panesSub.dispose();
    this.itemsSub.dispose();
    this.packagesSub.dispose();

    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.destroy();
    }

    this.ejectView();
    this.view.destroy();
  }

  serialize() {
    return {
      panes: this.paneCtrlers.map(paneCtrler => paneCtrler.serialize())
    };
  }
}
