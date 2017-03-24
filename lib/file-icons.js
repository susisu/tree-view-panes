'use babel';

import fs from 'fs-plus';
import path from 'path';

class FileIcons {
  constructor() {
    this.service = new DefaultService();
  }

  setService(service) {
    this.service = service;
  }

  resetService() {
    this.service = new DefaultService();
  }

  getIconClassForPath(filePath) {
    return this.service.iconClassForPath(filePath);
  }
}

// ref: atom/tree-view/blob/master/lib/default-file-icons.coffee
class DefaultService {
  constructor() {
  }

  iconClassForPath(filePath) {
    if (fs.isSymbolicLinkSync(filePath)) {
      return 'icon-file-symlink-file';
    }
    if (fs.isReadmePath(filePath)) {
      return 'icon-book';
    }
    const extension = path.extname(filePath);
    if (fs.isCompressedExtension(extension)) {
      return 'icon-file-zip';
    }
    if (fs.isImageExtension(extension)) {
      return 'icon-file-media';
    }
    if (fs.isPdfExtension(extension)) {
      return 'icon-file-pdf';
    }
    if (fs.isBinaryExtension(extension)) {
      return 'icon-file-binary';
    }
    return 'icon-file';
  }
}

const singleton = new FileIcons();
export default singleton;
