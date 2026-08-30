/**
 * THE Hybrid Coach — thin Electron shell.
 * Loads the live coach workspace from Netlify so UI updates ship via deploy
 * (same OTA model as browser) without rebuilding this installer.
 *
 * Does not bundle coach HTML or touch athlete app code.
 */
const { app, BrowserWindow, shell, Menu } = require('electron');

const DEFAULT_COACH_URL = 'https://thehybridsystem.netlify.app/coach.html';
const COACH_ORIGIN = 'https://thehybridsystem.netlify.app';
const COACH_URL = (process.env.HYBRID_COACH_URL || DEFAULT_COACH_URL).trim();

function coachOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function shouldOpenExternally(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (parsed.origin !== coachOrigin(COACH_URL)) return true;
    if (/oauth|authorize|whoop|concept2|supabase/.test(host + path)) return true;
    return false;
  } catch {
    return true;
  }
}

function buildMenu(mainWindow) {
  const template = [
    {
      label: 'Coach',
      submenu: [
        {
          label: 'Reload coach (get latest)',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.reload();
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'THE Hybrid Coach',
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenExternally(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (shouldOpenExternally(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  buildMenu(win);
  win.loadURL(COACH_URL);
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
