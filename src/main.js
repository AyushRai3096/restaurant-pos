import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import * as db from './main/db';
import * as ipc from './main/ipc';
import { seedDefaults } from './main/assets';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    backgroundColor: '#1f2733',
    autoHideMenuBar: true,
    title: 'Restaurant POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Avoid the white flash before React has painted.
  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

// The default menu owns Cmd/Ctrl+R for "reload window", which would swallow
// the reports shortcut before the renderer ever sees the keypress. A POS has
// no use for the standard menu anyway.
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  // Database first, then IPC, then the window: the UI must never be able to
  // send a message before there is something ready to answer it.
  // Copy the bundled menu, branding and logo into the user data folder if this
  // is a fresh install, so the app opens ready to use.
  seedDefaults();
  db.init();
  ipc.register();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
