'use babel';

import { CompositeDisposable } from 'atom';

import Controller from './controller.js';

export default class Injector {
  constructor(state) {
    this.controller = new Controller(state || {});

    this.treeViewPkg  = null;
    this.treeViewItem = null;

    this.treeViewItemSub = null;

    this.parentElement   = null;
    this.originalElement = null;
    this.wrapperElement  = null;

    if (atom.packages.isPackageActive('tree-view')) {
      this.treeViewPkg = atom.packages.getActivePackage('tree-view');
      if (this.treeViewPkg.mainModule.treeView) {
        this.injectView();
      }
    }

    this.packagesSub = new CompositeDisposable();
    this.packagesSub.add(atom.packages.onDidActivatePackage(pkg => {
      if (pkg.name === 'tree-view') {
        this.treeViewPkg = pkg;
      }
    }));
    this.packagesSub.add(atom.packages.onDidDeactivatePackage(pkg => {
      if (pkg.name === 'tree-view') {
        this.ejectView();
        this.treeViewPkg = null;
      }
    }));

    this.itemsSub = atom.workspace.onDidAddPaneItem(event => {
      if (this.treeViewPkg
        && this.treeViewPkg.mainModule.treeView === event.item) {
        this.injectView();
      }
    });
  }

  injectView() {
    if (!this.treeViewItem) {
      this.treeViewItem    = this.treeViewPkg.mainModule.treeView;
      this.treeViewItemSub = this.treeViewItem.onDidDestroy(() => {
        this.treeViewItemSub.dispose();
        this.treeViewItemSub = null;
        this.ejectView();
      });
      this.parentElement   = this.treeViewItem.element;
      this.originalElement = this.treeViewItem.list;
      this.wrapperElement = document.createElement('div');
      this.wrapperElement.classList.add('tree-view-wrapper');
      this.parentElement.replaceChild(
        this.wrapperElement,
        this.originalElement
      );
      this.wrapperElement.appendChild(this.controller.view.element);
      this.wrapperElement.appendChild(this.originalElement);
    }
  }

  ejectView() {
    if (this.treeViewItem) {
      this.wrapperElement.removeChild(this.originalElement);
      this.parentElement.replaceChild(
        this.originalElement,
        this.wrapperElement
      );
      this.parentElement   = null;
      this.originalElement = null;
      this.wrapperElement  = null;

      this.treeViewItem    = null;
    }
  }

  destroy() {
    this.packagesSub.dispose();
    this.itemsSub.dispose();
    if (this.treeViewItemSub) {
      this.treeViewItemSub.dispose();
    }

    this.ejectView();
    this.treeViewPkg  = null;
  }

  serialize() {
    return this.controller.serialize();
  }
}
