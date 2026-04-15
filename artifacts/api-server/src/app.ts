import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Pulse API",
    version: "1.0.0",
    status: "ok",
    docs: "/api/health",
    endpoints: {
      auth: [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/logout",
        "GET  /api/auth/me",
      ],
      users: [
        "GET    /api/users/suggested",
        "GET    /api/users/:userId",
        "PUT    /api/users/:userId",
        "GET    /api/users/:userId/posts",
        "GET    /api/users/:userId/followers",
        "GET    /api/users/:userId/following",
        "POST   /api/users/:userId/follow",
        "DELETE /api/users/:userId/follow",
      ],
      posts: [
        "POST   /api/posts",
        "GET    /api/posts/:postId",
        "DELETE /api/posts/:postId",
        "GET    /api/feed",
        "GET    /api/explore",
      ],
      stories: [
        "GET    /api/stories",
        "POST   /api/stories",
        "DELETE /api/stories/:storyId",
        "POST   /api/stories/:storyId/view",
      ],
      interactions: [
        "POST   /api/posts/:postId/like",
        "DELETE /api/posts/:postId/like",
        "POST   /api/posts/:postId/save",
        "DELETE /api/posts/:postId/save",
        "GET    /api/posts/:postId/comments",
        "POST   /api/posts/:postId/comments",
        "DELETE /api/comments/:commentId",
      ],
      notifications: [
        "GET  /api/notifications",
        "POST /api/notifications/read",
        "GET  /api/notifications/unread-count",
      ],
      messages: [
        "GET  /api/conversations",
        "POST /api/conversations/start",
        "GET  /api/conversations/:conversationId",
        "GET  /api/conversations/:conversationId/messages",
        "POST /api/conversations/:conversationId/messages",
      ],
      search: ["GET /api/search?q=&type=all|users|posts|hashtags"],
      saved: ["GET /api/saved"],
    },
  });
});

app.use("/api", router);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found", message: "Route not found" });
});

export default app;
