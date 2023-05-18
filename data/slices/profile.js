const { createSlice } = require("@reduxjs/toolkit");

const profile = createSlice({
  name: "profile",
  initialState: {
    profile: "",
  },
  reducers: {
    profile: (state = {}, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});
module.exports = profile;
