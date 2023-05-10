const webcamView = document.getElementById("webcam-view");
const canvas = document.getElementById("photo-canvas");

const questions = window.electronApi.Questions;

const createAnswersHtmlString = (answers) => {
  return answers.reduce((acc, answer, i) => {
    const answerStr = `
    <li class="answer">
      <button class="btn answer__btn" data-answerIndex="${i}">
        <span>${answer.english}</span>
        <span class="arabic-text">${answer.arabic}</span>
      </button>
    </li>
    `;
    return acc + answerStr;
  }, "");
};

const renderQuestionViews = () => {
  const questionViewTemplate = document.getElementById(
    "question-view-template"
  );

  const firstQuestionView = 3;

  if (!questionViewTemplate) return;

  questions.forEach((question, i) => {
    const clonedTemplate = questionViewTemplate.content.cloneNode(true);
    const view = clonedTemplate.querySelector(".boothView");
    view.dataset.view = i + firstQuestionView;

    const questionTextEng = clonedTemplate.querySelector(
      "h2.question.english-text"
    );
    const questionTextArab = clonedTemplate.querySelector(
      "h2.question.arabic-text"
    );

    questionTextEng.innerText = question.english;
    questionTextArab.innerText = question.arabic;

    const answersList = clonedTemplate.querySelector(".answers");

    const answersHtmlStr = createAnswersHtmlString(question.answers);

    answersList.innerHTML = answersHtmlStr;
    const boothViewsContainer = document.getElementById(
      "booth-views-container"
    );
    boothViewsContainer.appendChild(clonedTemplate);
  });
};

renderQuestionViews();

const openCam = () => {
  let All_mediaDevices = navigator.mediaDevices;
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

openCam();
