import type { User } from "../types/user";

export const authStorage = {
  getUser: () => {
    const data = localStorage.getItem("user");
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  setAuth: (user: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
  },

  clear: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },
};
