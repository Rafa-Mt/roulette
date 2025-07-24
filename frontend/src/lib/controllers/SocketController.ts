import { io } from "socket.io-client";
import { queryClient } from "../../main";
import type { UserChangeEvent } from "../types/socket";

const SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:3000";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

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

  static handleUserConnectedEvent(event: UserChangeEvent) {
    const oldUsers = queryClient.getQueryData<UserChangeEvent>(["users"]) || { users: [] };
  }

  static on(event: string, callback: (...args: any[]) => void) {
    socket.on(event, callback);
  }

  static emit(event: string, ...args: any[]) {
    socket.emit(event, ...args);
  }

  static off(event: string, callback?: (...args: any[]) => void) {
    socket.off(event, callback);
  }
}
