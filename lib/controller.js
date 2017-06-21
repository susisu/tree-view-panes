'use babel';

import { CompositeDisposable } from 'atom';

import View from './view.js';
import PaneController from './pane-controller.js';

export default class Controller {
  constructor(state) {
    this.view = new View();

    this.paneCtrlers = [];

    // create pane-controllers for the existing panes
    this.restorePaneControllers(state.panes);

    // event subscriptions
    this.subscriptions = new CompositeDisposable();

    // panes
    const workspaceCenter = atom.workspace.getCenter();
    this.subscriptions.add(workspaceCenter.onDidAddPane(event => {
      const index = workspaceCenter.getPanes().indexOf(event.pane);
      this.addPaneControllerOf(
        event.pane,
        'Pane',
        index,
        { expanded: true }
      );
      this.updatePaneInfo();
    }));
    this.subscriptions.add(workspaceCenter.onDidDestroyPane(event => {
      this.removePaneControllerOf(event.pane);
      this.updatePaneInfo();
    }));

    // items
    this.subscriptions.add(workspaceCenter.onDidAddPaneItem(() => {
      this.updateItemTitles();
    }));
    this.subscriptions.add(workspaceCenter.onDidDestroyPaneItem(() => {
      this.updateItemTitles();
    }));
  }

  restorePaneControllers(panesState) {
    if (this.paneCtrlers.length > 0) {
      // remove old pane-views and pane-controllers
      this.view.removeAllPaneViews();
      for (const paneCtrler of this.paneCtrlers) {
        paneCtrler.destroy();
      }
      this.paneCtrlers = [];
    }
    const panes = atom.workspace.getCenter().getPanes();
    for (let index = 0; index < panes.length; index++) {
      this.addPaneControllerOf(
        panes[index],
        'Pane',
        index,
        (panesState && panesState[index]) || { expanded: true }
      );
    }
    this.updatePaneInfo();
  }

  getPaneControllerAt(index) {
    return this.paneCtrlers[index];
  }

  findPaneControllerIndexOf(pane) {
    for (let index = 0; index < this.paneCtrlers.length; index++) {
      if (this.paneCtrlers[index].pane === pane) {
        return index;
      }
    }
    return -1;
  }

  addPaneControllerOf(pane, name, index, state) {
    const paneCtrler = new PaneController(this, pane, name, index, state);
    this.paneCtrlers.splice(index, 0, paneCtrler);
    this.view.addPaneViewAt(paneCtrler.view, index);
  }

  removePaneControllerOf(pane) {
    const index = this.findPaneControllerIndexOf(pane);
    if (index < 0) {
      this.restorePaneControllers();
      return;
    }
    const paneCtrler = this.paneCtrlers[index];
    this.view.removePaneViewAt(index);
    this.paneCtrlers.splice(index, 1);
    paneCtrler.destroy();
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

  setItemTooltipPlacement(tooltipPlacement) {
    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.setItemTooltipPlacement(tooltipPlacement);
    }
  }

  destroy() {
    this.subscriptions.dispose();
    for (const paneCtrler of this.paneCtrlers) {
      paneCtrler.destroy();
    }
    this.view.destroy();
  }

  serialize() {
    return {
      panes: this.paneCtrlers.map(paneCtrler => paneCtrler.serialize())
    };
  }
}
