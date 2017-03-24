'use babel';

import fs from 'fs-plus';
import path from 'path';

class FileIcons {
  constructor() {
    this.service = null;
  }

  setService(service) {
    this.service = service;
  }

  resetService() {
    this.service = null;
  }

  getIconClassForPath(filePath) {
    return this.service
      ? this.service.iconClassForPath(filePath)
      : defaultIconClassForPath(filePath);
  }
}

// ref: atom/tree-view/blob/master/lib/default-file-icons.coffee
function defaultIconClassForPath(filePath) {
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

const singleton = new FileIcons();
export default singleton;
