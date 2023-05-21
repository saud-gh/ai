// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let boothWindow = null;
let onsorWindow = null;

// try {
//   require("electron-reloader")(module);
// } catch (_) {}

function createWindow() {
  // TODO: Change screen settings once ready
  const primaryDisplay = screen.getPrimaryDisplay();
  const priWidth = primaryDisplay.workAreaSize.width;
  const priHeight = primaryDisplay.workAreaSize.height;

  let secWidth;
  let secHeight;
  // console.log("displays", screen.getAllDisplays());
  const secondaryDisplay = screen.getAllDisplays()[1];
  // const secondaryDisplay = null;

  if (secondaryDisplay) {
    secWidth = secondaryDisplay.workAreaSize.width;
    secHeight = secondaryDisplay.workAreaSize.height;
  }

  const onsorWindowOptions = {
    // x: 0,
    // y: 0,
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: secondaryDisplay ? secWidth : priWidth / 2,
    height: secondaryDisplay ? secHeight : priHeight,
  };
  onsorWindow = new BrowserWindow({
    ...onsorWindowOptions,
    webPreferences: {
      // TODO: Change the preload file
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      nodeIntegration: true,
      // contextIsolation: false,
    },
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
  });

  const boothWindowOptions = secondaryDisplay
    ? {
        x: secondaryDisplay.bounds.x,
        y: secondaryDisplay.bounds.y,
        width: secWidth,
        height: secHeight,
      }
    : {
        // TODO: Remove later!!!
        // x: 1280 + priWidth / 2,
        // y: 0,
        x: priWidth / 2,
        y: 0,
        width: priWidth / 2,
        height: priHeight,
      };

  boothWindow = new BrowserWindow({
    ...boothWindowOptions,
    webPreferences: {
      // TODO: Change the preload file
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      nodeIntegration: true,
      // contextIsolation: false,
    },
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
  });

  // onsorWindow.webContents.openDevTools();
  // boothWindow.webContents.openDevTools();

  if (secondaryDisplay) {
    boothWindow.maximize();
    onsorWindow.maximize();
  } else {
  }

  boothWindow.loadFile("booth.html");
  onsorWindow.loadFile("onsor.html");
}

// const handleUpdateSlide = (event, data) => {
//   console.log("data", data);
//   // Update the slide in main window
//   boothWindow.webContents.send("update-slide", data);
//   onsorWindow.webContents.send("update-slide", data);
// };

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.on("update-view", (_, data) => {
    boothWindow.webContents.send("update-view", data);
  });

  ipcMain.on("open-webcam", () => {
    boothWindow.webContents.send("open-webcam");
  });
  ipcMain.on("take-photo", (_, data) => {
    boothWindow.webContents.send("take-photo", data);
  });

  ipcMain.on("countdown-started", (_, data) => {
    boothWindow.webContents.send("countdown-started", data);
  });
  ipcMain.on("countdown-ended", (_, data) => {
    onsorWindow.webContents.send("countdown-ended", data);
  });

  ipcMain.on("reset-booth-views", () => {
    boothWindow.webContents.send("reset-booth-views");
  });

  ipcMain.on("generate-photo", (_, data) => {
    boothWindow.webContents.send("generate-photo", data);
  });

  ipcMain.on("get-generated-photo", (_, data) => {
    boothWindow.webContents.send("get-generated-photo");
  });

  ipcMain.on("show-views", (_, data) => {
    console.log("current view =", data);
    onsorWindow.webContents.send("show-onsor-view", data);
    boothWindow.webContents.send("show-booth-view", data);
  });

  ipcMain.on("reset", (_, data) => {
    onsorWindow.webContents.send("init-onsor");
    boothWindow.webContents.send("init-booth");
  });

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
