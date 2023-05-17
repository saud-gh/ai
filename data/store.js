const { configureStore } = require("@reduxjs/toolkit");
const userInfo = require("./slices/userInfo");
const answers = require("./slices/answers");

const store = configureStore({
  reducer: {
    userInfo: userInfo.reducer,
    answers: answers.reducer,
  },
});

module.exports = store;
