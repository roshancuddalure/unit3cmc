import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { buildApp } from "./app";
import { loadEnv } from "./config/env";

const env = loadEnv();
const app = buildApp(env);
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: env.APP_BASE_URL
  }
});

io.on("connection", (socket) => {
  socket.emit("unit3:connected", {
    message: "Realtime notifications are ready."
  });
});

server.listen(env.PORT, () => {
  console.log(`Unit 3 Management System listening on ${env.APP_BASE_URL}`);
});
