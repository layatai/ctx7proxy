import assert from 'node:assert/strict';
import test from 'node:test';
import { createTrayIcon } from '../src/desktop/tray-icon.js';

test('creates a non-empty PNG template image for the macOS menu bar', () => {
  let png;
  let templateValue;
  const image = {
    isEmpty: () => false,
    setTemplateImage: (value) => { templateValue = value; }
  };
  const nativeImage = {
    createFromBuffer: (value) => {
      png = value;
      return image;
    }
  };

  assert.equal(createTrayIcon(nativeImage, 'darwin'), image);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(templateValue, true);
});

test('fails clearly instead of creating an invisible tray item', () => {
  const nativeImage = {
    createFromBuffer: () => ({ isEmpty: () => true })
  };

  assert.throws(() => createTrayIcon(nativeImage, 'darwin'), /Tray icon could not be loaded/);
});
