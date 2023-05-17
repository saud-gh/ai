const { configureStore } = require("@reduxjs/toolkit");
const userInfo = require("./slices/userInfo");
const answers = require("./slices/answers");
const photos = require("./slices/photos");

const store = configureStore({
  reducer: {
    userInfo: userInfo.reducer,
    answers: answers.reducer,
    photos: photos.reducer,
  },
});

module.exports = store;
