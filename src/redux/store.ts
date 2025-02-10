// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
  },
});

// Infer RootState and AppDispatch types for usage with useSelector and useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
