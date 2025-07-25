export interface GameState {
  phase: "BETTING" | "SPINNING" | "RESULTS";
  timeRemaining: number;
  spinId: string;
}

export interface RouletteSpinEvent {
  rotationVelocity: number;
  spinId: string;
}
