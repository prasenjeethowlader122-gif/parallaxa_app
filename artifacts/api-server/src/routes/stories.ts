import { Router } from "express";
import { db } from "@workspace/db";
import { storiesTable, storyViewsTable, usersTable, followsTable } from "@workspace/db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";

const router = Router();

router.get("/stories", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const now = new Date();
    const following = await db.select({ followingId: followsTable.followingId }).from(followsTable).where(eq(followsTable.followerId, myId));
    const userIds = [myId, ...following.map((f) => f.followingId)];

    const stories = await db
      .select({ story: storiesTable, user: usersTable })
      .from(storiesTable)
      .innerJoin(usersTable, eq(storiesTable.userId, usersTable.id))
      .where(and(inArray(storiesTable.userId, userIds), sql`${storiesTable.expiresAt} > ${now}`))
      .orderBy(desc(storiesTable.createdAt));

    const views = await db.select({ storyId: storyViewsTable.storyId }).from(storyViewsTable).where(eq(storyViewsTable.userId, myId));
    const viewedIds = new Set(views.map((v) => v.storyId));

    const groups: Record<string, { user: typeof usersTable.$inferSelect; stories: typeof storiesTable.$inferSelect[] }> = {};
    for (const { story, user } of stories) {
      if (!groups[user.id]) groups[user.id] = { user, stories: [] };
      groups[user.id].stories.push(story);
    }

    const result = Object.values(groups).map(({ user, stories: ss }) => ({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isFollowing: user.id !== myId,
      },
      stories: ss.map((s) => ({
        id: s.id,
        userId: s.userId,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        duration: s.duration,
        viewsCount: s.viewsCount,
        isViewed: viewedIds.has(s.id),
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
      hasUnviewed: ss.some((s) => !viewedIds.has(s.id)),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/stories", authenticate, async (req: AuthRequest, res) => {
  try {
    const { mediaUrl, mediaType, duration } = req.body;
    if (!mediaUrl || !mediaType) {
      res.status(400).json({ error: "Bad Request", message: "mediaUrl and mediaType are required" });
      return;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const id = generateId();
    const [story] = await db.insert(storiesTable).values({
      id,
      userId: req.userId!,
      mediaUrl,
      mediaType,
      duration: duration ?? 5,
      expiresAt,
    }).returning();
    res.status(201).json({
      id: story.id,
      userId: story.userId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      duration: story.duration,
      viewsCount: story.viewsCount,
      isViewed: false,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/stories/:storyId", authenticate, async (req: AuthRequest, res) => {
  try {
    const [story] = await db.select().from(storiesTable).where(eq(storiesTable.id, req.params.storyId)).limit(1);
    if (!story || story.userId !== req.userId) {
      res.status(404).json({ error: "Not Found", message: "Story not found" });
      return;
    }
    await db.delete(storiesTable).where(eq(storiesTable.id, req.params.storyId));
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/stories/:storyId/view", authenticate, async (req: AuthRequest, res) => {
  try {
    const { storyId } = req.params;
    const myId = req.userId!;
    const [existing] = await db.select().from(storyViewsTable).where(and(eq(storyViewsTable.storyId, storyId), eq(storyViewsTable.userId, myId))).limit(1);
    if (!existing) {
      await db.insert(storyViewsTable).values({ id: generateId(), storyId, userId: myId });
      await db.update(storiesTable).set({ viewsCount: sql`${storiesTable.viewsCount} + 1` }).where(eq(storiesTable.id, storyId));
    }
    res.json({ message: "Story viewed" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
