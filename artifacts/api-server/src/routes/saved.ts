import { Router } from "express";
import { db } from "@workspace/db";
import { savedPostsTable, postsTable, usersTable, likesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";

const router = Router();

router.get("/saved", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const rows = await db
      .select({ post: postsTable })
      .from(savedPostsTable)
      .innerJoin(postsTable, eq(savedPostsTable.postId, postsTable.id))
      .where(eq(savedPostsTable.userId, myId))
      .orderBy(desc(savedPostsTable.createdAt))
      .limit(limit);

    const posts = await Promise.all(rows.map(async ({ post }) => {
      const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
      const [liked] = await db.select().from(likesTable).where(and(eq(likesTable.userId, myId), eq(likesTable.postId, post.id))).limit(1);
      return {
        id: post.id,
        author: author ? { id: author.id, username: author.username, displayName: author.displayName, avatarUrl: author.avatarUrl, isVerified: author.isVerified, isFollowing: false } : null,
        content: post.content, imageUrl: post.imageUrl, videoUrl: post.videoUrl, location: post.location,
        hashtags: [], likesCount: post.likesCount, commentsCount: post.repliesCount,
        isLiked: !!liked, isSaved: true, createdAt: post.createdAt,
      };
    }));

    res.json({ posts, nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/posts/:postId/save", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const myId = req.userId!;
    const [existing] = await db.select().from(savedPostsTable).where(and(eq(savedPostsTable.userId, myId), eq(savedPostsTable.postId, postId))).limit(1);
    if (!existing) {
      await db.insert(savedPostsTable).values({ id: generateId(), userId: myId, postId });
    }
    res.json({ message: "Post saved" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/posts/:postId/save", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const myId = req.userId!;
    await db.delete(savedPostsTable).where(and(eq(savedPostsTable.userId, myId), eq(savedPostsTable.postId, postId)));
    res.json({ message: "Post unsaved" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
