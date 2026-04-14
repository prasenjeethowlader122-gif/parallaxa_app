import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable, usersTable, postsTable, likesTable, savedPostsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";

const router = Router();

router.get("/notifications", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const rows = await db
      .select({ notif: notificationsTable, fromUser: usersTable })
      .from(notificationsTable)
      .innerJoin(usersTable, eq(notificationsTable.fromUserId, usersTable.id))
      .where(eq(notificationsTable.userId, myId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit);

    const notifications = await Promise.all(rows.map(async ({ notif, fromUser }) => {
      let post = null;
      if (notif.postId) {
        const [p] = await db.select().from(postsTable).where(eq(postsTable.id, notif.postId)).limit(1);
        if (p) {
          const [liked] = await db.select().from(likesTable).where(eq(likesTable.postId, p.id)).limit(1);
          const [saved] = await db.select().from(savedPostsTable).where(eq(savedPostsTable.postId, p.id)).limit(1);
          post = {
            id: p.id,
            author: { id: fromUser.id, username: fromUser.username, displayName: fromUser.displayName, avatarUrl: fromUser.avatarUrl, isVerified: fromUser.isVerified, isFollowing: false },
            content: p.content, imageUrl: p.imageUrl, videoUrl: p.videoUrl, location: p.location,
            hashtags: [], likesCount: p.likesCount, commentsCount: p.commentsCount,
            isLiked: !!liked, isSaved: !!saved, createdAt: p.createdAt,
          };
        }
      }
      return {
        id: notif.id,
        type: notif.type,
        fromUser: {
          id: fromUser.id,
          username: fromUser.username,
          displayName: fromUser.displayName,
          avatarUrl: fromUser.avatarUrl,
          isVerified: fromUser.isVerified,
          isFollowing: false,
        },
        post,
        commentContent: notif.commentContent,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      };
    }));

    res.json({ notifications, nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/notifications/read", authenticate, async (req: AuthRequest, res) => {
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, req.userId!));
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/notifications/unread-count", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!));
    res.json({ count: Number(result[0]?.count ?? 0) });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
