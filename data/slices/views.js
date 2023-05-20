const { createSlice } = require("@reduxjs/toolkit");

const views = createSlice({
  name: "views",
  initialState: {
    currentView: 1,
  },
  reducers: {
    currentView: (state, action) => {
      return {
        ...state,
        currentView: action.payload,
      };
    },
  },
});
module.exports = views;
