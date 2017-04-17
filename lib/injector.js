'use babel';

import { CompositeDisposable } from 'atom';

import Controller from './controller.js';

export default class Injector {
  constructor(state) {
    this.controller = new Controller(state || {});

    this.treeViewPkg = null;

    this.treeViewItem    = null;
    this.treeViewItemSub = null;

    this.parentElement   = null;
    this.originalElement = null;
    this.wrapperElement  = null;

    this.injected = false;

    if (atom.packages.isPackageActive('tree-view')) {
      this.treeViewPkg = atom.packages.getActivePackage('tree-view');
      if (this.treeViewPkg.mainModule.treeView) {
        this.setTreeViewItem(this.treeViewPkg.mainModule.treeView);
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
        this.unsetTreeViewItem();
        this.treeViewPkg = null;
      }
    }));

    this.itemsSub = atom.workspace.onDidAddPaneItem(event => {
      if (this.treeViewPkg
        && event.item === this.treeViewPkg.mainModule.treeView) {
        this.setTreeViewItem(this.treeViewPkg.mainModule.treeView);
      }
    });
  }

  setTreeViewItem(treeViewItem) {
    if (!this.treeViewItem) {
      this.treeViewItem    = treeViewItem;
      this.treeViewItemSub = this.treeViewItem.onDidDestroy(() => {
        this.unsetTreeViewItem();
      });
      this.injectView();
    }
  }

  unsetTreeViewItem() {
    if (this.treeViewItem) {
      this.treeViewItemSub.dispose();
      this.ejectView();
      this.treeViewItemSub = null;
      this.treeViewItem    = null;
    }
  }

  injectView() {
    if (this.treeViewItem && !this.injected) {
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
      this.treeViewItem.getPreferredWidth = undefined;
      this.injected = true;
    }
  }

  ejectView() {
    if (this.treeViewItem && this.injected) {
      this.wrapperElement.removeChild(this.originalElement);
      this.parentElement.replaceChild(
        this.originalElement,
        this.wrapperElement
      );
      this.parentElement   = null;
      this.originalElement = null;
      this.wrapperElement  = null;
      delete this.treeViewItem.getPreferredWidth;
      this.injected = false;
    }
  }

  destroy() {
    this.packagesSub.dispose();
    this.itemsSub.dispose();

    this.unsetTreeViewItem();
    this.treeViewPkg  = null;
  }

  serialize() {
    return this.controller.serialize();
  }
}
