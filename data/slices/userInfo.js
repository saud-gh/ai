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
  },
  reducers: {
    setUserInfo: (state = {}, action) => {
      console.log("state", action.payload);
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});
module.exports = userInfo;
