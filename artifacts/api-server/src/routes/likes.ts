import { Router } from "express";
import { db } from "@workspace/db";
import { likesTable, postsTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";

const router = Router();

router.post("/posts/:postId/like", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const myId = req.userId!;
    const [existing] = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.userId, myId), eq(likesTable.postId, postId)))
      .limit(1);
    if (!existing) {
      await db.insert(likesTable).values({ id: generateId(), userId: myId, postId });
      await db.update(postsTable).set({ likesCount: sql`${postsTable.likesCount} + 1` }).where(eq(postsTable.id, postId));
      const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
      if (post && post.userId !== myId) {
        await db.insert(notificationsTable).values({
          id: generateId(),
          userId: post.userId,
          fromUserId: myId,
          type: "like",
          postId,
        });
      }
    }
    res.json({ message: "Liked" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/posts/:postId/like", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const myId = req.userId!;
    const [existing] = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.userId, myId), eq(likesTable.postId, postId)))
      .limit(1);
    if (existing) {
      await db.delete(likesTable).where(and(eq(likesTable.userId, myId), eq(likesTable.postId, postId)));
      await db.update(postsTable).set({ likesCount: sql`${postsTable.likesCount} - 1` }).where(eq(postsTable.id, postId));
    }
    res.json({ message: "Unliked" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
