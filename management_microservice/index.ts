import { Server } from "socket.io";
import { Bet, UserBet } from "../frontend/src/lib/types/bet";
import { RouletteController } from "./RouletteController";
import { GameLoop } from "./GameLoop";

const PORT = Number(process.env.PORT) || 3000;

export const bets: UserBet[] = [];

export const io = new Server(PORT, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Inicializar el controlador de la ruleta
RouletteController.listen();

// Iniciar el game loop automático
GameLoop.start();

console.log(`🎰 Casino Management Server starting on port ${PORT}`);
console.log(`🔌 WebSocket server listening on ws://localhost:${PORT}`);
console.log("🎲 Roulette game ready to accept connections");
console.log("🕒 Game loop started - 30s betting phases");

// Manejo de cierre del servidor
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  GameLoop.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  GameLoop.stop();
  process.exit(0);
});
