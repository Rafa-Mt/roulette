export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  balance: number;
  token: string;
}