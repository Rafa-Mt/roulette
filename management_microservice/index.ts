import { Server } from "socket.io";
import { SocketService } from "./services/SocketService";
import { GameLoop } from "./GameLoop";

// Inicializar el controlador de la ruleta
SocketService.listen();

// Iniciar el game loop automático
GameLoop.start();

console.log(`🎰 Casino Management Server starting on port ${SocketService.PORT}`);
console.log(`🔌 WebSocket server listening on ws://localhost:${SocketService.PORT}`);
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
