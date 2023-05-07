/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require("electron");
// const Slider = require("./src/Slider.js");

contextBridge.exposeInMainWorld("electronApi", {
  updateView: (store) => ipcRenderer.send("update-view", store),
  takePhoto: () => ipcRenderer.send("take-photo"),
  startCountdown: () => ipcRenderer.send("start-countdown"),
});

const updateCurrentView = (_, store) => {
  console.log("store", store);
  const { currentView } = store;

  document.querySelectorAll(".boothView").forEach((element) => {
    if (element.classList.contains("show")) element.classList.remove("show");
  });

  const viewElement = document.querySelector(
    `.boothView[data-view="${currentView}"]`
  );

  if (!viewElement) return;

  // console.log(viewElement);
  viewElement.classList.add("show");
};

const savePhoto = () => {
  const webcamView = document.getElementById("webcam-view");
  const canvas = document.getElementById("photo-canvas");

  if (!webcamView) return;

  const camViewWidth = webcamView.clientWidth;
  const camViewHeight = webcamView.clientHeight;

  canvas.width = camViewWidth;
  canvas.height = camViewHeight;

  canvas
    .getContext("2d")
    .drawImage(webcamView, 0, 0, camViewWidth, camViewHeight);
  const photoDataUrl = canvas.toDataURL("image/jpeg");

  // TODO: Do something with the photo url data
};

const startCountdown = () => {
  console.log("Countdown started!");
  let secs = 3;
  const countdownElement = document.getElementById("countdown");

  if (!countdownElement) return;

  const interval = setInterval(() => {
    countdownElement.innerText = secs;
    countdownElement.classList.add("show");
    secs--;
    if (secs < 0) {
      clearInterval(interval);
      countdownElement.classList.remove("show");
    }
  }, 1000);
};

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }

  ipcRenderer.on("update-view", updateCurrentView);
  ipcRenderer.on("take-photo", savePhoto);
  ipcRenderer.on("start-countdown", startCountdown);
});
