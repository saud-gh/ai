const questions = window.electronApi.Questions;
const toArabicNumbers = window.electronApi.toArabicNumbers;

const canvas = document.getElementById("photo-canvas");
const createAnswersHtmlString = (answers) => {
  return answers.reduce((acc, answer, i) => {
    const answerStr = `
    <li class="answer">
      <div class="answer__container" data-answerIndex="${i}">
        <span>${answer.english}</span>
        <span class="arabic-text">${answer.arabic}</span>
      </div>
    </li>
    `;
    return acc + answerStr;
  }, "");
};

const renderQuestionViews = () => {
  const firstQuestionView = window.electronApi.FirstQuestionView;

  const lastView = document.getElementById("onsor-last-view");
  lastView.dataset.view = firstQuestionView + questions.length;

  const questionViewTemplate = document.getElementById(
    "question-view-template"
  );

  if (!questionViewTemplate) return;

  questions.forEach((question, i) => {
    const clonedTemplate = questionViewTemplate.content.cloneNode(true);
    // Set view number
    const view = clonedTemplate.querySelector(".boothView");
    view.dataset.view = i + firstQuestionView;
    // Set question number
    const questionNumEng = clonedTemplate.querySelector(
      ".questionNumber .questionNumber__english"
    );
    questionNumEng.innerText = `Question ${i + 1} / ${questions.length}`;

    const questionNumArab = clonedTemplate.querySelector(
      ".questionNumber .questionNumber__arabic"
    );
    questionNumArab.innerText = `الــسؤال ${toArabicNumbers(
      i + 1
    )} / ${toArabicNumbers(questions.length)}`;
    // Set question text
    const questionTextEng = clonedTemplate.querySelector(
      "h2.question__text.english-text"
    );
    const questionTextArab = clonedTemplate.querySelector(
      "h2.question__text.arabic-text"
    );

    questionTextEng.innerText = question.english;
    questionTextArab.innerText = question.arabic;
    // Create answers list
    const answersList = clonedTemplate.querySelector(".question__answers");

    const answersHtmlStr = createAnswersHtmlString(question.answers);

    answersList.innerHTML = answersHtmlStr;
    const boothViewsContainer = document.getElementById(
      "booth-views-container"
    );
    boothViewsContainer.insertBefore(view, lastView);
  });
};

renderQuestionViews();
