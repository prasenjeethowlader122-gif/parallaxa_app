import { Router } from "express";
import admin from 'firebase-admin';
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql, or } from "drizzle-orm";
import { generateId, generateToken, hashPassword, comparePassword } from "../lib/auth";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { logger } from "../lib/logger";
import generateTextLogoSVGBase64 from './svg-logo'
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, phoneNumber, password, displayName, dateOfBirth } = req.body;
    if (!username || (!email && !phoneNumber) || !password || !displayName || !dateOfBirth) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }

    const dob = new Date(dateOfBirth);
    const age = new Date().getFullYear() - dob.getFullYear();
    const monthDiff = new Date().getMonth() - dob.getMonth();
    const isUnderage = age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && new Date().getDate() < dob.getDate());

    if (isUnderage) {
      res.status(400).json({ error: "Bad Request", message: "You must be at least 18 years old to register" });
      return;
    }

    if (email) {
      const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "Conflict", message: "Email already in use" });
        return;
      }
    }

    if (phoneNumber) {
      const existingPhone = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phoneNumber, phoneNumber))
        .limit(1);
      if (existingPhone.length > 0) {
        res.status(409).json({ error: "Conflict", message: "Phone number already in use" });
        return;
      }
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
      email: email || null,
      phoneNumber: phoneNumber || null,
      passwordHash,
      displayName,
      avatarUrl: logoSVGBase64,
      dateOfBirth: dob
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
        verificationStatus: user.verificationStatus,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        isPrivate: user.isPrivate,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "register error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Bad Request", message: "Token required" });
      return;
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ error: "Bad Request", message: "Email not provided by Google" });
      return;
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      // Create new user if doesn't exist
      const id = generateId();
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);

      const logoSVGBase64 = generateTextLogoSVGBase64(name || username, {
        width: 1200,
        height: 400,
        fontSize: 140,
        background: '#764abc'
      });

      [user] = await db.insert(usersTable).values({
        id,
        username,
        email,
        passwordHash: 'GOOGLE_AUTH', // Placeholder
        displayName: name || username,
        avatarUrl: picture || logoSVGBase64,
        dateOfBirth: new Date('2000-01-01'), // Default DOB for Google users
      }).returning();
    }

    if (user.isFrozen) {
      res.status(403).json({ error: "Forbidden", message: "Your account has been frozen" });
      return;
    }

    const authToken = generateToken(user.id);
    res.json({
      token: authToken,
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
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        isPrivate: user.isPrivate,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "google auth error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    if ((!email && !phoneNumber) || !password) {
      res.status(400).json({ error: "Bad Request", message: "Contact (email or phone) and password required" });
      return;
    }

    let user;
    if (email) {
      [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    } else if (phoneNumber) {
      [user] = await db.select().from(usersTable).where(eq(usersTable.phoneNumber, phoneNumber)).limit(1);
    }
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    if (user.isFrozen) {
      res.status(403).json({ error: "Forbidden", message: "Your account has been frozen" });
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
        role: user.role,
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
    const otpauth = generateURI({ issuer: "Pulse", label: user.email || user.username, secret });
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
        role: user.role,
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
      verificationStatus: user.verificationStatus,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      isPrivate: user.isPrivate,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "auth/me error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User with this email not found" });
      return;
    }

    const token = generateId(); // Use generateId as a simple reset token
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await db
      .update(usersTable)
      .set({ resetPasswordToken: token, resetPasswordExpires: expires })
      .where(eq(usersTable.id, user.id));

    logger.info({ email, token }, "Password reset token generated");
    res.json({ message: "Password reset link sent to your email (Demo: Token is in server logs)" });
  } catch (err) {
    logger.error({ err }, "forgot-password error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.resetPasswordToken, token))
      .limit(1);

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      res.status(400).json({ error: "Bad Request", message: "Invalid or expired token" });
      return;
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(usersTable)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password reset successful" });
  } catch (err) {
    logger.error({ err }, "reset-password error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/auth/check-username", async (req, res) => {
  try {
    const username = String(req.query.username).toLowerCase();
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    res.json({ available: !existing });
  } catch (err) {
    logger.error({ err }, "check-username error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/auth/suggest-usernames", async (req, res) => {
  try {
    const username = String(req.query.username).toLowerCase();
    const suggestions = [
      `${username}${Math.floor(Math.random() * 1000)}`,
      `${username}_`,
      `the${username}`,
      `${username}official`,
    ];

    // Filter suggestions that are already taken by checking all of them in the DB
    const existing = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(sql`${usersTable.username} IN (${suggestions})`);

    const existingSet = new Set(existing.map((u: { username: string }) => u.username.toLowerCase()));
    const filtered = suggestions.filter((s: string) => !existingSet.has(s));

    res.json({ suggestions: filtered });
  } catch (err) {
    logger.error({ err }, "suggest-usernames error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;