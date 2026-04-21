import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId, generateToken, hashPassword, comparePassword } from "../lib/auth";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { logger } from "../lib/logger";
import generateTextLogoSVGBase64 from './svg-logo'
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';

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
    const logoSVGBase64 = generateTextLogoSVGBase64(displayName, {
      width: 1200,
      height: 400,
      fontSize: 140,
      background: '#764abc'
    });
    const [user] = await db.insert(usersTable).values({
      id,
      username,
      email,
      passwordHash,
      displayName,
      avatarUrl: logoSVGBase64
    }).returning();
    const token = generateToken(id);
    res.status(201).json({
      token,
      twoFactorRequired: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        website: user.website,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        isPrivate: user.isPrivate,
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
    if (user.twoFactorEnabled) {
      res.json({ twoFactorRequired: true });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      twoFactorRequired: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        website: user.website,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        isPrivate: user.isPrivate,
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

router.post("/auth/2fa/setup", authenticate, async (req: AuthRequest, res) => {
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

    const secret = generateSecret();
    const otpauth = generateURI({ issuer: "Pulse", label: user.email, secret });
    const qrCodeUri = await QRCode.toDataURL(otpauth);

    await db
      .update(usersTable)
      .set({ twoFactorSecret: secret })
      .where(eq(usersTable.id, user.id));

    res.json({ qrCodeUri, secret });
  } catch (err) {
    logger.error({ err }, "2fa/setup error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/2fa/enable", authenticate, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ error: "Bad Request", message: "2FA not set up" });
      return;
    }

    const result = await verify({ token: code, secret: user.twoFactorSecret });
    if (!result.valid) {
      res.status(400).json({ error: "Bad Request", message: "Invalid code" });
      return;
    }

    await db
      .update(usersTable)
      .set({ twoFactorEnabled: true })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    logger.error({ err }, "2fa/enable error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/2fa/disable", authenticate, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      res.status(400).json({ error: "Bad Request", message: "2FA not enabled" });
      return;
    }

    const result = await verify({ token: code, secret: user.twoFactorSecret });
    if (!result.valid) {
      res.status(400).json({ error: "Bad Request", message: "Invalid code" });
      return;
    }

    await db
      .update(usersTable)
      .set({ twoFactorEnabled: false, twoFactorSecret: null })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "2FA disabled successfully" });
  } catch (err) {
    logger.error({ err }, "2fa/disable error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/2fa/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      res.status(401).json({ error: "Unauthorized", message: "2FA not enabled for this user" });
      return;
    }

    const result = await verify({ token: code, secret: user.twoFactorSecret });
    if (!result.valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid code" });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      twoFactorRequired: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        website: user.website,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        isPrivate: user.isPrivate,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "2fa/verify error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
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
      twoFactorEnabled: user.twoFactorEnabled,
      isPrivate: user.isPrivate,
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