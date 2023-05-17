const { createSlice } = require("@reduxjs/toolkit");

const photos = createSlice({
  name: "photos",
  initialState: {
    generatedPhotoId: null,
    originalPhoto: "",
  },
  reducers: {
    generatedPhoto: (state, action) => {
      //   console.log("generated photo", action.payload);
      return {
        ...state,
        generatedPhotoId: action.payload,
      };
    },
    originalPhoto: (state, action) => {
      //   console.log("original photo", action.payload);
      return {
        ...state,
        originalPhoto: action.payload,
      };
    },
  },
});
module.exports = photos;
