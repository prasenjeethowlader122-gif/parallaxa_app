import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    logger.error({ err }, "Health check DB error");
    res.status(503).json({ status: "error", db: "unreachable", message: String(err) });
  }
});

export default router;
