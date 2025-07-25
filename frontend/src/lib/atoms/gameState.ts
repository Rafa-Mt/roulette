import type { GameState } from "../types/game";
import { atom } from "jotai";

export const gameStateAtom = atom<GameState | null>(null);
