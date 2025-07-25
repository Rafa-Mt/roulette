import { atom } from "jotai";

type AuthState = "login" | "register" | "authenticated";

export const authStateAtom = atom<AuthState>("login");