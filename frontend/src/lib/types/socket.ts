import type { UserBet } from "./bet";

export interface SpinResult {
  winningNumber: number;
  userBalances: {
    userId: string;
    newBalance: number;
  }[];
}

export interface RouletteSpinEvent {
  RotationVelocity: number;
  spinId: string;
}

export interface UserBetEvent {
  bets: UserBet[];
}
