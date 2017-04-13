'use babel';

import { Disposable, CompositeDisposable } from 'atom';

import WorkingFilesView from './working-files-view.js';
import FileIcons from './file-icons.js';

export default {
  subscriptions: null,

  config: {
    showPendingItems: {
      order      : 1,
      type       : 'boolean',
      default    : true,
      description: 'Show pending items on the tree view.'
    },
    showGitStatus: {
      order      : 2,
      type       : 'boolean',
      default    : true,
      description: 'Show Git statuses of files.'
    }
  },

  controller: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable(
      atom.workspace.addOpener(uri => {
        if (uri === 'atom://working-files') {
          return new WorkingFilesView(state || {});
        }
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        'working-files:toggle': () => this.toggle()
      }),

      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof WorkingFilesView) {
            item.destroy();
          }
        });
      })
    );
  },

  deactivate() {
    this.subscriptions.destroy();
  },

  toggle() {
    atom.workspace.toggle('atom://working-files');
  },

  deserializeWorkingFilesView(serialized) {
    return new WorkingFilesView();
  },

  consumeFileIcons(service) {
    FileIcons.setService(service);
    this.subscriptions.updateItemIcons();
    return new Disposable(() => {
      FileIcons.resetService();
      this.subscriptions.updateItemIcons();
    });
  }

};
