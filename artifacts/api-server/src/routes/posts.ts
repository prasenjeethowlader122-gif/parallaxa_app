import { Router } from "express";
import { db } from "@workspace/db";
import {
  postsTable, usersTable, likesTable, savedPostsTable,
  followsTable, hashtagsTable, postHashtagsTable
} from "@workspace/db";
import { eq, and, desc, inArray, sql, isNull, isNotNull } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";

const router = Router();

async function formatPost(post: typeof postsTable.$inferSelect, myId: string) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
  const [liked] = await db.select().from(likesTable).where(and(eq(likesTable.userId, myId), eq(likesTable.postId, post.id))).limit(1);
  const [saved] = await db.select().from(savedPostsTable).where(and(eq(savedPostsTable.userId, myId), eq(savedPostsTable.postId, post.id))).limit(1);
  const hashtagRows = await db
    .select({ name: hashtagsTable.name })
    .from(postHashtagsTable)
    .innerJoin(hashtagsTable, eq(postHashtagsTable.hashtagId, hashtagsTable.id))
    .where(eq(postHashtagsTable.postId, post.id));

  return {
    id: post.id,
    author: {
      id: author?.id ?? post.userId,
      username: author?.username ?? "",
      displayName: author?.displayName ?? "",
      avatarUrl: author?.avatarUrl ?? null,
      isVerified: author?.isVerified ?? false,
      isFollowing: false,
    },
    parentPostId: post.parentPostId ?? null,
    content: post.content,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    location: post.location,
    hashtags: hashtagRows.map((h) => h.name),
    likesCount: post.likesCount,
    repliesCount: post.repliesCount,
    isLiked: !!liked,
    isSaved: !!saved,
    createdAt: post.createdAt,
  };
}

// Create a post or a comment/reply (if parentPostId is provided)
router.post("/posts", authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, imageUrl, videoUrl, location, hashtags, parentPostId } = req.body;
    
    // If parentPostId provided, verify parent exists
    if (parentPostId) {
      const [parent] = await db.select().from(postsTable).where(eq(postsTable.id, parentPostId)).limit(1);
      if (!parent) {
        res.status(404).json({ error: "Not Found", message: "Parent post not found" });
        return;
      }
    }

    const id = generateId();
    const [post] = await db.insert(postsTable).values({
      id,
      userId: req.userId!,
      parentPostId: parentPostId ?? null,
      content,
      imageUrl: parentPostId ? null : imageUrl,
      videoUrl: parentPostId ? null : videoUrl,
      location: parentPostId ? null : location,
    }).returning();

    // If it's a reply/comment, increment parent's repliesCount
    if (parentPostId) {
      await db.update(postsTable)
        .set({ repliesCount: sql`${postsTable.repliesCount} + 1` })
        .where(eq(postsTable.id, parentPostId));

      // Notify parent post author
      const [parent] = await db.select().from(postsTable).where(eq(postsTable.id, parentPostId)).limit(1);
      if (parent && parent.userId !== req.userId) {
        const { notificationsTable } = await import("@workspace/db");
        await db.insert(notificationsTable).values({
          id: generateId(),
          userId: parent.userId,
          fromUserId: req.userId!,
          type: "comment",
          postId: parentPostId,
          commentId: id,
          commentContent: content?.slice(0, 100),
        });
      }
    } else {
      // Only increment postsCount for top-level posts
      await db.update(usersTable).set({ postsCount: sql`${usersTable.postsCount} + 1` }).where(eq(usersTable.id, req.userId!));
      
      // Handle hashtags for top-level posts only
      if (hashtags?.length) {
        for (const tag of hashtags) {
          const name = tag.toLowerCase().replace(/^#/, "");
          const [existing] = await db.select().from(hashtagsTable).where(eq(hashtagsTable.name, name)).limit(1);
          const hashtagId = existing?.id ?? generateId();
          if (!existing) {
            await db.insert(hashtagsTable).values({ id: hashtagId, name, postCount: 1 });
          } else {
            await db.update(hashtagsTable).set({ postCount: sql`${hashtagsTable.postCount} + 1` }).where(eq(hashtagsTable.id, hashtagId));
          }
          await db.insert(postHashtagsTable).values({ postId: id, hashtagId });
        }
      }
    }

    const formatted = await formatPost(post, req.userId!);
    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Get a single post by ID
router.get("/posts/:postId", authenticate, async (req: AuthRequest, res) => {
  try {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, req.params.postId)).limit(1);
    if (!post) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }
    res.json(await formatPost(post, req.userId!));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Get replies/comments of a post
router.get("/posts/:postId/replies", authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [parent] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
    if (!parent) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }

    const replies = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.parentPostId, postId), eq(postsTable.isArchived, false)))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit);

    const formatted = await Promise.all(replies.map((p) => formatPost(p, req.userId!)));
    res.json({ posts: formatted, nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Delete a post (or comment/reply)
router.delete("/posts/:postId", authenticate, async (req: AuthRequest, res) => {
  try {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, req.params.postId)).limit(1);
    if (!post) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }
    if (post.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden", message: "Cannot delete another user's post" });
      return;
    }

    await db.delete(postsTable).where(eq(postsTable.id, req.params.postId));

    if (post.parentPostId) {
      // Decrement parent's repliesCount
      await db.update(postsTable)
        .set({ repliesCount: sql`${postsTable.repliesCount} - 1` })
        .where(eq(postsTable.id, post.parentPostId));
    } else {
      // Only decrement postsCount for top-level posts
      await db.update(usersTable).set({ postsCount: sql`${usersTable.postsCount} - 1` }).where(eq(usersTable.id, req.userId!));
    }

    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Home feed - top-level posts only
router.get("/feed", authenticate, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const following = await db
      .select({ followingId: followsTable.followingId })
      .from(followsTable)
      .where(eq(followsTable.followerId, req.userId!));

    const followingIds = [req.userId!, ...following.map((f) => f.followingId)];
    const posts = await db
      .select()
      .from(postsTable)
      .where(and(
        inArray(postsTable.userId, followingIds),
        eq(postsTable.isArchived, false),
        isNull(postsTable.parentPostId), // top-level posts only
      ))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit);

    const formatted = await Promise.all(posts.map((p) => formatPost(p, req.userId!)));
    res.json({ posts: formatted, nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Explore - top-level posts only
router.get("/explore", authenticate, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const posts = await db
      .select()
      .from(postsTable)
      .where(and(
        eq(postsTable.isArchived, false),
        isNull(postsTable.parentPostId), // top-level posts only
      ))
      .orderBy(desc(postsTable.likesCount), desc(postsTable.createdAt))
      .limit(limit);

    const formatted = await Promise.all(posts.map((p) => formatPost(p, req.userId!)));
    res.json({ posts: formatted, nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;