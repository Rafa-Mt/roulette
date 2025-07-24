import { useMutation } from "@tanstack/react-query";
import type { LoginRequest, LoginResponse } from "../../types/api/Login";
import { SimpleFetch } from "../../simplefetch";

const useLogin = () => {
  return useMutation<LoginResponse | undefined, Error, LoginRequest>({
    mutationFn: async (loginData: LoginRequest) => {
      const response = await SimpleFetch.post<LoginResponse>(
        "/api/auth/login",
        loginData
      );
      if ("error" in response) {
        throw response.error;
      }
      return response.data;
    },
  });
};

export default useLogin;

