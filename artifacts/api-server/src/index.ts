import app from "./app";
import { createServer } from "http";
import { setupSocket } from "./socket";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
export const io = setupSocket(httpServer);

// Verify DB connection and schema on startup — logs clearly if migrations haven't been run
async function checkDb() {
  try {
    await db.execute(sql`SELECT 1`);
    logger.info("Database connection OK");
  } catch (err) {
    logger.error({ err }, "DATABASE CONNECTION FAILED — check DATABASE_URL and run: pnpm --filter @workspace/db run push");
  }
}

checkDb();

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening with Socket.io");
});
