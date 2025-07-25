import { RouletteService } from "./services/RouletteService";
import { SocketService } from "./services/SocketService";
import RedisService from "./services/RedisService";
import { DatabaseService } from "./services/DatabaseService";

export interface GameState {
  phase: "BETTING" | "SPINNING" | "RESULTS";
  timeRemaining: number;
  spinId: string;
}

export class GameLoop {
  private static currentState: GameState = {
    phase: "BETTING",
    timeRemaining: 30,
    spinId: "",
  };

  private static bettingTimer: NodeJS.Timeout | null = null;
  private static countdownInterval: NodeJS.Timeout | null = null;
  private static spinTimer: NodeJS.Timeout | null = null;
  private static spinStartTime: number = 0;
  private static actualSpinDuration: number = 0;
  private static isRunning = false;

  // Configuración de tiempos (en segundos)
  private static readonly BETTING_TIME = 30;
  private static readonly SPINNING_TIME = 8; // Default, will be overridden by calculated time
  private static readonly RESULTS_TIME = 5;
  private static readonly MINIMUM_VELOCITY = 0.008;
  private static readonly VELOCITY_DAMPENING = 0.991; // Dampen the velocity each frame

  // Function to calculate spin duration based on velocity
  private static calculateSpinDuration(velocity: number): number {
    // Calculate how many frames it takes for velocity to reach MINIMUM_VELOCITY
    const frames =
      Math.log(this.MINIMUM_VELOCITY / Math.abs(velocity)) /
      Math.log(this.VELOCITY_DAMPENING);
    // Convert frames to milliseconds (assuming 60 FPS)
    return Math.ceil((frames / 60) * 1000);
  }
  static start() {
    if (this.isRunning) {
      console.log("⚠️ Game loop is already running");
      return;
    }

    console.log("🎲 Starting casino game loop...");
    this.isRunning = true;
    this.startBettingPhase();
  }

  static stop() {
    console.log("🛑 Stopping game loop...");
    this.isRunning = false;

    if (this.bettingTimer) clearTimeout(this.bettingTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.spinTimer) clearTimeout(this.spinTimer);
    RedisService.clearBets();
    RedisService.removeAllUserConnections();

    this.bettingTimer = null;
    this.countdownInterval = null;
    this.spinTimer = null;
  }

  static getCurrentState(): GameState {
    return { ...this.currentState };
  }

  // Fase de apuestas (30 segundos)
  private static async startBettingPhase() {
    console.log("💰 BETTING PHASE: Players can place bets");

    this.currentState = {
      phase: "BETTING",
      timeRemaining: this.BETTING_TIME,
      spinId: this.generateSpinId(),
    };

    // Limpiar apuestas anteriores
    await RedisService.clearBets();

    // Emitir nuevo estado a todos los clientes
    SocketService.emitGameState(this.currentState);

    // Iniciar countdown
    this.startCountdown(() => this.startSpinningPhase());
  }

  // Fase de giro (calculated duration based on velocity)
  private static startSpinningPhase() {
    console.log("🌀 SPINNING PHASE: Roulette is spinning");
    const rouletteParams = RouletteService.generateRouletteParams();

    // Calculate actual spin duration based on velocity
    this.actualSpinDuration = this.calculateSpinDuration(
      rouletteParams.rotationVelocity
    );
    this.spinStartTime = Date.now();

    // Set initial time remaining (rounded to nearest second for display)
    const timeRemainingSeconds = Math.ceil(this.actualSpinDuration / 1000);

    this.currentState = {
      phase: "SPINNING",
      timeRemaining: timeRemainingSeconds,
      spinId: this.currentState.spinId,
    };

    // Use the winning number calculated from physics simulation
    const winningNumber = rouletteParams.winningNumber;

    console.log(
      `🎯 Calculated winning number: ${winningNumber} (velocity: ${rouletteParams.rotationVelocity})`
    );

    // Emitir inicio del giro
    SocketService.startSpin({
      rotationVelocity: rouletteParams.rotationVelocity,
      spinId: this.currentState.spinId,
    });

    SocketService.emitGameState(this.currentState);

    // Use precise timeout for actual spin duration
    this.spinTimer = setTimeout(() => {
      this.startResultsPhase(winningNumber);
    }, this.actualSpinDuration);

    // Start countdown for UI updates
    this.startSpinCountdown();
  }

  // Special countdown for spinning phase that calculates remaining time based on elapsed time
  private static startSpinCountdown() {
    // Clear any existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      const elapsed = Date.now() - this.spinStartTime;
      const remaining = Math.max(0, this.actualSpinDuration - elapsed);
      const remainingSeconds = Math.ceil(remaining / 1000);

      // Update time remaining (rounded to nearest second)
      this.currentState.timeRemaining = remainingSeconds;

      // Emit updated state
      SocketService.emitGameState(this.currentState);

      // Stop countdown when spin is complete
      if (remaining <= 0) {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
      }
    }, 1000);
  }

  // Fase de resultados (5 segundos)
  private static async startResultsPhase(winningNumber: number) {
    console.log(`🎯 RESULTS PHASE: Winning number is ${winningNumber}`);

    this.currentState = {
      phase: "RESULTS",
      timeRemaining: this.RESULTS_TIME,
      spinId: this.currentState.spinId,
    };

    // Calcular resultados
    const bets = await RedisService.getBets();
    const spinResults = await RouletteService.calculateSpinResults(
      winningNumber,
      bets
    );

    // Emitir resultados
    await SocketService.emitSpinResult(spinResults);
    await RedisService.clearBets();
    await SocketService.emitUserBets();

    await DatabaseService.updateUserBalances(spinResults);
    await SocketService.emitGameState(this.currentState);

    console.log(
      `💰 ${bets.length} bets processed. Winning number: ${winningNumber}`
    );

    // Iniciar countdown para volver a la fase de apuestas
    this.startCountdown(() => {
      if (this.isRunning) {
        this.startBettingPhase();
      }
    });
  }

  // Sistema de countdown genérico
  private static startCountdown(onComplete: () => void) {
    // Limpiar interval anterior si existe
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.currentState.timeRemaining--;

      // Emitir countdown cada segundo
      SocketService.emitGameState(this.currentState);

      if (this.currentState.timeRemaining <= 0) {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
        onComplete();
      }
    }, 1000);
  }

  // Generar ID único para cada giro
  private static generateSpinId(): string {
    return `spin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Método para obtener estadísticas del juego
  static async getGameStats() {
    const bets = await RedisService.getBets();
    return {
      currentPhase: this.currentState.phase,
      activeBets: bets.length,
      timeRemaining: this.currentState.timeRemaining,
      spinId: this.currentState.spinId,
      isRunning: this.isRunning,
    };
  }
}
