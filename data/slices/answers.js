const { createSlice } = require("@reduxjs/toolkit");

const answers = createSlice({
  name: "answers",
  initialState: {},
  reducers: {
    setAnswer: (state, action) => {
      console.log("answers", action.payload);
      const { questionIndex, answerIndex } = action.payload;
      return {
        ...state,
        [questionIndex]: answerIndex,
      };
    },
  },
});
module.exports = answers;
