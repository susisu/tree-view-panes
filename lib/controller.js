'use babel';

import { CompositeDisposable } from 'atom';

import View from './view.js';
import PaneController from './pane-controller.js';

export default class Controller {
  constructor(state) {
    this.view = new View();

    this.paneCtrlers = [];

    const workspaceCenter = atom.workspace.getCenter();

    // create pane-controllers for the existing panes
    const panes = workspaceCenter.getPanes();
    for (let index = 0; index < panes.length; index++) {
      this.addPaneControllerOf(
        panes[index],
        'Pane',
        index,
        (state.panes && state.panes[index]) || { expanded: true }
      );
    }
    this.updatePaneInfo();

    // event subscriptions
    this.subscriptions = new CompositeDisposable();

    // panes
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
