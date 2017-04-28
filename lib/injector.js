'use babel';

import { CompositeDisposable } from 'atom';

import Controller from './controller.js';
import { CONFIG_PREFIX } from './constants.js';

export default class Injector {
  constructor(state) {
    this.controllerState = state && state.controller;
    this.controller      = null;

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

    // event subscriptions
    this.subscriptions = new CompositeDisposable();

    // packages
    this.subscriptions.add(atom.packages.onDidActivatePackage(pkg => {
      if (pkg.name === 'tree-view') {
        this.treeViewPkg = pkg;
      }
    }));
    this.subscriptions.add(atom.packages.onDidDeactivatePackage(pkg => {
      if (pkg.name === 'tree-view') {
        this.unsetTreeViewItem();
        this.treeViewPkg = null;
      }
    }));

    // items
    this.subscriptions.add(atom.workspace.onDidAddPaneItem(event => {
      if (this.treeViewPkg
        && event.item === this.treeViewPkg.mainModule.treeView) {
        this.setTreeViewItem(this.treeViewPkg.mainModule.treeView);
      }
    }));

    // config
    this.subscriptions.add(atom.config.observe(
      `${CONFIG_PREFIX}injectView`,
      injectView => {
        if (injectView) {
          this.injectView();
        }
        else {
          this.ejectView();
        }
      }
    ));
  }

  setTreeViewItem(treeViewItem) {
    if (!this.treeViewItem) {
      this.treeViewItem    = treeViewItem;
      this.treeViewItemSub = this.treeViewItem.onDidDestroy(() => {
        this.unsetTreeViewItem();
      });
      if (atom.config.get(`${CONFIG_PREFIX}injectView`)) {
        this.injectView();
      }
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
      this.controller = new Controller(this.controllerState || {});

      this.parentElement   = this.treeViewItem.element;
      this.originalElement = this.treeViewItem.list;
      this.wrapperElement  = document.createElement('div');
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

      this.controllerState = this.controller.serialize();
      this.controller      = null;

      this.injected = false;
    }
  }

  updateItemIcons() {
    if (this.controller) {
      this.controller.updateItemIcons();
    }
  }

  destroy() {
    this.subscriptions.dispose();

    this.unsetTreeViewItem();
    this.treeViewPkg  = null;
  }

  serialize() {
    if (this.controller) {
      this.controllerState = this.controller.serialize();
    }
    return {
      controller: this.controllerState
    };
  }
}
