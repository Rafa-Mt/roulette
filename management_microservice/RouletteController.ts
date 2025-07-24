import { Socket } from "socket.io";
import type { Bet, UserBet } from "./types/bet";
import type { RouletteSpinEvent, SpinResult } from "./types/socket";
import { bets } from "./index";
import { io } from "./index";
import type { GameState } from "./GameLoop";

interface CustomSocket extends Socket {
  userId: string;
  username: string;
}

export class RouletteController {
  static io = io;

  //   obtiene la apuesta del usuario
  static getBet(userBets: Bet[], socket: CustomSocket) {
    const newBet: UserBet = {
      userId: socket.userId,
      username: socket.username,
      bet: userBets,
    };
    bets.push(newBet);

    io.emit("USER_BETS", bets);
  }

  //   inicia el giro de la ruleta
  static startSpin(rouletteSpinEvent: RouletteSpinEvent) {
    io.emit("START_SPIN", rouletteSpinEvent);
  }

  //   envia resultados del giro de la ruleta
  static sendSpinResult(result: SpinResult) {
    io.emit("SPIN_RESULT", result);
  }

  //   emite el estado actual del juego a todos los clientes
  static emitGameState(gameState: GameState) {
    io.emit("GAME_STATE", gameState);
  }

  //   emite las apuestas actuales a todos los clientes
  static emitUserBets() {
    io.emit("USER_BETS", bets);
  }

  static listen() {
    io.on("connection", (socket: Socket) => {
      const customSocket = socket as CustomSocket;

      console.log("A user connected:", socket.id);

      // Enviar estado actual del juego al usuario que se conecta
      socket.emit("USER_BETS", bets);

      // Manejar nuevas apuestas
      socket.on("NEW_BET", (userBets: Bet[]) => {
        RouletteController.getBet(userBets, customSocket);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }
}
