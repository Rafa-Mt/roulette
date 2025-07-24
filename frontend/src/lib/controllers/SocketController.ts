import { io } from "socket.io-client";
import { getDefaultStore } from "jotai";
import { betsAtom } from "../atoms/bets";
import type { Bet, UserBet } from "../types/bet";

const SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:3000";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

const store = getDefaultStore();

export default class SocketController {
  static socket = socket;

  static connect() {
    if (!socket.connected) {
      socket.connect();
    }
  }
  static connectWithToken(token: string) {
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }
  }

  static disconnect() {
    if (socket.connected) {
      socket.disconnect();
    }
  }

  static handleIncomingBets(bets: UserBet[]) {
    const oldBets = store.get(betsAtom);
    const newBets = [...oldBets, ...bets];
    store.set(betsAtom, newBets);
  }

  static placeBet(bet: Bet) {
    if (socket.connected) {
      socket.emit(SocketEvents.NEW_BET, bet);
    }
  }

  static subscribe() {
    SocketController.socket.on(SocketEvents.USER_BETS, SocketController.handleIncomingBets);
  }
}

const SocketEvents = {
  SPIN_RESULT: "SPIN_RESULT",
  USER_BETS: "USER_BETS",
  START_SPIN: "START_SPIN",
  NEW_BET: "NEW_BET",
} as const;

type SocketEvents = typeof SocketEvents[keyof typeof SocketEvents];
