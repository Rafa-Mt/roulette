import { Server } from "socket.io";
import { Bet, UserBet } from "../frontend/src/lib/types/bet";

export const bets: UserBet[] = [];

const io = new Server(3000);

io.on("connection", (socket) => {
  console.log("A user connected");
});
