import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postsTable, hashtagsTable, likesTable, savedPostsTable } from "@workspace/db";
import { like, sql } from "drizzle-orm";
import { authenticate, optionalAuthenticate, type AuthRequest } from "../middleware/authenticate";
import type { UserSummary, Post, Hashtag } from "@workspace/api-zod";

const router = Router();

router.get("/search", optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const type = String(req.query.type ?? "all");
    if (!q) {
      res.json({ users: [], posts: [], hashtags: [] });
      return;
    }
    const pattern = `%${q}%`;

    let users: UserSummary[] = [];
    let posts: Post[] = [];
    let hashtags: Hashtag[] = [];

    if (type === "all" || type === "users") {
      const rows = await db
        .select()
        .from(usersTable)
        .where(sql`${usersTable.username} ILIKE ${pattern} OR ${usersTable.displayName} ILIKE ${pattern}`)
        .limit(10);
      users = rows.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        isVerified: u.isVerified,
        isFollowing: false,
      }));
    }

    if (type === "all" || type === "posts") {
      const rows = await db
        .select()
        .from(postsTable)
        .where(sql`${postsTable.content} ILIKE ${pattern}`)
        .limit(10);
      posts = await Promise.all(rows.map(async (p) => {
        const [author] = await db.select().from(usersTable).where(sql`${usersTable.id} = ${p.userId}`).limit(1);
        const liked = req.userId ? (await db.select().from(likesTable).where(sql`${likesTable.userId} = ${req.userId} AND ${likesTable.postId} = ${p.id}`).limit(1))[0] : null;
        const saved = req.userId ? (await db.select().from(savedPostsTable).where(sql`${savedPostsTable.userId} = ${req.userId} AND ${savedPostsTable.postId} = ${p.id}`).limit(1))[0] : null;

        const formattedAuthor: UserSummary = author ? {
          id: author.id,
          username: author.username,
          displayName: author.displayName ?? author.username,
          avatarUrl: author.avatarUrl,
          isVerified: author.isVerified,
          isFollowing: false
        } : {
          id: p.userId,
          username: "deleted_user",
          displayName: "Deleted User",
          isVerified: false,
          isFollowing: false
        };

        return {
          id: p.id,
          author: formattedAuthor,
          content: p.content, imageUrl: p.imageUrl, videoUrl: p.videoUrl, location: p.location,
          hashtags: [], likesCount: p.likesCount, commentsCount: p.repliesCount, repliesCount: p.repliesCount,
          isLiked: !!liked, isSaved: !!saved, createdAt: p.createdAt,
        };
      }));
    }

    if (type === "all" || type === "hashtags") {
      const rows = await db
        .select()
        .from(hashtagsTable)
        .where(like(hashtagsTable.name, `%${q.replace(/^#/, "")}%`))
        .limit(10);
      hashtags = rows.map((h) => ({ name: h.name, postCount: h.postCount }));
    }

    res.json({ users, posts, hashtags });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
