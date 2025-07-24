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
  static PORT = PORT;
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
  static async emitSpinResult(spinResult: SpinResult) {
    io.emit("SPIN_RESULT", spinResult.winningNumber);

    for (const userBalance of spinResult.userBalances) {
      // Emitir el nuevo balance al socket del usuario
      const socketId = await RedisService.getUserConnection(userBalance.userId);
      if (socketId) {
        SocketService.emitNewBalance(socketId, userBalance.newBalance);
      }
    }
  }

  static emitNewBalance(socketId: string, newBalance: number) {
    io.to(socketId).emit("NEW_BALANCE", newBalance);
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

      const user = await RedisService.getSessionInfo(customSocket.handshake.auth.token);

      if (!user) {
        console.error("User not found for socket:", socket.id);
        return;
      }

      customSocket.userId = user.userId;
      customSocket.username = user.username;

      RedisService.saveUserConnection(
        customSocket.userId,
        socket.id
      );

      // Enviar estado actual del juego al usuario que se conecta
      const bets = await RedisService.getBets();
      socket.emit("USER_BETS", bets);

      // Manejar nuevas apuestas
      socket.on("NEW_BET", (userBets: Bet[]) => {
        SocketService.getBet(userBets, customSocket);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        RedisService.removeUserConnection(customSocket.userId);
      });
    });
  }
}
