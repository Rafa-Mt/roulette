import { UserBet } from "./bet";

export interface SpinResult {
  winningNumber: number;
  userBalances: {
    userId: number;
    newBalance: number;
  }[];
}

export interface RouletteSpinEvent {
  rotationVelocity: number;
  spinId: string;
}

export interface UserBetEvent {
  bets: UserBet[];
}
