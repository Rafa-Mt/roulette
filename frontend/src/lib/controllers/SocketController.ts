import { io } from "socket.io-client";
import { getDefaultStore } from "jotai";
import { betsAtom } from "../atoms/bets";
import { userAtom } from "../atoms/user";
import { gameStateAtom } from "../atoms/gameState";
import type { Bet, UserBet } from "../types/bet";
import type { GameState, RouletteSpinEvent } from "../types/game";

const SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:50053";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

const store = getDefaultStore();



export default class SocketController {
  static socket = socket;
  static spinStartCallback: ((spinEvent: RouletteSpinEvent) => void) | null =
    null;
  static spinResultCallback: ((winningNumber: number) => void) | null = null;
  static balanceUpdateCallback: ((oldBalance: number, newBalance: number) => void) | null = null;

  static connect() {
    if (!socket.connected) {
      socket.connect();
      SocketController.subscribe();
    }
  }

  static connectWithToken(token: string) {
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
      SocketController.subscribe();
    }
  }

  static disconnect() {
    if (socket.connected) {
      socket.disconnect();
    }
  }

  static handleIncomingBets(bets: UserBet[]) {
    console.log("Received bets from server:", bets);
    store.set(betsAtom, bets);
  }

  static handleGameState(gameState: GameState) {
    store.set(gameStateAtom, gameState);
  }

  static handleSpinStart(spinEvent: RouletteSpinEvent) {
    if (SocketController.spinStartCallback) {
      SocketController.spinStartCallback(spinEvent);
    }
  }

  static handleSpinResult(winningNumber: number) {
    if (SocketController.spinResultCallback) {
      SocketController.spinResultCallback(winningNumber);
    }
  }

  static handleBalanceUpdate(newBalance: number) {
    const currentUser = store.get(userAtom);
    const oldBalance = currentUser ? currentUser.balance : 0;
    if (currentUser) {
      store.set(userAtom, { ...currentUser, balance: newBalance });
    }
    if (SocketController.balanceUpdateCallback) {
      SocketController.balanceUpdateCallback(oldBalance, newBalance);
    }
  }

  static placeBets(bets: Bet[]) {
    if (socket.connected) {
      socket.emit(SocketEvents.NEW_BET, bets);
    }
  }


  static removeBets() {
    if (socket.connected) {
      socket.emit(SocketEvents.REMOVE_BET);
    }
  }


  static setSpinStartCallback(
    callback: (spinEvent: RouletteSpinEvent) => void
  ) {
    SocketController.spinStartCallback = callback;
  }

  static setSpinResultCallback(callback: (winningNumber: number) => void) {
    SocketController.spinResultCallback = callback;
  }

  static setBalanceUpdateCallback(callback: (oldBalance: number, newBalance: number) => void) {
    SocketController.balanceUpdateCallback = callback;
  }

  static subscribe() {
    socket.on(SocketEvents.USER_BETS, SocketController.handleIncomingBets);
    socket.on(SocketEvents.GAME_STATE, SocketController.handleGameState);
    socket.on(SocketEvents.START_SPIN, SocketController.handleSpinStart);
    socket.on(SocketEvents.SPIN_RESULT, SocketController.handleSpinResult);
    socket.on(SocketEvents.NEW_BALANCE, SocketController.handleBalanceUpdate);

  }

  static unsubscribe() {
    socket.off(SocketEvents.USER_BETS, SocketController.handleIncomingBets);
    socket.off(SocketEvents.GAME_STATE, SocketController.handleGameState);
    socket.off(SocketEvents.START_SPIN, SocketController.handleSpinStart);
    socket.off(SocketEvents.SPIN_RESULT, SocketController.handleSpinResult);
    socket.off(SocketEvents.NEW_BALANCE, SocketController.handleBalanceUpdate);
  }
}

const SocketEvents = {
  SPIN_RESULT: "SPIN_RESULT",
  USER_BETS: "USER_BETS",
  START_SPIN: "START_SPIN",
  NEW_BET: "NEW_BET",
  REMOVE_BET: "REMOVE_BET",
  GAME_STATE: "GAME_STATE",
  NEW_BALANCE: "NEW_BALANCE",
} as const;

type SocketEvents = (typeof SocketEvents)[keyof typeof SocketEvents];
