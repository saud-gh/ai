/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require("electron");

const { questions, url } = require("./constants");
const store = require("./data/store");
const userInfoSlice = require("./data/slices/userInfo");
const answersSlice = require("./data/slices/answers");
const photosSlice = require("./data/slices/photos");

// store.subscribe(() => console.log("New State:", store.getState()));

contextBridge.exposeInMainWorld("electronApi", {
  Questions: questions,
  /**
   * The view number of the first question
   */
  FirstQuestionView: 3,
  PhotoGenQuestionIndex: 4, // TODO: Choose a better name for this, please!
  BackendUrl: "http://192.168.1.180:5000", // TODO: Verify
  updateView: (store) => ipcRenderer.send("update-view", store),
  openWebcam: () => ipcRenderer.send("open-webcam"),
  takePhoto: (store) => ipcRenderer.send("take-photo", store),
  startCountdown: (store) => ipcRenderer.send("countdown-started", store),
  resetBoothViews: () => ipcRenderer.send("reset-booth-views"),
  toArabicNumbers: (num) => {
    // TODO: Convert numbers
    const arabicNumbers =
      "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
    return new String(num).replace(/[0123456789]/g, (d) => {
      return arabicNumbers[d];
    });
  },
  setUserInfo: (info) =>
    store.dispatch(userInfoSlice.actions.setUserInfo(info)),
  getUserInfo: () => store.getState().userInfo,
  generatePhoto: (store) => ipcRenderer.send("generate-photo", store),

  setAnswer: (indexes) =>
    store.dispatch(answersSlice.actions.setAnswer(indexes)),
  getAnswers: () => store.getState().answers,

  setOriginalPhoto: (photo) =>
    store.dispatch(photosSlice.actions.originalPhoto(photo)),
  getOriginalPhoto: () => store.getState().photos.originalPhoto,

  setGeneratedPhoto: (photo) =>
    store.dispatch(photosSlice.actions.generatedPhoto(photo)),
  getGeneratedPhoto: () => store.getState().photos.generatedPhoto,

  getState: () => store.getState(),

  getGeneratedPhoto: () => ipcRenderer.send("get-generated-photo"),
});

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }

  ipcRenderer.on("update-view", updateCurrentView);

  ipcRenderer.on("open-webcam", openWebcam);
  ipcRenderer.on("take-photo", savePhoto);

  ipcRenderer.on("countdown-started", startCountdown);
  ipcRenderer.on("countdown-ended", onCountdownEnded);

  ipcRenderer.on("reset-booth-views", resetBoothViews);

  ipcRenderer.on("generate-photo", generatePhoto);

  ipcRenderer.on("get-generated-photo", getGeneratedPhoto);
});

const getBase64StringFromDataURL = (dataURL) =>
  dataURL.replace("data:", "").replace(/^.+,/, "");

const getGeneratedPhoto = async () => {
  setTimeout(async () => {
    console.log("3 MINUTES OVERRRR!!!!");
    const { generatedPhotoId } = store.getState().photos;
    const res = await fetch(`${url}/generated_image/${generatedPhotoId}`);
    const blob = await res.blob();

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = getBase64StringFromDataURL(reader.result);

      const generatedPhoto = document.getElementById("generated-photo");
      generatedPhoto.src = "data:image/jpeg;base64," + base64;
      // TODO: Remove placeholder/loading screen
      // TODO: Add profile
    };
    reader.readAsDataURL(blob);
  }, 180 * 1000);
};

const resetBoothViews = () => {
  const generatedPhoto = document.getElementById("generated-photo");
  generatedPhoto.src = "";

  const originalPhoto = document.getElementById("original-photo");
  originalPhoto.src = "";

  const canvas = document.getElementById("photo-canvas");
  canvas.classList.remove("show");

  const webcamView = document.getElementById("webcam-view");
  webcamView.classList.add("show");
};

