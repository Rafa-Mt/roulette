import { useMutation } from "@tanstack/react-query";
import type { LoginRequest, LoginResponse } from "../../types/api/Login";
import type { RegisterRequest, RegisterResponse } from "../../types/api/Register";
import { SimpleFetch } from "../../simplefetch";
import { useSetAtom } from "jotai";
import { userAtom } from "../../atoms/user";
import { authStateAtom } from "../../atoms/authState";
import SocketController from "../../controllers/SocketController";

export const useLogin = (
) => {
  const setUser = useSetAtom(userAtom);
  const setAuthState = useSetAtom(authStateAtom);
  return useMutation<LoginResponse | undefined, Error, LoginRequest>({
    mutationFn: async (loginData: LoginRequest) => {
      const response = await SimpleFetch.post<LoginResponse>(
        "/login",
        loginData
      );
      if ("error" in response) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        setUser({ username: data.username, token: data.token, balance: data.balance });
        localStorage.setItem("token", data.token);
        setAuthState("authenticated");
        console.log("Connecting to socket with token:", data.token);
        SocketController.connectWithToken(data.token);
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials and try again.");
    },
  });
};

export const useRegister = () => {
  const setUser = useSetAtom(userAtom);
  const setAuthState = useSetAtom(authStateAtom);
  return useMutation<RegisterResponse | undefined, Error, RegisterRequest>({
    mutationFn: async (registerData: RegisterRequest) => {
      const response = await SimpleFetch.post<RegisterResponse>(
        "/register",
        registerData
      );
      if ("error" in response) {
        throw response.error;
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        setUser({ username: data.username, token: data.token, balance: data.balance });
        localStorage.setItem("token", data.token);
        setAuthState("authenticated");
        SocketController.connectWithToken(data.token);
      }
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    },
  });
}




