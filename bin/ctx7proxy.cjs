#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron');

const appDirectory = path.resolve(__dirname, '..');
const child = spawn(electron, [appDirectory], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true
});

child.unref();
