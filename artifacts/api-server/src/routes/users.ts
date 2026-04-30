import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postsTable, followsTable, storiesTable } from "@workspace/db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { authenticate, optionalAuthenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";
import generateTextLogoSVGBase64 from './svg-logo'

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect, isFollowing = false, isFollowedBy = false) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    website: user.website,
    isVerified: user.isVerified,
    verificationStatus: user.verificationStatus,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt,
    isFollowing,
    isFollowedBy,
  };
}

function formatUserSummary(user: typeof usersTable.$inferSelect, isFollowing = false) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    isFollowing,
  };
}

router.get("/users/suggested", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const alreadyFollowing = db
      .select({ followingId: followsTable.followingId })
      .from(followsTable)
      .where(eq(followsTable.followerId, myId as string));
    
    const users = await db
      .select()
      .from(usersTable)
      .where(
        sql`${usersTable.id} != ${myId} AND ${usersTable.id} NOT IN (${alreadyFollowing})`
      )
      .limit(10);
    
    res.json(users.map((u) => formatUserSummary(u, false)));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/users/verify-request", authenticate, async (req: AuthRequest, res) => {
  try {
    await db
      .update(usersTable)
      .set({ verificationStatus: "pending" })
      .where(eq(usersTable.id, req.userId!));

    res.json({ message: "Verification request submitted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/users/:userId", optionalAuthenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.params.userId as string;
    const myId = req.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    const followingRow = myId ? (await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, myId as string), eq(followsTable.followingId, userId)))
      .limit(1))[0] : null;

    const followedByRow = myId ? (await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, userId), eq(followsTable.followingId, myId)))
      .limit(1))[0] : null;

    const isSelf = myId === userId;
    const isFollowing = !!followingRow;

    const profile = formatUser(user, isFollowing, !!followedByRow);

    // Privacy check
    if (user.isPrivate && !isSelf && !isFollowing && !req.isAdmin) {
      res.json({
        ...profile,
        postsCount: user.postsCount,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        isPrivate: true,
        // Hide sensitive info if needed, or handled by frontend
      });
      return;
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.put("/users/:userId", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    if (userId !== req.userId && !req.isAdmin) {
      res.status(403).json({ error: "Forbidden", message: "Cannot update another user" });
      return;
    }
    const { displayName, bio, website, isPrivate } = req.body;
    let { avatarUrl } = req.body;
    if (displayName && !avatarUrl) { avatarUrl = generateTextLogoSVGBase64(displayName) }
    const [updated] = await db
      .update(usersTable)
      .set({
        displayName,
        bio,
        avatarUrl,
        website,
        isPrivate,
        updatedAt: new Date()
      })
      .where(eq(usersTable.id, userId))
      .returning();
    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/users/:userId/posts", optionalAuthenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.params.userId as string;
    const myId = req.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found" });
    }

    // Privacy check
    if (user.isPrivate && myId !== userId && !req.isAdmin) {
      const [following] = await db
        .select()
        .from(followsTable)
        .where(and(eq(followsTable.followerId, myId as string), eq(followsTable.followingId, userId)))
        .limit(1);

      if (!following) {
        return res.json({ posts: [], nextCursor: null, isPrivate: true });
      }
    }

    // Only fetch top-level posts (no replies)
    const posts = await db
      .select()
      .from(postsTable)
      .where(
        and(
          eq(postsTable.userId, userId),
          eq(postsTable.isArchived, false),
          isNull(postsTable.parentPostId), // exclude replies
        )
      )
      .orderBy(desc(postsTable.createdAt))
      .limit(limit);
    
    // Fetch author info once
    const [author] = [user];
    
    res.json({
      posts: posts.map((p) => ({
        id: p.id,
        author: {
          id: userId,
          username: author?.username ?? "",
          displayName: author?.displayName ?? "",
          avatarUrl: author?.avatarUrl ?? null,
          isVerified: author?.isVerified ?? false,
          isFollowing: false,
        },
        content: p.content,
        imageUrl: p.imageUrl,
        videoUrl: p.videoUrl,
        location: p.location,
        hashtags: [],
        likesCount: p.likesCount,
        commentsCount: p.repliesCount, // repliesCount is the DB field
        repliesCount: p.repliesCount,
        isLiked: false,
        isSaved: false,
        createdAt: p.createdAt,
      })),
      nextCursor: null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/users/:userId/stories", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const now = new Date();
    const stories = await db
      .select()
      .from(storiesTable)
      .where(and(eq(storiesTable.userId, userId), sql`${storiesTable.expiresAt} > ${now}`))
      .orderBy(desc(storiesTable.createdAt));
    res.json(stories.map((s) => ({
      id: s.id,
      userId: s.userId,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      duration: s.duration,
      viewsCount: s.viewsCount,
      isViewed: false,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/users/:userId/followers", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const rows = await db
      .select({ user: usersTable })
      .from(followsTable)
      .innerJoin(usersTable, eq(followsTable.followerId, usersTable.id))
      .where(eq(followsTable.followingId, userId))
      .limit(limit);
    res.json({ users: rows.map((r) => formatUserSummary(r.user)), nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/users/:userId/following", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const rows = await db
      .select({ user: usersTable })
      .from(followsTable)
      .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
      .where(eq(followsTable.followerId, userId))
      .limit(limit);
    res.json({ users: rows.map((r) => formatUserSummary(r.user)), nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/users/:userId/follow", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const myId = req.userId!;
    if (userId === myId) {
      res.status(400).json({ error: "Bad Request", message: "Cannot follow yourself" });
      return;
    }
    const [existing] = await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, myId as string), eq(followsTable.followingId, userId)))
      .limit(1);
    if (!existing) {
      await db.insert(followsTable).values({ id: generateId(), followerId: myId, followingId: userId });
      await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(
        eq(usersTable.id, myId));
      await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} + 1` }).where(
        eq(usersTable.id, userId));
    }
    res.json({ message: "Followed" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/users/:userId/follow", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId as string;
    const myId = req.userId!;
    const [existing] = await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, myId as string), eq(followsTable.followingId, userId)))
      .limit(1);
    if (existing) {
      await db.delete(followsTable).where(and(eq(followsTable.followerId, myId as string), eq(followsTable
        .followingId, userId)));
      await db.update(usersTable)
    .set({ followingCount: sql`GREATEST(${usersTable.followingCount} - 1, 0)` }).where(eq(usersTable
        .id, myId));
      await db.update(usersTable)
    .set({ followersCount: sql`GREATEST(${usersTable.followersCount} - 1, 0)` }).where(eq(usersTable
        .id, userId));
    }
    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;