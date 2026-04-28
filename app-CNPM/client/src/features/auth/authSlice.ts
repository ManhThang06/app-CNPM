import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/user";
import { authStorage } from "../../utils/authStorage";

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: authStorage.getUser(),
  token: authStorage.getToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;

      authStorage.setAuth(action.payload.user, action.payload.token);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;

      authStorage.clear();
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
