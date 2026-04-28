export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  password: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    role: "REQUESTER" | "STOREKEEPER" | "MANAGER";
  };
}
