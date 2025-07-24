export interface RouletteParams {
  RotationVelocity: number;
}

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