const onCountdownEnded = (_, store_) => {
  const captureBtn = document.getElementById("capture-btn");
  const cameraIcon = document.getElementById("camera-icon");
  const reloadIcon = document.getElementById("reload-icon");

  const toQuestionsBtn = document.getElementById("to-questions-btn");
  console.log("countdown end", store.getState().photos);
  if (!captureBtn || !toQuestionsBtn) return;
  // Remove disable buttons
  captureBtn.disabled = null;
  toQuestionsBtn.disabled = null;
  // Change the icon
  const { originalPhoto: takenPhoto } = store.getState().photos;
  if (takenPhoto && takenPhoto !== "") {
    cameraIcon.classList.remove("show");
    reloadIcon.classList.add("show");
  }
};

const updateCurrentView = (_, store) => {
  // console.log("store", store);
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

const savePhoto = (_, store_) => {
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

  // Show taken image & remove webcam video
  canvas.classList.add("show");
  webcamView.classList.remove("show");

  const photo = canvas.toDataURL("image/jpeg");

  store.dispatch(photosSlice.actions.originalPhoto(photo));

  console.log("photo after savePhoto", store.getState().photos);
  ipcRenderer.send("countdown-ended");
  // Check if answer button views are rendered

  // TODO: Remove the following after backend is ready
  const originalPhoto = document.getElementById("original-photo");
  originalPhoto.src = photo;
};

const generatePhoto = async (_, { answers: answersObj, userInfo }) => {
  console.log("state in generate photo", store.getState());

  const answerIndexes = Object.keys(answersObj)
    .map((key) => {
      return answersObj[key];
    })
    .filter((answer) => answer !== null);

  const answers = answerIndexes.map(
    (answerIndex, questionIndex) =>
      questions[questionIndex].answers[answerIndex].english
  );

  const res = await fetch(url + "/generate_personality", {
    method: "POST",
    body: JSON.stringify({
      traits: answers.join(","),
      photo: store.getState().photos.originalPhoto.split(",")[1],
      gender: "Male",
      ...userInfo,
    }),
  });

  const json = await res.json();
  console.log("personality json", json);

  // TODO: Store generated photo(s)
  // store.generatedPhotoId = json.id;
  // store.profile = json.profile;

  const printRes = await fetch(`${url}/generate_image/${json.id}`);
  const printJson = await printRes.json();

  console.log("gernerate json", printJson);

  store.dispatch(photosSlice.actions.generatedPhoto(json.id));
};

const openWebcam = () => {
  const webcamView = document.getElementById("webcam-view");

  let All_mediaDevices = navigator.mediaDevices;
  console.log("media devices", All_mediaDevices);
  if (!All_mediaDevices || !All_mediaDevices.getUserMedia) {
    console.log("getUserMedia() not supported.");
    return;
  }
  All_mediaDevices.getUserMedia({
    audio: false,
    video: true,
  })
    .then(function (vidStream) {
      if ("srcObject" in webcamView) {
        webcamView.srcObject = vidStream;
      } else {
        webcamView.src = window.URL.createObjectURL(vidStream);
      }
      webcamView.onloadedmetadata = function (e) {
        webcamView.play();
      };
    })
    .catch(function (e) {
      console.error(e);
    });
};

const startCountdown = (_, store) => {
  // console.log("Countdown started!");
  let secs = 3;
  const countdownElement = document.getElementById("countdown");

  if (countdownElement) {
    const webcamView = document.getElementById("webcam-view");
    if (!webcamView.classList.contains("show"))
      webcamView.classList.add("show");
    const interval = setInterval(() => {
      countdownElement.innerText = secs;
      countdownElement.classList.add("show");
      secs--;
      if (secs < 0) {
        clearInterval(interval);
        countdownElement.classList.remove("show");

        // savePhoto();

        // Start flash animation
        const flashOverlay = document.getElementById("flash-overlay");
        flashOverlay.classList.add("shutter");

        setTimeout(() => {
          // Take photo & remove flash animation
          flashOverlay.classList.remove("shutter");
          ipcRenderer.send("take-photo", store);
        }, 600);
      }
    }, 1000);
  }
};
