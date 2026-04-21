import { Server } from "socket.io";
import { type Server as HttpServer } from "http";
import { verifyToken } from "./lib/auth";
import { logger } from "./lib/logger";

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    logger.info({ userId, socketId: socket.id }, "Socket connected");

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      logger.info({ userId, conversationId }, "Joined conversation room");
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info({ userId, conversationId }, "Left conversation room");
    });

    socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on("disconnect", () => {
      logger.info({ userId, socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}
