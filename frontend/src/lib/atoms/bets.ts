import type { UserBet } from "../types/bet";
import { atom } from "jotai";

export const betsAtom = atom<UserBet[]>([]);