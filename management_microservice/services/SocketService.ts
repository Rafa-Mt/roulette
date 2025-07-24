import { Socket } from "socket.io";
import type { Bet, UserBet } from "../types/bet";
import type { RouletteSpinEvent, SpinResult } from "../types/socket";
import type { GameState } from "../GameLoop";
import RedisService from "./RedisService";
import { Server } from "socket.io";

interface CustomSocket extends Socket {
  userId: number;
  username: string;
}

const PORT = Number(process.env.PORT) || 4000;

export const io = new Server(PORT, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


export class SocketService {

  //   obtiene la apuesta del usuario
  static async getBet(userBets: Bet[], socket: CustomSocket) {
    const newBet: UserBet = {
      userId: socket.userId,
      username: socket.username,
      bet: userBets,
    };

    await RedisService.addBet(newBet);
    const bets = await RedisService.getBets();
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
  static async emitUserBets() {
    const bets = await RedisService.getBets();
    io.emit("USER_BETS", bets);
  }

  static listen() {
    io.on("connection", async (socket: Socket) => {
      const customSocket = socket as CustomSocket;

      console.log("A user connected:", socket.id);

      // Enviar estado actual del juego al usuario que se conecta
      const bets = await RedisService.getBets();
      socket.emit("USER_BETS", bets);

      // Manejar nuevas apuestas
      socket.on("NEW_BET", (userBets: Bet[]) => {
        SocketService.getBet(userBets, customSocket);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }
}
