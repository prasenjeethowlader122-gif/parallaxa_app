import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId, generateToken, hashPassword, comparePassword } from "../lib/auth";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { logger } from "../lib/logger";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password || !displayName) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Conflict", message: "Email already in use" });
      return;
    }
    const existingUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (existingUsername.length > 0) {
      res.status(409).json({ error: "Conflict", message: "Username already taken" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const id = generateId();
    const [user] = await db.insert(usersTable).values({
      id,
      username,
      email,
      passwordHash,
      displayName,
    }).returning();
    const token = generateToken(id);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        website: user.website,
        isVerified: user.isVerified,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "register error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        website: user.website,
        isVerified: user.isVerified,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "login error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/logout", authenticate, (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      website: user.website,
      isVerified: user.isVerified,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "auth/me error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
