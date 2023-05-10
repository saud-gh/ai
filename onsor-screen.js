const nextBtn = document.getElementById("next-btn");
const photoBtn = document.getElementById("photo-btn");
const homeBtn = document.getElementById("home-btn");

const captureBtn = document.getElementById("capture-btn");
const toQuestionsBtn = document.getElementById("to-questions-btn");

const userInfoForm = document.getElementById("user-info-form");

const maxViews = 12;

const store = {
  currentView: 1,
  currentQuestion: null,
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

userInfoForm.onsubmit = (e) => {
  e.preventDefault();
  store.currentView = 2;

  window.electronApi.updateView(store);
  showView(store.currentView);
};

captureBtn.addEventListener("click", () => {
  // TODO: Send event to booth screen to start timer
  window.electronApi.startCountdown();
  // TODO: Disable buttons while waiting for timer to end
});

toQuestionsBtn.addEventListener("click", () => {
  store.currentView = 3;

  window.electronApi.updateView(store);
  showView(store.currentView);
});

// TODO: Set form inputs to empty after experience ends

// nextBtn.addEventListener("click", () => {
//   const nextView = store.currentView + 1;

//   if (nextView > maxViews) store.currentView = 1;
//   else store.currentView++;

//   window.electronApi.updateView(store);

//   showView(store.currentView);
// });

// photoBtn.addEventListener("click", () => {
//   window.electronApi.takePhoto();
// });

// homeBtn.addEventListener("click", () => {
//   window.electronApi.updateView({
//     ...store,
//     currentView: 1,
//   });

//   showView(1);
// });
