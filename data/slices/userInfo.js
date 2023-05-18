const { createSlice } = require("@reduxjs/toolkit");

const ACTIONS = {
  SET_FIELDS: "Set Fields",
};
const userInfo = createSlice({
  name: "userInfo",
  initialState: {
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
  },
  reducers: {
    setUserInfo: (state = {}, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});
module.exports = userInfo;
