export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  username: string;
  balance: number;
  token: string;
}