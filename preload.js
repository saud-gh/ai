/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require("electron");

const { questions } = require("./constants");
// const Slider = require("./src/Slider.js");

let Store = {};

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
  generatePhoto: (store) => ipcRenderer.send("generate-photo", store),
  // countdownEnded: () => {
  //   const captureBtn = document.getElementById("capture-btn");

  //   if (!captureBtn) return;

  //   captureBtn.disabled = null;
  // },
  updateStore: (store) => {
    Store = { ...store };
  },
  getStore: () => Store,
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
});

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

const onCountdownEnded = (_, store) => {
  const captureBtn = document.getElementById("capture-btn");
  const cameraIcon = document.getElementById("camera-icon");
  const reloadIcon = document.getElementById("reload-icon");

  const answerButtonsViews = document.querySelector(
    `.onsorView[data-view="${3}"]`
  );
  if (!answerButtonsViews) renderAnswerButtons(store);

  const toQuestionsBtn = document.getElementById("to-questions-btn");
  if (!captureBtn || !toQuestionsBtn) return;
  console.log("countdown end", store);
  // Remove disable buttons
  captureBtn.disabled = null;
  toQuestionsBtn.disabled = null;
  // Change the icon
  const { takenPhoto } = store;
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

const renderAnswerButtons = (store) => {
  const answersTemplate = document.getElementById("answers-btns-template");

  // const questions = window.electronApi.Questions;
  // NOTE: You can refactor to display same view as long as the booth screen is showing a question
  (questions || []).forEach((question, qIndex) => {
    const clonedTemplate = answersTemplate.content.cloneNode(true);

    const view = clonedTemplate.querySelector(".onsorView");
    const viewNum = qIndex + window.electronApi.FirstQuestionView;
    view.dataset.view = viewNum;
    // Render question number
    const questionNumEng = clonedTemplate.querySelector(
      ".questionNumber .questionNumber__english"
    );
    questionNumEng.innerText = `Question ${qIndex + 1} / ${questions.length}`;

    const questionNumArab = clonedTemplate.querySelector(
      ".questionNumber .questionNumber__arabic"
    );
    questionNumArab.innerText = `الــسؤال ${toArabicNumbers(
      qIndex + 1
    )} / ${toArabicNumbers(questions.length)}`;

    const lastView = document.getElementById("onsor-last-view");
    lastView.dataset.view =
      window.electronApi.FirstQuestionView + questions.length;

    const answerBtns = clonedTemplate.querySelectorAll(
      ".answerBtns button.answerBtn"
    );

    for (const btn of answerBtns) {
      btn.addEventListener("click", (event) => {
        const answerIndex = Number(event.target.dataset["answerIndex"]);

        const isLastQuestion = qIndex === questions.length - 1;
        const shouldStartPhotoGen =
          qIndex === window.electronApi.PhotoGenQuestionIndex;

        // if (qIndex <= window.electronApi.PhotoGenQuestionIndex)
        store.answers[qIndex] = answerIndex;

        if (isLastQuestion) {
          console.log("This is last question, store", store);
          renderGeneratedPhoto(store);
        } else {
          if (shouldStartPhotoGen) {
            // TODO: Start generating photo
            const newStore = window.electronApi.getStore();
            console.log("new store", newStore);
            window.electronApi.generatePhoto(store);

            // generatePhoto(store);
          } else {
          }
        }
        store.currentView = viewNum + 1;
        window.electronApi.updateView(store);
        showView(store.currentView);
      });
    }
    onsorViewsContainer.insertBefore(view, lastView);
    // onsorViewsContainer.appendChild(view);
  });
};

const savePhoto = (_, store) => {
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

  store.takenPhoto = canvas.toDataURL("image/jpeg");

  // Check if answer button views are rendered

  ipcRenderer.send("countdown-ended", store);

  // TODO: Remove the following after backend is ready
  const originalPhoto = document.getElementById("original-photo");
  originalPhoto.src = store.takenPhoto;
};

const generatePhoto = async (_, store) => {
  console.log("store in generate photo", store);
  const answersObj = store.answers;
  console.log("answersObj", answersObj);
  const answerIndexes = Object.keys(answersObj)
    .map((key) => {
      return answersObj[key];
    })
    .filter((answer) => answer !== null);

  const answers = answerIndexes.map(
    (answerIndex, questionIndex) =>
      questions[questionIndex].answers[answerIndex].english
  );
  console.log("answers", answers);
  const url = "http://192.168.1.180:5000";
  const res = await fetch(url + "/generate_personality", {
    method: "POST",
    body: JSON.stringify({
      traits: answers.join(","),
      photo: store.takenPhoto,
      ...store.userInfo,
    }),
  });

  const json = await res.json();
  console.log("personality json", json);
  // const json = {
  //   id: "Some ID",
  //   profile: "Some Profile",
  // };
  // TODO: Store generated photo(s)
  store.generatedPhotoId = json.id;
  store.profile = json.profile;

  const printRes = await fetch(`${url}/generate_image/${json.id}`);
  const printJson = await printRes.json();

  console.log("gernerate json", printJson);
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
