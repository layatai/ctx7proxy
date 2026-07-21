import { Buffer } from 'node:buffer';

const TRAY_ICON_PNG = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGUlEQVR4nGNgGAXo4D+RmHYGjILRWBgYAAC7vCfZFRU56wAAAABJRU5ErkJggg==';

export const createTrayIcon = (nativeImage, platform = process.platform) => {
  const image = nativeImage.createFromBuffer(Buffer.from(TRAY_ICON_PNG, 'base64'));
  if (image.isEmpty()) throw new Error('Tray icon could not be loaded');
  image.setTemplateImage(platform === 'darwin');
  return image;
};
