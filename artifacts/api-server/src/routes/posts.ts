import { Router } from "express";
import { db } from "@workspace/db";
import {
  postsTable,
  usersTable,
  likesTable,
  savedPostsTable,
  followsTable,
  hashtagsTable,
  postHashtagsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, desc, inArray, sql, isNull } from "drizzle-orm";
import { authenticate, optionalAuthenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";
import { logger } from "../lib/logger";
import { sanitize } from "../lib/sanitize";

const router = Router();

async function formatPost(
  post: typeof postsTable.$inferSelect,
  myId?: string,
) {
  const [author] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, post.userId))
    .limit(1);

  const liked = myId
    ? (await db
        .select()
        .from(likesTable)
        .where(and(eq(likesTable.userId, myId), eq(likesTable.postId, post.id)))
        .limit(1))[0]
    : null;

  const saved = myId
    ? (await db
        .select()
        .from(savedPostsTable)
        .where(and(eq(savedPostsTable.userId, myId), eq(savedPostsTable.postId, post.id)))
        .limit(1))[0]
    : null;

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
    commentsCount: post.repliesCount,
    isLiked: !!liked,
    isSaved: !!saved,
    createdAt: post.createdAt,
  };
}

// Create a post or a comment/reply (if parentPostId is provided)
router.post("/posts", authenticate, async (req: AuthRequest, res) => {
  try {
    const content = sanitize(req.body.content);
    const location = sanitize(req.body.location);
    const { imageUrl, videoUrl, hashtags, parentPostId } = req.body;

    if (!content && !imageUrl && !videoUrl) {
      res.status(400).json({ error: "Bad Request", message: "Post must have content, image, or video" });
      return;
    }

    // Verify parent exists and cache it — one query, used twice below
    let parentPost: typeof postsTable.$inferSelect | null = null;
    if (parentPostId) {
      const [found] = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, parentPostId))
        .limit(1);
      if (!found) {
        res.status(404).json({ error: "Not Found", message: "Parent post not found" });
        return;
      }
      parentPost = found;
    }

    const id = generateId();

    // IMPORTANT: only include parentPostId in the INSERT when it is actually set.
    // Passing parentPostId: null explicitly can fail if the column doesn't yet exist
    // in the DB (i.e. drizzle push hasn't been run since the column was added).
    const [post] = await db
      .insert(postsTable)
      .values(
        parentPostId
          ? { id, userId: req.userId!, parentPostId, content: content ?? null }
          : {
              id,
              userId: req.userId!,
              content: content ?? null,
              imageUrl: imageUrl ?? null,
              videoUrl: videoUrl ?? null,
              location: location ?? null,
            },
      )
      .returning();

    if (parentPost) {
      // Increment parent's repliesCount
      await db
        .update(postsTable)
        .set({ repliesCount: sql`${postsTable.repliesCount} + 1` })
        .where(eq(postsTable.id, parentPost.id));

      // Notify parent post author (skip if replying to own post)
      if (parentPost.userId !== req.userId) {
        await db.insert(notificationsTable).values({
          id: generateId(),
          userId: parentPost.userId,
          fromUserId: req.userId!,
          type: "comment",
          postId: parentPost.id,
          commentId: id,
          commentContent: content?.slice(0, 100) ?? null,
        });
      }
    } else {
      // Top-level post: increment user's postsCount
      await db
        .update(usersTable)
        .set({ postsCount: sql`${usersTable.postsCount} + 1` })
        .where(eq(usersTable.id, req.userId!));

      // Handle hashtags
      if (Array.isArray(hashtags) && hashtags.length > 0) {
        for (const tag of hashtags) {
          const name = String(tag).toLowerCase().replace(/^#/, "");
          if (!name) continue;

          const [existing] = await db
            .select()
            .from(hashtagsTable)
            .where(eq(hashtagsTable.name, name))
            .limit(1);

          const hashtagId = existing?.id ?? generateId();

          if (!existing) {
            await db.insert(hashtagsTable).values({ id: hashtagId, name, postCount: 1 });
          } else {
            await db
              .update(hashtagsTable)
              .set({ postCount: sql`${hashtagsTable.postCount} + 1` })
              .where(eq(hashtagsTable.id, hashtagId));
          }

          await db.insert(postHashtagsTable).values({ postId: id, hashtagId });
        }
      }
    }

    const formatted = await formatPost(post, req.userId!);
    res.status(201).json(formatted);
  } catch (err) {
    logger.error({ err }, "POST /posts error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Get a single post by ID
router.get("/posts/:postId", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, req.params.postId as string))
      .limit(1);

    if (!post) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }

    res.json(await formatPost(post, req.userId!));
  } catch (err) {
    logger.error({ err }, "GET /posts/:postId error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Get replies/comments of a post
router.get("/posts/:postId/replies", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.postId as string;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const [parent] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (!parent) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }

    // To support threading (one level deep in the UI), we fetch replies to this post
    // and also replies to those replies.
    const directReplies = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.parentPostId, postId), eq(postsTable.isArchived, false)))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit);

    if (directReplies.length === 0) {
      res.json({ posts: [], nextCursor: null });
      return;
    }

    const directReplyIds = directReplies.map(r => r.id);
    const nestedReplies = await db
      .select()
      .from(postsTable)
      .where(
        and(
          inArray(postsTable.parentPostId, directReplyIds),
          eq(postsTable.isArchived, false)
        )
      )
      .orderBy(desc(postsTable.createdAt));

    const allReplies = [...directReplies, ...nestedReplies];
    const formatted = await Promise.all(allReplies.map((p) => formatPost(p, req.userId)));

    res.json({ posts: formatted, nextCursor: null });
  } catch (err) {
    logger.error({ err }, "GET /posts/:postId/replies error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Delete a post (or comment/reply)
router.delete("/posts/:postId", authenticate, async (req: AuthRequest, res) => {
  try {
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, req.params.postId as string))
      .limit(1);

    if (!post) {
      res.status(404).json({ error: "Not Found", message: "Post not found" });
      return;
    }

    if (post.userId !== req.userId && !req.isAdmin) {
      res.status(403).json({ error: "Forbidden", message: "Cannot delete another user's post" });
      return;
    }

    await db.delete(postsTable).where(eq(postsTable.id, req.params.postId as string));

    if (post.parentPostId) {
      await db
        .update(postsTable)
        .set({ repliesCount: sql`GREATEST(${postsTable.repliesCount} - 1, 0)` })
        .where(eq(postsTable.id, post.parentPostId));
    } else {
      await db
        .update(usersTable)
        .set({ postsCount: sql`GREATEST(${usersTable.postsCount} - 1, 0)` })
        .where(eq(usersTable.id, req.userId!));
    }

    res.json({ message: "Post deleted" });
  } catch (err) {
    logger.error({ err }, "DELETE /posts/:postId error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Home feed — top-level posts only
router.get("/feed", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const myId = req.userId;

    let posts;

    if (myId) {
      const following = await db
        .select({ followingId: followsTable.followingId })
        .from(followsTable)
        .where(eq(followsTable.followerId, myId));

      const followingIds = [myId, ...following.map((f) => f.followingId)];

      posts = await db
        .select({
          post: postsTable,
          score: sql<number>`
            ((${postsTable.likesCount} * 2) + (${postsTable.repliesCount} * 3) + 1) /
            POWER(EXTRACT(EPOCH FROM (NOW() - ${postsTable.createdAt})) / 3600 + 2, 1.5)
          `
        })
        .from(postsTable)
        .where(
          and(
            inArray(postsTable.userId, followingIds),
            eq(postsTable.isArchived, false),
            isNull(postsTable.parentPostId),
          ),
        )
        .orderBy(desc(sql`score`))
        .limit(limit);
    } else {
      // Guest feed: top trending posts
      posts = await db
        .select({
          post: postsTable,
          score: sql<number>`
            ((${postsTable.likesCount} * 2) + (${postsTable.repliesCount} * 3) + 1) /
            POWER(EXTRACT(EPOCH FROM (NOW() - ${postsTable.createdAt})) / 3600 + 2, 1.5)
          `
        })
        .from(postsTable)
        .where(
          and(
            eq(postsTable.isArchived, false),
            isNull(postsTable.parentPostId),
          ),
        )
        .orderBy(desc(sql`score`))
        .limit(limit);
    }

    const formatted = await Promise.all(posts.map((p) => formatPost(p.post, myId)));
    res.json({ posts: formatted, nextCursor: null });
  } catch (err) {
    logger.error({ err }, "GET /feed error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

// Explore — top-level posts only
router.get("/explore", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const posts = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.isArchived, false), isNull(postsTable.parentPostId)))
      .orderBy(desc(postsTable.likesCount), desc(postsTable.createdAt))
      .limit(limit);

    const formatted = await Promise.all(posts.map((p) => formatPost(p, req.userId!)));
    res.json({ posts: formatted, nextCursor: null });
  } catch (err) {
    logger.error({ err }, "GET /explore error");
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;