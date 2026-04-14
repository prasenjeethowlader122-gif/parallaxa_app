import { Router } from "express";
import { db } from "@workspace/db";
import { commentsTable, usersTable, postsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";

const router = Router();

router.get("/posts/:postId/comments", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const rows = await db
      .select({ comment: commentsTable, user: usersTable })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt))
      .limit(limit);

    res.json({
      comments: rows.map(({ comment, user }) => ({
        id: comment.id,
        postId: comment.postId,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isFollowing: false,
        },
        content: comment.content,
        parentId: comment.parentId,
        repliesCount: comment.repliesCount,
        createdAt: comment.createdAt,
      })),
      nextCursor: null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/posts/:postId/comments", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    if (!content) {
      res.status(400).json({ error: "Bad Request", message: "Content is required" });
      return;
    }
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
    if (!post) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }
    const id = generateId();
    const [comment] = await db.insert(commentsTable).values({
      id, postId, userId: req.userId!, content, parentId,
    }).returning();

    await db.update(postsTable).set({ commentsCount: sql`${postsTable.commentsCount} + 1` }).where(eq(postsTable.id, postId));

    if (parentId) {
      await db.update(commentsTable).set({ repliesCount: sql`${commentsTable.repliesCount} + 1` }).where(eq(commentsTable.id, parentId));
    }

    if (post.userId !== req.userId) {
      await db.insert(notificationsTable).values({
        id: generateId(),
        userId: post.userId,
        fromUserId: req.userId!,
        type: "comment",
        postId,
        commentId: id,
        commentContent: content.slice(0, 100),
      });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    res.status(201).json({
      id: comment.id,
      postId: comment.postId,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isFollowing: false,
      },
      content: comment.content,
      parentId: comment.parentId,
      repliesCount: comment.repliesCount,
      createdAt: comment.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/comments/:commentId", authenticate, async (req: AuthRequest, res) => {
  try {
    const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, req.params.commentId)).limit(1);
    if (!comment) {
      res.status(404).json({ error: "Not Found", message: "Comment not found" });
      return;
    }
    if (comment.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden", message: "Cannot delete another user's comment" });
      return;
    }
    await db.delete(commentsTable).where(eq(commentsTable.id, req.params.commentId));
    await db.update(postsTable).set({ commentsCount: sql`${postsTable.commentsCount} - 1` }).where(eq(postsTable.id, comment.postId));
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
