'use babel';

import {CompositeDisposable} from 'atom';
import PaneController from './pane-controller.js';

export default class WorkingFilesView {
  constructor() {
    this.paneViews = [];
    this.paneCtrlers = [];

    this.element = document.createElement('ol');
    this.element.classList.add(
      'working-files',
      'list-tree',
      'has-collapsable-children'
    );
    this.element.tabIndex = -1;

    // create pane-controllers for the existing panes
    const panes = atom.workspace.getCenter().getPanes();
    for (let index = 0; index < panes.length; index++) {
      this.addPaneControllerOf(
        panes[index],
        'Pane',
        index,
        { expanded: true }
      );
    }
    this.updatePaneInfo();

    // pane observation
    this.panesSub = new CompositeDisposable();
    this.panesSub.add(atom.workspace.getCenter().onDidAddPane(event => {
      const index = atom.workspace.getCenter().getPanes().indexOf(event.pane);
      this.addPaneControllerOf(
        event.pane,
        'Pane',
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

  getTitle() {
    // Used by Atom for tab text
    return 'Working Files';
  }

  getDefaultLocation() {
    // This location will be used if the user hasn't overridden it by dragging
    // the item elsewhere.
    // Valid values are "left", "right", "bottom", and "center" (the default).
    return 'left';
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ['left', 'right'];
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return 'atom://working-files';
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {
      deserializer: 'working-files/WorkingFilesView'
    };
  }

  addPaneViewAt(paneView, index) {
    if (this.paneViews[index]) {
      this.element.insertBefore(
        paneView.element,
        this.paneViews[index].element
      );
      this.paneViews.splice(index, 0, paneView);
    }
    else {
      this.element.appendChild(paneView.element);
      this.paneViews.push(paneView);
    }
  }

  getPaneControllerAt(index) {
    return this.paneCtrlers[index];
  }

  addPaneControllerOf(pane, name, index, state) {
    const paneCtrler = new PaneController(this, pane, name, index, state);
    this.paneCtrlers.splice(index, 0, paneCtrler);
    this.addPaneViewAt(paneCtrler.view, index);
  }

  removePaneControllerOf(pane) {
    for (let index = 0; index < this.paneCtrlers.length; index++) {
      const paneCtrler = this.paneCtrlers[index];
      if (paneCtrler.pane === pane) {
        this.removePaneViewAt(index);
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

  removePaneViewAt(index) {
    this.element.removeChild(this.paneViews[index].element);
    this.paneViews.splice(index, 1);
  }

  destroy() {
    this.element.remove();
  }
}
