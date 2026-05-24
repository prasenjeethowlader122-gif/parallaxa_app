import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { waf } from "./middleware/waf";

const app: Express = express();

// ── Trust proxy (required when behind Replit / Nginx / Cloudflare) ─────────────
app.set("trust proxy", 1);

// ── Security headers ───────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow Expo web
  })
);

// ── CORS ───────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.expo\.dev$/,
  /localhost/,
  /127\.0\.0\.1/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native app, Postman, curl)
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
      if (allowed) return callback(null, true);
      logger.warn({ origin }, "CORS: blocked request from unknown origin");
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── WAF (runs before rate limiting so bad requests don't count toward quota) ───
app.use(waf);

// ── Rate limiting ──────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/healthz",
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please try again later.",
  },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const ip = (forwarded?.split(",")[0].trim()) ?? req.ip ?? "unknown";
    return ipKeyGenerator(ip);
  },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Too many auth attempts. Please wait 15 minutes.",
  },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const ip = (forwarded?.split(",")[0].trim()) ?? req.ip ?? "unknown";
    return ipKeyGenerator(ip);
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Request logging ────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Serve uploads ──────────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Serve Expo web build (production) ─────────────────────────────────────────
const publicDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "public"
);
const hasWebBuild =
  fs.existsSync(publicDir) &&
  fs.existsSync(path.join(publicDir, "index.html"));

if (hasWebBuild) {
  app.use(express.static(publicDir));
  app.get(/^(?!\/api).*$/, (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "Parallaxa API",
      version: "1.0.0",
      status: "ok",
    });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found", message: "Route not found" });
  });
}

export default app;
