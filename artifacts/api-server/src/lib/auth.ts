import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

const DEFAULT_SECRET = "social-app-dev-secret-change-in-production";
const JWT_SECRET = process.env["JWT_SECRET"] ?? DEFAULT_SECRET;
const JWT_EXPIRES_IN = "30d";

if (JWT_SECRET === DEFAULT_SECRET) {
  logger.warn(
    "JWT_SECRET is using the default insecure value. Set JWT_SECRET environment variable in production."
  );
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
