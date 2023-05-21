const questions = window.electronApi.Questions;
const toArabicNumbers = window.electronApi.toArabicNumbers;
const url = window.electronApi.BackendUrl;

const startJourneyBtn = document.getElementById("start-journey-btn");
const captureBtn = document.getElementById("capture-btn");
const toQuestionsBtn = document.getElementById("to-questions-btn");
const toWebcamBtn = document.getElementById("to-webcam-btn");

const genderInput = document.getElementById("gender-input");

const userInfoForm = document.getElementById("user-info-form");

const onsorViewsContainer = document.getElementById("onsor-views-container");

const doneBtn = document.getElementById("done-btn");

const maxViews = 12;

const store = {
  currentView: 2,
  currentQuestion: null,
  takenPhoto: "",
  generatedPhoto: "",
  userInfo: {
    firstName: "",
    lastName: "",
    email: "",
  },
  answers: {},
  generatedPhotoId: "",
  profile: null,
};

const showView = (viewNum) => {
  document.querySelectorAll(".onsorView").forEach((element) => {
    if (element.classList.contains("show")) element.classList.remove("show");
  });

  const viewElement = document.querySelector(
    `.onsorView[data-view="${viewNum}"]`
  );

  if (!viewElement) return;

  viewElement.classList.add("show");
};

startJourneyBtn.addEventListener("click", () => {
  window.electronApi.toNextView();
});

const userInfoKeys = ["firstName", "lastName", "email", "gender"];

console.log("form elements", userInfoForm.elements);

const maleOption = document.querySelector(
  `.genderOption__circle[data-gender="male"]`
);
const femaleOption = document.querySelector(
  `.genderOption__circle[data-gender="female"]`
);

maleOption.addEventListener("click", (e) => {
  femaleOption.classList.remove("selected");
  maleOption.classList.add("selected");

  genderInput.value = "male";
  genderInput.dispatchEvent(new Event("input"));
});

femaleOption.addEventListener("click", (e) => {
  maleOption.classList.remove("selected");
  femaleOption.classList.add("selected");

  genderInput.value = "female";

  genderInput.dispatchEvent(new Event("input"));
});

userInfoKeys.forEach((key) => {
  const formElement = userInfoForm.elements[key];
  formElement.addEventListener("input", (e) => {
    console.log(e.target.name, "changed--->", e.target.value);
    const userInfoValues = userInfoKeys.map((key) => {
      return {
        key,
        value: userInfoForm.elements[key].value,
      };
    });

    console.log("values", userInfoValues);

    const valid = userInfoValues.every((kvPair) => {
      return (
        kvPair.value !== "" &&
        kvPair.value !== null &&
        kvPair.value !== undefined
      );
    });

    console.log("VALID?", valid);

    if (valid) {
      toWebcamBtn.disabled = null;
    } else {
      toWebcamBtn.disabled = true;
    }
  });
});

userInfoForm.onsubmit = (e) => {
  e.preventDefault();
  for (const key in store.userInfo) {
    store.userInfo[key] = e.target.elements[key].value;
  }
  console.log("user info", store.userInfo);
  const userInfo = {};
  for (const key of userInfoKeys) {
    userInfo[key] = e.target.elements[key].value;
  }
  window.electronApi.setUserInfo(userInfo);
  window.electronApi.openWebcam();

  // store.currentView++;
  // window.electronApi.updateView(store);
  // showView(store.currentView);

  window.electronApi.toNextView();
};

captureBtn.addEventListener("click", () => {
  // TODO: Send event to booth screen to start timer
  window.electronApi.startCountdown(store);
  // TODO: Disable buttons while waiting for timer to end
  captureBtn.disabled = true;
});

toQuestionsBtn.addEventListener("click", () => {
  window.electronApi.toNextView();
  // store.currentView = 3;
  // window.electronApi.updateView(store);
  // showView(store.currentView);
});

doneBtn.addEventListener("click", () => {
  // Go back to first view
  // store.currentView = 1;
  // window.electronApi.updateView(store);
  // showView(store.currentView);

  window.electronApi.toView(1);

  // Reset store
  resetStore();

  // Reset views
  // resetViews();
});

const generatePhoto = async (store) => {
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
  window.electronApi.setProfile(json.profile);
  // TODO: Store generated photo(s)
  store.generatedPhotoId = json.id;
  store.profile = json.profile;

  const printRes = await fetch(`${url}/generate_image/${json.id}`);
  const printJson = await printRes.json();

  console.log("gernerate json", printJson);
};

const renderAnswerButtons = () => {
  const answersTemplate = document.getElementById("answers-btns-template");

  const questions = window.electronApi.Questions;
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

        window.electronApi.setAnswer({ questionIndex: qIndex, answerIndex });

        // console.log("taken photo", window.electronApi.getState());
        if (isLastQuestion) {
          console.log("This is last question, store", store);
          // renderGeneratedPhoto(store);
          window.electronApi.getGeneratedPhoto();
        } else {
          if (shouldStartPhotoGen) {
            // TODO: Start generating photo
            window.electronApi.generatePhoto({
              answers: window.electronApi.getAnswers(),
              userInfo: window.electronApi.getUserInfo(),
              takenPhoto: window.electronApi.getOriginalPhoto(),
            });

            // generatePhoto(store);
          } else {
          }
        }
        window.electronApi.toNextView();
        // store.currentView = viewNum + 1;
        // window.electronApi.updateView(store);
        // showView(store.currentView);
      });
    }
    onsorViewsContainer.insertBefore(view, lastView);
    // onsorViewsContainer.appendChild(view);
  });
};

const resetStore = () => {
  // Answers
  questions.forEach((_, i) => {
    store.answers[i] = null;
  });

  // User Info
  for (const key in store.userInfo) {
    store[key] = "";
    // TODO: Uncomment the following
    // userInfoForm.elements[key].value = "";
  }

  // Photos
  store.takenPhoto = "";
  store.generatedPhoto = "";

  window.electronApi.resetBoothViews();
};

const resetViews = () => {
  const cameraIcon = document.getElementById("camera-icon");
  const reloadIcon = document.getElementById("reload-icon");

  cameraIcon.classList.add("show");
  reloadIcon.classList.remove("show");
};

resetStore();
// resetViews();
renderAnswerButtons();
// TODO: Set form inputs to empty after experience ends
