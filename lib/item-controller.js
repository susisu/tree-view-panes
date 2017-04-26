'use babel';

import path from 'path';
import fs from 'fs-plus';
import { CompositeDisposable } from 'atom';

import ItemView from './item-view.js';
import FileIcons from './file-icons.js';
import { CONFIG_PREFIX, COMMAND_PREFIX, DRAG_EVENT_ID } from './constants.js';

export default class ItemController {
  constructor(parent, item, index) {
    this.parent = parent;
    this.item   = item;
    this.index  = index;

    this.destoyed = false;
    this.path     = this.getItemPath();
    this.realpath = this.path;
    this.repo     = null;
    this.pending  = false;

    this.showPending = atom.config.get(`${CONFIG_PREFIX}showPendingItems`);
    this.showStatus  = atom.config.get(`${CONFIG_PREFIX}showGitStatus`);

    this.view = new ItemView(['icon-file']);
    this.updateTitle();
    this.updatePath();
    this.updateIcon();
    this.updateModified();
    this.view.setPending(this.pending);
    this.view.setVisibility(!this.pending || this.showPending);

    // item observation
    this.itemSub = new CompositeDisposable();
    if (typeof this.item.onDidChangeTitle === 'function') {
      this.itemSub.add(this.item.onDidChangeTitle(() => {
        this.parent.parent.updateItemTitles();
      }));
    }
    if (typeof this.item.onDidChangePath === 'function') {
      this.itemSub.add(this.item.onDidChangePath(() => {
        this.path     = this.getItemPath();
        this.realpath = this.path;
        this.updatePath();
        this.updateIcon();
        this.fetchRealpath();
        this.fetchRepo();
      }));
    }
    if (typeof this.item.onDidChangeModified === 'function') {
      this.itemSub.add(this.item.onDidChangeModified(() => {
        this.updateModified();
      }));
    }

    // repository observation
    this.repoSub = null;

    // config observation
    this.configSub = new CompositeDisposable();
    this.configSub.add(atom.config.observe(
      `${CONFIG_PREFIX}showPendingItems`,
      showPendingItems => {
        this.showPending = showPendingItems;
        this.view.setVisibility(!this.pending || this.showPending);
      }
    ));
    this.configSub.add(atom.config.observe(
      `${CONFIG_PREFIX}showGitStatus`,
      showStatus => {
        this.showStatus = showStatus;
        this.updateStatus();
      }
    ));

    // commands observation
    this.commandsSub = new CompositeDisposable();
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}close-item`,
      () => { this.parent.closeItem(this.item); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}close-other-items`,
      () => { this.parent.closeItemsExcept(this.item); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-up`,
      () => { this.parent.pane.splitUp({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-down`,
      () => { this.parent.pane.splitDown({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-left`,
      () => { this.parent.pane.splitLeft({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-right`,
      () => { this.parent.pane.splitRight({ items: this.copyItem() }); }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-up-and-move`,
      () => {
        const pane = this.parent.pane.splitUp();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-down-and-move`,
      () => {
        const pane = this.parent.pane.splitDown();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-left-and-move`,
      () => {
        const pane = this.parent.pane.splitLeft();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));
    this.commandsSub.add(atom.commands.add(
      this.view.element,
      `${COMMAND_PREFIX}split-right-and-move`,
      () => {
        const pane = this.parent.pane.splitRight();
        this.parent.pane.moveItemToPane(this.item, pane, 0);
      }
    ));

    // DOM events
    this.onClick = () => {
      this.parent.activateItem(this.item);
    };
    this.onDragStart = event => {
      event.stopPropagation();
      this.parent.activateItem(this.item);
      // set data
      event.dataTransfer.setData(DRAG_EVENT_ID, 'true');
      event.dataTransfer.setData('sortable-index', this.index);
      event.dataTransfer.setData('from-pane-index', this.parent.index);
      event.dataTransfer.setData('from-window-id', atom.getCurrentWindow().id);
      // set dragging appearance
      event.dataTransfer.effectAllowed = 'move';
      const dragImage = this.view.nameElement.cloneNode(true);
      dragImage.style.position = 'absolute';
      dragImage.style.top      = '0';
      dragImage.style.left     = '0';
      document.body.appendChild(dragImage);
      window.requestAnimationFrame(() => {
        document.body.removeChild(dragImage);
      });
      event.dataTransfer.setDragImage(dragImage, 0, 0);
    };
    this.onDragOver = event => {
      if (!event.dataTransfer.getData(DRAG_EVENT_ID)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(true);
    };
    this.onDragEnter = event => {
      if (!event.dataTransfer.getData(DRAG_EVENT_ID)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(true);
    };
    this.onDragLeave = event => {
      if (!event.dataTransfer.getData(DRAG_EVENT_ID)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(false);
    };
    this.onDrop = event => {
      if (!event.dataTransfer.getData(DRAG_EVENT_ID)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.view.setDragOver(false);
      // get data
      const fromWindowId = parseInt(
        event.dataTransfer.getData('from-window-id')
      );
      const fromPaneIndex = parseInt(
        event.dataTransfer.getData('from-pane-index')
      );
      const fromIndex = parseInt(
        event.dataTransfer.getData('sortable-index')
      );
      // dropping from other window is (currently) not supported
      if (fromWindowId !== atom.getCurrentWindow().id) {
        return;
      }
      // find controllers
      const fromPaneCtrler = this.parent.parent.getPaneControllerAt(
        fromPaneIndex
      );
      if (!fromPaneCtrler) {
        return;
      }
      const itemCtrler = fromPaneCtrler.getItemControllerAt(fromIndex);
      if (!itemCtrler) {
        return;
      }
      // move item
      if (fromPaneCtrler === this.parent && itemCtrler === this) {
        return;
      }
      else {
        const toIndex = fromPaneCtrler === this.parent
          && itemCtrler.index <= this.index
          ? this.index
          : this.index + 1;
        fromPaneCtrler.moveItem(itemCtrler.item, this.parent.pane, toIndex);
      }
    };
    this.onCloseButtonClick = () => {
      this.parent.destroyItem(this.item);
    };
    this.view.element.addEventListener('click', this.onClick);
    this.view.element.addEventListener('dragstart', this.onDragStart);
    this.view.element.addEventListener('dragover', this.onDragOver);
    this.view.element.addEventListener('dragenter', this.onDragEnter);
    this.view.element.addEventListener('dragleave', this.onDragLeave);
    this.view.element.addEventListener('drop', this.onDrop);
    this.view.closeButtonElement.addEventListener(
      'click',
      this.onCloseButtonClick
    );

    // fetch realpath and repository
    this.fetchRealpath();
    this.fetchRepo();
  }

  getItemPath() {
    return typeof this.item.getPath === 'function'
      ? this.item.getPath()
      : undefined;
  }

  fetchRealpath() {
    if (!this.path) {
      return;
    }
    fs.realpath(this.path, {}, (error, realpath) => {
      if (error || this.destoyed) {
        return;
      }
      this.realpath = realpath;
      if (this.path !== this.realpath) {
        this.updateStatus();
      }
    });
  }

  fetchRepo() {
    // discard old repo
    if (this.repo || this.repoSub) {
      this.repoSub.dispose();
      this.repoSub = null;
      this.repo    = null;
    }
    // get new repo
    if (!this.path) {
      return;
    }
    const directories = atom.project.getDirectories();
    for (const directory of directories) {
      if (directory.contains(this.path)) {
        atom.project.repositoryForDirectory(directory).then(repo => {
          if (this.destoyed) {
            return;
          }
          if (!repo) {
            this.updateStatus();
            return;
          }
          this.repo = repo;
          this.updateStatus();
          // repository observation
          this.repoSub = new CompositeDisposable();
          this.repoSub.add(repo.onDidChangeStatus(event => {
            if (event.path === this.path || event.path === this.realpath) {
              this.updateStatus();
            }
          }));
          this.repoSub.add(repo.onDidChangeStatuses(() => {
            this.updateStatus();
          }));
        });
        return;
      }
    }
  }

  setIndex(index) {
    if (index !== this.index) {
      this.view.resetTooltip();
    }
    this.index = index;
  }

  setActive(active) {
    this.view.setActive(active);
  }

  setPending(pending) {
    this.pending = pending;
    this.view.setPending(this.pending);
    this.view.setVisibility(!this.pending || this.showPending);
  }

  updateTitle() {
    const title = typeof this.item.getLongTitle === 'function'
      ? this.item.getLongTitle()
      : typeof this.item.getTitle === 'function'
        ? this.item.getTitle()
        : 'Unknown';
    this.view.setTitle(title);
  }

  updatePath() {
    if (this.path) {
      this.view.setName(path.basename(this.path));
      this.view.setPath(this.path);
    }
    else {
      this.view.setName(undefined);
      this.view.setPath(undefined);
    }
  }

  updateIcon() {
    if (typeof this.item.getIconName === 'function') {
      this.view.setIconClass([`icon-${this.item.getIconName()}`]);
    }
    else {
      if (this.path) {
        const iconClass = FileIcons.getIconClassForPath(this.path);
        if (Array.isArray(iconClass)) {
          this.view.setIconClass(iconClass);
        }
        else {
          this.view.setIconClass(iconClass.toString().split(/\s+/));
        }
      }
      else {
        this.view.setIconClass(['icon-file']);
      }
    }
  }

  updateModified() {
    if (typeof this.item.isModified === 'function') {
      this.view.setModified(this.item.isModified());
    }
    else {
      this.view.setModified(false);
    }
  }

  updateStatus() {
    if (this.showStatus) {
      if (this.repo) {
        if (this.repo.isPathIgnored(this.path)) {
          this.view.setStatus('status-ignored');
        }
        else {
          const status = this.repo.getCachedPathStatus(this.path);
          if (this.repo.isStatusModified(status)) {
            this.view.setStatus('status-modified');
          }
          else if (this.repo.isStatusNew(status)) {
            this.view.setStatus('status-added');
          }
          else {
            this.view.setStatus(undefined);
          }
        }
      }
      else {
        this.view.setStatus(undefined);
      }
    }
    else {
      this.view.setStatus(undefined);
    }
  }

  copyItem() {
    if (typeof this.item.copy === 'function') {
      return [this.item.copy()];
    }
    else if (this.parent.pane.deserializerManager
      && typeof this.item.serialize === 'function') {
      return [
        this.parent.pane.deserializerManager.deserialize(this.item.serialize())
      ];
    }
    else {
      return [];
    }
  }

  destroy() {
    this.itemSub.dispose();
    if (this.repoSub) {
      this.repoSub.dispose();
    }
    this.configSub.dispose();
    this.commandsSub.dispose();
    this.view.element.removeEventListener('click', this.onClick);
    this.view.element.removeEventListener('dragstart', this.onDragStart);
    this.view.element.removeEventListener('dragover', this.onDragOver);
    this.view.element.removeEventListener('dragenter', this.onDragEnter);
    this.view.element.removeEventListener('dragleave', this.onDragLeave);
    this.view.element.removeEventListener('drop', this.onDrop);
    this.view.closeButtonElement.removeEventListener(
      'click',
      this.onCloseButtonClick
    );

    this.view.destroy();

    this.destoyed = true;
  }
}
