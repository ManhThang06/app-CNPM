import axios from "axios";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../types/auth";

const API_URL = "http://localhost:3000/api/auth";

// =============================
// LOGIN
// =============================
export const login = async (data: LoginRequest) => {
  return axios.post<AuthResponse>(`${API_URL}/login`, data);
};

// =============================
// REGISTER
// =============================
export const register = async (data: RegisterRequest) => {
  return axios.post<AuthResponse>(`${API_URL}/register`, data);
};

// =============================
// GET CURRENT USER (JWT)
// =============================
export const getMe = async (token: string) => {
  return axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
