import { Socket } from "socket.io";
import type { Bet, UserBet } from "../types/bet";
import type { RouletteSpinEvent, SpinResult } from "../types/socket";
import type { GameState } from "../GameLoop";
import RedisService from "./RedisService";
import { Server } from "socket.io";
import { DatabaseService } from "./DatabaseService";

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
    const userInfo = await RedisService.getSessionInfo(socket.handshake.auth.token);
    if (!userInfo) {
      console.error("User session info not found for socket:", socket.id);
      return;
    }
    console.log("User session info:", userInfo);
    const balance = await DatabaseService.getUserBalance(userInfo.userId);
    if (balance === null) {
      console.error("User balance not found for userId:", userInfo.userId);
      return;
    }
    const totalBetAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);
    if (totalBetAmount > balance) {
      console.error("Insufficient balance for userId:", userInfo.userId);
      return;
    }
    const newBet: UserBet = {
      userId: socket.userId,
      username: socket.username,
      bet: userBets,
    };

    console.log("New bet received:", newBet);

    await RedisService.addBet(newBet);
    const bets = await RedisService.getBets();
    io.emit("USER_BETS", bets);
  }

  static async removeBet(userId: number) {
    await RedisService.removeBet(userId);
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
    console.log("spinResult:", spinResult);

    for (const userBalance of spinResult.userBalances) {
      // Emitir el nuevo balance al socket del usuario
      const socketId = await RedisService.getUserConnection(userBalance.userId);
      if (socketId) {
        SocketService.emitNewBalance(socketId, userBalance.newBalance);
      }
    }
  }

  static emitNewBalance(socketId: string, newBalance: number) {
    console.log(`Emitting new balance ${newBalance} to socket ${socketId}`);
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

      console.log("User session info:", user);

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

      socket.on("REMOVE_BET", () => {
        SocketService.removeBet(customSocket.userId);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        RedisService.removeUserConnection(customSocket.userId);
      });
    });
  }
}
