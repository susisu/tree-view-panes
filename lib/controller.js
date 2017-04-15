'use babel';

import { CompositeDisposable } from 'atom';

import View from './view.js';
import PaneController from './pane-controller.js';
import Constants from './constants.js';

export default class Controller {
  constructor(state) {
    this.view = new View();

    this.paneCtrlers = [];

    // create pane-controllers for the existing panes
    const panes = atom.workspace.getCenter().getPanes();
    for (let index = 0; index < panes.length; index++) {
      this.addPaneControllerOf(
        panes[index],
        Constants.DEFAULT_PANE_TITLE,
        index,
        (state.panes && state.panes[index]) || { expanded: true }
      );
    }
    this.updatePaneInfo();

    // pane observation
    this.panesSub = new CompositeDisposable();
    this.panesSub.add(atom.workspace.getCenter().onDidAddPane(event => {
      const index = atom.workspace.getCenter().getPanes().indexOf(event.pane);
      this.addPaneControllerOf(
        event.pane,
        Constants.DEFAULT_PANE_TITLE,
        index,
        { expanded: true }
      );
      this.updatePaneInfo();
    }));
    this.panesSub.add(atom.workspace.getCenter().onDidDestroyPane(event => {
      this.removePaneControllerOf(event.pane);
      this.updatePaneInfo();
    }));

    // item observation
    this.itemsSub = new CompositeDisposable();
    this.itemsSub.add(atom.workspace.getCenter().onDidAddPaneItem(() => {
      this.updateItemTitles();
    }));
    this.itemsSub.add(atom.workspace.getCenter().onDidDestroyPaneItem(() => {
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
        paneCtrler.setName(Constants.SINGLE_PANE_TITLE);
      }
      else {
        paneCtrler.setName(`${Constants.PANE_TITLE_PREFIX}${index + 1}`);
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

  destroy() {
    this.panesSub.dispose();
    this.itemsSub.dispose();

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
