import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { waf } from "./middleware/waf";

const app: Express = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(waf);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too Many Requests",
    message: "You have exceeded the rate limit. Please try again later.",
  },
});

app.use("/api", apiLimiter);

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
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Serve Expo web build (production) ─────────────────────────────────────────
const publicDir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public");
const hasWebBuild = fs.existsSync(publicDir) && fs.existsSync(path.join(publicDir, "index.html"));

if (hasWebBuild) {
  // Serve static assets (_expo/, assets/, favicon, etc.)
  app.use(express.static(publicDir));

  // SPA fallback — serve index.html for all non-API routes
  app.get(/^(?!\/api).*$/, (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  // No web build present — show API info
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "Pulse API",
      version: "1.0.0",
      status: "ok",
      note: "No web build found. Set EXPO_PUBLIC_DOMAIN and rebuild Docker image to include the web app.",
      endpoints: {
        auth: ["POST /api/auth/register", "POST /api/auth/login", "GET /api/auth/me"],
        posts: ["GET /api/feed", "GET /api/explore", "POST /api/posts"],
        stories: ["GET /api/stories", "POST /api/stories"],
        users: ["GET /api/users/:userId", "POST /api/users/:userId/follow"],
        messages: ["GET /api/conversations", "POST /api/conversations/start"],
        search: ["GET /api/search?q="],
      },
    });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found", message: "Route not found" });
  });
}

export default app;
