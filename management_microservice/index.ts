import { Server } from "socket.io";



const io = new Server(3000);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.handshake
  });

  // Handle other events here
});

const handleDisconnect = () => {
  console.log("Socket disconnected");
}
