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
  private static isRunning = false;

  // Configuración de tiempos (en segundos)
  private static readonly BETTING_TIME = 30;
  private static readonly SPINNING_TIME = 8;
  private static readonly RESULTS_TIME = 5;

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
    RedisService.clearBets();
    RedisService.removeAllUserConnections();

    this.bettingTimer = null;
    this.countdownInterval = null;
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

  // Fase de giro (8 segundos)
  private static startSpinningPhase() {
    console.log("🌀 SPINNING PHASE: Roulette is spinning");

    this.currentState = {
      phase: "SPINNING",
      timeRemaining: this.SPINNING_TIME,
      spinId: this.currentState.spinId,
    };

    // Generar parámetros del giro
    const rouletteParams = RouletteService.generateRouletteParams();
    const winningNumber = RouletteService.generateWinningNumber();

    // Emitir inicio del giro
    SocketService.startSpin({
      RotationVelocity: rouletteParams.RotationVelocity,
      spinId: this.currentState.spinId,
    });

    SocketService.emitGameState(this.currentState);

    // Iniciar countdown para la fase de giro
    this.startCountdown(() => this.startResultsPhase(winningNumber));
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
    const spinResults = RouletteService.calculateSpinResults(
      winningNumber,
      bets
    );

    // Emitir resultados
    SocketService.emitSpinResult(spinResults);
    DatabaseService.updateUserBalances(spinResults);
    SocketService.emitGameState(this.currentState);

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
