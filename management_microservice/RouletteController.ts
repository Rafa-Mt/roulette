import { Server, Socket } from "socket.io";
import type { Bet, UserBet } from "./types/bet";
import type { RouletteSpinEvent, SpinResult } from "./types/socket";
import { bets } from "./index";

const io = new Server(3000);

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
  static startSpin() {
    io.emit("START_SPIN");
  }

  //   envia resultados del giro de la ruleta
  static sendSpinResult(result: SpinResult) {
    io.emit("SPIN_RESULT", result);
  }
}
