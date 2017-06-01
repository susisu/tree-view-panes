'use babel';

import { CONFIG_PREFIX } from './constants.js';

export default class ItemView {
  constructor() {
    this.path      = undefined;
    this.status    = undefined;
    this.iconClass = [];

    this.tooltip          = null;
    this.tooltipPlacement = 'auto left';
    this.showTooltips     = atom.config.get(`${CONFIG_PREFIX}showTooltips`);

    this.element = document.createElement('li');
    this.element.setAttribute('draggable', 'true');
    this.element.classList.add('list-item-item', 'list-item');

    this.nameElement = document.createElement('span');
    this.nameElement.classList.add('name', 'icon', ...this.iconClass);

    this.closeButtonElement = document.createElement('div');
    this.closeButtonElement.classList.add('close-button');

    this.element.appendChild(this.closeButtonElement);
    this.element.appendChild(this.nameElement);
  }

  setTitle(title) {
    this.nameElement.textContent = title;
  }

  setName(name) {
    if (name) {
      this.nameElement.setAttribute('data-name', name);
    }
    else {
      this.nameElement.removeAttribute('data-name');
    }
  }

  setPath(path) {
    this.path = path;
    if (this.path) {
      this.nameElement.setAttribute('data-path', this.path);
    }
    else {
      this.nameElement.removeAttribute('data-path');
    }
    this.resetTooltip();
  }

  setModified(modified) {
    if (modified) {
      this.element.classList.add('modified');
    }
    else {
      this.element.classList.remove('modified');
    }
  }

  setShowTooltips(shouldShow) {
    this.showTooltips = shouldShow;
    this.resetTooltip();
  }

  setStatus(status) {
    if (this.status) {
      this.element.classList.remove(this.status);
    }
    this.status = status;
    if (this.status) {
      this.element.classList.add(this.status);
    }
  }

  setIconClass(iconClass) {
    this.nameElement.classList.remove(...this.iconClass);
    this.iconClass = iconClass.slice();
    this.nameElement.classList.add(...this.iconClass);
  }

  setActive(active) {
    if (active) {
      this.element.classList.add('selected');
    }
    else {
      this.element.classList.remove('selected');
    }
  }

  setPending(pending) {
    if (pending) {
      this.element.classList.add('pending-item');
    }
    else {
      this.element.classList.remove('pending-item');
    }
  }

  setVisibility(visibility) {
    if (visibility) {
      this.element.classList.remove('hidden');
    }
    else {
      this.element.classList.add('hidden');
    }
  }

  setDragOver(dragOver) {
    if (dragOver) {
      this.element.classList.add('drag-over');
    }
    else {
      this.element.classList.remove('drag-over');
    }
  }

  setTooltipPlacement(tooltipPlacement) {
    this.tooltipPlacement = tooltipPlacement;
    this.resetTooltip();
  }

  resetTooltip() {
    if (this.tooltip) {
      this.tooltip.dispose();
    }
    if (this.path && this.showTooltips) {
      this.tooltip = atom.tooltips.add(this.element, {
        title    : this.path,
        placement: this.tooltipPlacement
      });
    }
    else {
      this.tooltip = null;
    }
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.dispose();
    }
    this.element.remove();
  }
}
