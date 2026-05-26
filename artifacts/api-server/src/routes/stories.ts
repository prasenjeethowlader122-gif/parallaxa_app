import { Router } from "express";
import { db } from "@workspace/db";
import { storiesTable, storyViewsTable, usersTable, followsTable, storyReactionsTable } from "@workspace/db";
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

    const storyIds = stories.map(s => s.story.id);
    const reactions = storyIds.length > 0
      ? await db.select().from(storyReactionsTable).where(inArray(storyReactionsTable.storyId, storyIds))
      : [];

    type StoryWithContext = typeof storiesTable.$inferSelect & {
      reactions: { emoji: string; count: number }[];
      myReaction: string | null;
      isViewed: boolean;
    }
    const groups: Record<string, { user: typeof usersTable.$inferSelect; stories: StoryWithContext[] }> = {};
    for (const { story, user } of stories) {
      if (!groups[user.id]) groups[user.id] = { user, stories: [] };

      const storyReactions = reactions.filter(r => r.storyId === story.id);
      const myReaction = storyReactions.find(r => r.userId === myId)?.emoji || null;

      const reactionCounts = storyReactions.reduce((acc: Record<string, number>, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {});

      groups[user.id].stories.push({
        ...story,
        reactions: Object.entries(reactionCounts).map(([emoji, count]) => ({ emoji, count })),
        myReaction,
        isViewed: viewedIds.has(story.id)
      });
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
        content: s.content,
        backgroundColor: s.backgroundColor,
        duration: s.duration,
        viewsCount: s.viewsCount,
        reactions: s.reactions,
        myReaction: s.myReaction,
        isViewed: s.isViewed,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
      hasUnviewed: ss.some((s) => !viewedIds.has(s.id)),
    }));

    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/stories", authenticate, async (req: AuthRequest, res) => {
  try {
    const { mediaUrl, mediaType, duration, content, backgroundColor } =
      req.body;
    if (!mediaUrl && !content) {
      res
        .status(400)
        .json({
          error: "Bad Request",
          message: "mediaUrl or content is required",
        });
      return;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const id = generateId();
    const [story] = await db
      .insert(storiesTable)
      .values({
        id,
        userId: req.userId!,
        mediaUrl: mediaUrl ?? null,
        mediaType: mediaType ?? "text",
        content: content ?? null,
        backgroundColor: backgroundColor ?? null,
        duration: duration ?? 5,
        expiresAt,
      })
      .returning();
    res.status(201).json({
      id: story.id,
      userId: story.userId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      content: story.content,
      backgroundColor: story.backgroundColor,
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
    const [story] = await db.select().from(storiesTable).where(eq(storiesTable.id, req.params.storyId as string)).limit(1);
    if (!story || (story.userId !== req.userId && !req.isAdmin)) {
      res.status(404).json({ error: "Not Found", message: "Story not found" });
      return;
    }
    await db.delete(storiesTable).where(eq(storiesTable.id, req.params.storyId as string));
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/stories/:storyId/react", authenticate, async (req: AuthRequest, res) => {
  try {
    const storyId = req.params.storyId as string;
    const { emoji } = req.body;
    const myId = req.userId!;

    if (!emoji) {
      res.status(400).json({ error: "Bad Request", message: "emoji is required" });
      return;
    }

    const [existing] = await db.select().from(storyReactionsTable).where(and(eq(storyReactionsTable.storyId, storyId), eq(storyReactionsTable.userId, myId))).limit(1);

    if (existing) {
      await db.update(storyReactionsTable).set({ emoji }).where(eq(storyReactionsTable.id, existing.id));
    } else {
      await db.insert(storyReactionsTable).values({
        id: generateId(),
        storyId,
        userId: myId,
        emoji
      });
    }

    res.json({ message: "Story reacted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/stories/:storyId/react", authenticate, async (req: AuthRequest, res) => {
  try {
    const storyId = req.params.storyId as string;
    const myId = req.userId!;

    await db.delete(storyReactionsTable).where(and(eq(storyReactionsTable.storyId, storyId), eq(storyReactionsTable.userId, myId)));
    res.json({ message: "Reaction removed" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/stories/:storyId/view", authenticate, async (req: AuthRequest, res) => {
  try {
    const storyId = req.params.storyId as string;
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
