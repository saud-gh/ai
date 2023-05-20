const { configureStore } = require("@reduxjs/toolkit");
const userInfo = require("./slices/userInfo");
const answers = require("./slices/answers");
const photos = require("./slices/photos");
const profile = require("./slices/profile");
const views = require("./slices/views");

const store = configureStore({
  reducer: {
    userInfo: userInfo.reducer,
    answers: answers.reducer,
    photos: photos.reducer,
    profile: profile.reducer,
    views: views.reducer,
  },
});

module.exports = store;
