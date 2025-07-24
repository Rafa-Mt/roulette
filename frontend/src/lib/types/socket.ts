export interface UserChangeEvent {
  users: {
    username: string;
    balance: number;
  }[];
}

export interface RouletteParams {
  RotationVelocity: number;
}

export interface BetData {
  userId: string;
  bets: {
    type: string;
    amount: number;
    number?: number;
  }[];
}

export interface SpinResult {
  winningNumber: number;
  userBalances: {
    userId: string;
    newBalance: number;
  }[];
}

export interface RouletteSpinEvent {
  params: RouletteParams;
  spinId: string;
}
