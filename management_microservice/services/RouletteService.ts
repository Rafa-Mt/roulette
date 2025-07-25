import type { Bet, UserBet } from "../types/bet";
import type { SpinResult } from "../types/socket";
import { DatabaseService } from "./DatabaseService";

export interface RouletteParams {
  rotationVelocity: number;
  winningNumber: number; // Add the calculated winning number
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
}

// Roulette wheel configuration (must match frontend)
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const ARC = (Math.PI * 2) / ROULETTE_NUMBERS.length;
const MINIMUM_VELOCITY = 0.008;
const VELOCITY_DAMPENING = 0.991;

export class RouletteService {
  static generateRouletteParams(): RouletteParams {
    const direction = Math.random() > 0.5 ? -1 : 1; // -1 for clockwise, 1 for counterclockwise
    const rotationVelocity = direction * (Math.random() * 0.13 + 0.13);

    // Calculate winning number using same physics as frontend
    const winningNumber = this.calculateWinningNumber(rotationVelocity);

    return {
      rotationVelocity,
      winningNumber,
    };
  }

  // Replicate frontend physics to calculate winning number
  private static calculateWinningNumber(initialVelocity: number): number {
    let wheelRotation = 0;
    let ballRotation = 0;
    let rotationVelocity = initialVelocity;
    let iterations = 0;

    // Simulate the physics loop until velocity drops below minimum
    while (Math.abs(rotationVelocity) >= MINIMUM_VELOCITY) {
      // Apply current velocity to wheel
      wheelRotation += rotationVelocity;
      // Dampen the velocity
      rotationVelocity *= VELOCITY_DAMPENING;
      // Ball rotates in opposite direction with the NEW damped velocity
      ballRotation -= rotationVelocity;
      iterations++;
    }

    // Calculate winning index based on the ball's absolute position relative to the wheel
    // The ball's position minus the wheel's rotation gives the absolute position over the wheel
    const absoluteBallAngle = (ballRotation - wheelRotation) % (Math.PI * 2);
    const positiveAngle = (absoluteBallAngle + Math.PI * 2) % (Math.PI * 2);
    let winningIndex = Math.floor(positiveAngle / ARC);
    if (winningIndex >= ROULETTE_NUMBERS.length) winningIndex = 0;

    const winningNumber = ROULETTE_NUMBERS[winningIndex];

    console.log(
      `🎲 Physics simulation: velocity=${initialVelocity.toFixed(
        4
      )}, iterations=${iterations}, wheelRot=${wheelRotation.toFixed(
        4
      )}, ballRot=${ballRotation.toFixed(4)}, winningNumber=${winningNumber}`
    );

    return winningNumber;
  }

  // Validar token JWT (placeholder - conectar con auth microservice)
  static async validateToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      // TODO: Implementar validación real con el microservicio de auth
      // Ejemplo de cómo sería la llamada al microservicio:
      // const response = await grpcAuthClient.validateToken({ token });
      // return response.user;

      // Por ahora simulamos la validación
      if (token === "valid_token") {
        return {
          userId: "user123",
          username: "testUser",
        };
      }

      if (token && token.length > 10) {
        // Simulación básica para testing
        return {
          userId: `user_${Math.random().toString(36).substr(2, 9)}`,
          username: `user_${token.slice(0, 8)}`,
        };
      }

      return null;
    } catch (error) {
      console.error("Error validating token:", error);
      return null;
    }
  }

  // Procesar apuesta del usuario
  static processUserBet(
    userBets: Bet[],
    userId: number,
    username: string
  ): UserBet {
    // Validar apuestas (montos, límites, etc.)
    const validatedBets = this.validateBets(userBets);

    return {
      userId,
      username,
      bet: validatedBets,
    };
  }

  // Validar apuestas antes de procesarlas
  private static validateBets(bets: Bet[]): Bet[] {
    return bets.filter((bet) => {
      // Validar monto mínimo y máximo
      if (bet.amount <= 0 || bet.amount > 1000) {
        console.warn(`Invalid bet amount: ${bet.amount}`);
        return false;
      }

      // Validar número si es apuesta a número específico
      if (
        bet.type === "number" &&
        (bet.number === undefined || bet.number < 0 || bet.number > 36)
      ) {
        console.warn(`Invalid number bet: ${bet.number}`);
        return false;
      }

      return true;
    });
  }

  // Calcular resultados del giro
  static async calculateSpinResults(
    winningNumber: number,
    allBets: UserBet[]
  ): Promise<SpinResult> {
    const userBalances: { userId: number; newBalance: number }[] = [];

    // Use Promise.all with map instead of forEach to handle async operations
    const balancePromises = allBets.map(async (userBet) => {
      let totalWinnings = 0;
      console.log(
        `Calculating winnings for user ${userBet.userId} with bets:`,
        userBet.bet
      );

      userBet.bet.forEach((bet) => {
        const winnings = this.calculateBetWinnings(bet, winningNumber);
        totalWinnings += winnings;
      });

      const currentBalance =
        (await DatabaseService.getUserBalance(userBet.userId)) || 0;

      return {
        userId: userBet.userId,
        newBalance: currentBalance + totalWinnings,
      };
    });

    // Wait for all balance calculations to complete
    const calculatedBalances = await Promise.all(balancePromises);
    userBalances.push(...calculatedBalances);

    return {
      winningNumber,
      userBalances,
    };
  }

  // Calcular ganancias de una apuesta específica
  private static calculateBetWinnings(bet: Bet, winningNumber: number): number {
    const { type, amount, number } = bet;

    switch (type) {
      case "number":
        return number === winningNumber ? amount * 35 : -amount;

      case "red":
        const redNumbers = [
          1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
        ];
        return redNumbers.includes(winningNumber) ? amount : -amount;

      case "black":
        const blackNumbers = [
          2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
        ];
        return blackNumbers.includes(winningNumber) ? amount : -amount;

      case "green":
        return winningNumber === 0 ? amount * 35 : -amount;

      case "even":
        return winningNumber > 0 && winningNumber % 2 === 0 ? amount : -amount;

      case "odd":
        return winningNumber > 0 && winningNumber % 2 === 1 ? amount : -amount;

      case "1-18":
        return winningNumber >= 1 && winningNumber <= 18 ? amount : -amount;

      case "19-36":
        return winningNumber >= 19 && winningNumber <= 36 ? amount : -amount;

      case "1st 12":
        return winningNumber >= 1 && winningNumber <= 12 ? amount * 2 : -amount;

      case "2nd 12":
        return winningNumber >= 13 && winningNumber <= 24
          ? amount * 2
          : -amount;

      case "3rd 12":
        return winningNumber >= 25 && winningNumber <= 36
          ? amount * 2
          : -amount;

      case "col1":
        return winningNumber > 0 && winningNumber % 3 === 1
          ? amount * 2
          : -amount;

      case "col2":
        return winningNumber > 0 && winningNumber % 3 === 2
          ? amount * 2
          : -amount;

      case "col3":
        return winningNumber > 0 && winningNumber % 3 === 0
          ? amount * 2
          : -amount;

      default:
        return -amount;
    }
  }
}
