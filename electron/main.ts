import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import * as statics from "./static";
import path from "node:path";

// 残像防止
app.disableHardwareAcceleration();

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(statics.publicRoot, "vite.svg"),
    webPreferences: {
      preload: statics.preload,
    },
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    show: false,
  });

  const { workArea } = require("electron").screen.getPrimaryDisplay();
  win.setBounds({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
  });
  win.setVisibleOnAllWorkspaces(true);
  // win.setIgnoreMouseEvents(true);

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (statics.VITE_DEV_SERVER_URL) {
    win.loadURL(statics.pageRoot);
  } else {
    win.loadFile(statics.pageRoot);
  }
  win.webContents.openDevTools();
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app
  .whenReady()
  .then(createWindow)
  .then(() => {
    globalShortcut.register("Control+Alt+Z", () => {
      if (win?.isVisible()) {
        win?.webContents.send("ring:close");
        console.log("Control+Alt+Z", "close");
      } else {
        win?.show();
        win?.webContents.send("ring:open");
        console.log("Control+Alt+Z", "open");
      }
    });

    ipcMain.on("ring:opened", () => {
      win?.setIgnoreMouseEvents(false);
      win?.focus();
    });

    ipcMain.on("ring:closed", () => {
      win?.setIgnoreMouseEvents(true);
      win?.hide();
    });
  });
