import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  postsTable,
  followsTable,
  storiesTable,
  storyViewsTable,
} from "@workspace/db";
import { eq, and, desc, isNull, sql, gt, inArray } from "drizzle-orm";
import {
  authenticate,
  optionalAuthenticate,
  type AuthRequest,
} from "../middleware/authenticate";
import { generateId } from "../lib/auth";
import generateTextLogoSVGBase64 from "./svg-logo";

const router = Router();

async function getUsersStoryStatus(userIds: string[], myId?: string) {
  const now = new Date();
  const activeStories =
    userIds.length > 0
      ? await db
          .select()
          .from(storiesTable)
          .where(
            and(
              inArray(storiesTable.userId, userIds),
              gt(storiesTable.expiresAt, now),
            ),
          )
      : [];

  const storyMap: Record<
    string,
    { hasStory: boolean; hasUnviewedStory: boolean; storyIds: string[] }
  > = {};
  userIds.forEach(
    (id) =>
      (storyMap[id] = {
        hasStory: false,
        hasUnviewedStory: false,
        storyIds: [],
      }),
  );

  activeStories.forEach((s) => {
    storyMap[s.userId].hasStory = true;
    storyMap[s.userId].storyIds.push(s.id);
  });

  if (myId && activeStories.length > 0) {
    const allActiveStoryIds = activeStories.map((s) => s.id);
    const views = await db
      .select()
      .from(storyViewsTable)
      .where(
        and(
          eq(storyViewsTable.userId, myId),
          inArray(storyViewsTable.storyId, allActiveStoryIds),
        ),
      );

    const viewedSet = new Set(views.map((v) => v.storyId));

    userIds.forEach((id) => {
      const userStoryIds = storyMap[id].storyIds;
      if (userStoryIds.length > 0) {
        storyMap[id].hasUnviewedStory = userStoryIds.some(
          (sid) => !viewedSet.has(sid),
        );
      }
    });
  }

  return storyMap;
}

async function formatUser(
  user: typeof usersTable.$inferSelect,
  isFollowing = false,
  isFollowedBy = false,
  myId?: string,
  storyStatus?: { hasStory: boolean; hasUnviewedStory: boolean },
) {
  const status =
    storyStatus || (await getUsersStoryStatus([user.id], myId))[user.id];
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
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    isPrivate: user.isPrivate,
    isFrozen: user.isFrozen,
    isFollowing,
    isFollowedBy,
    ...storyStatus,
  };
}

async function formatUserSummary(
  user: typeof usersTable.$inferSelect,
  isFollowing = false,
  myId?: string,
  storyStatus?: { hasStory: boolean; hasUnviewedStory: boolean },
) {
  const status =
    storyStatus || (await getUsersStoryStatus([user.id], myId))[user.id];
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    isFollowing,
    ...status,
  };
}

router.get("/users/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json(await formatUser(user, false, false, req.userId));
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: String(err) });
  }
});

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
        sql`${usersTable.id} != ${myId} AND ${usersTable.id} NOT IN (${alreadyFollowing})`,
      )
      .limit(10);

    res.json(
      await Promise.all(users.map((u) => formatUserSummary(u, false, myId))),
    );
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post(
  "/users/verify-request",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      await db
        .update(usersTable)
        .set({ verificationStatus: "pending" })
        .where(eq(usersTable.id, req.userId!));

      res.json({ message: "Verification request submitted" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.get(
  "/users/:userId",
  optionalAuthenticate,
  async (req: AuthRequest, res): Promise<any> => {
    try {
      let userId = req.params.userId as string;
      const myId = req.userId;

      if (userId === "me") {
        if (!myId) {
          res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required for 'me' alias",
          });
          return;
        }
        userId = myId;
      }
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!user) {
        res.status(404).json({ error: "Not Found", message: "User not found" });
        return;
      }
      const followingRow = myId
        ? (
            await db
              .select()
              .from(followsTable)
              .where(
                and(
                  eq(followsTable.followerId, myId as string),
                  eq(followsTable.followingId, userId),
                ),
              )
              .limit(1)
          )[0]
        : null;

      const followedByRow = myId
        ? (
            await db
              .select()
              .from(followsTable)
              .where(
                and(
                  eq(followsTable.followerId, userId),
                  eq(followsTable.followingId, myId),
                ),
              )
              .limit(1)
          )[0]
        : null;

      const isSelf = myId === userId;
      const isFollowing = !!followingRow;

      const profile = await formatUser(
        user,
        isFollowing,
        !!followedByRow,
        myId,
      );

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
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.put("/users/:userId", authenticate, async (req: AuthRequest, res) => {
  try {
    let userId = req.params.userId as string;
    if (userId === "me") userId = req.userId!;

    if (userId !== req.userId && !req.isAdmin) {
      res
        .status(403)
        .json({ error: "Forbidden", message: "Cannot update another user" });
      return;
    }
    const { displayName, bio, website, isPrivate } = req.body;
    let { avatarUrl } = req.body;
    if (displayName && !avatarUrl) {
      avatarUrl = generateTextLogoSVGBase64(displayName);
    }
    const [updated] = await db
      .update(usersTable)
      .set({
        displayName,
        bio,
        avatarUrl,
        website,
        isPrivate,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning();
    res.json(await formatUser(updated, false, false, userId));
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get(
  "/users/:userId/posts",
  optionalAuthenticate,
  async (req: AuthRequest, res): Promise<any> => {
    try {
      let userId = req.params.userId as string;
      const myId = req.userId;

      if (userId === "me") {
        if (!myId) {
          res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required for 'me' alias",
          });
          return;
        }
        userId = myId;
      }
      const limit = Math.min(Number(req.query.limit) || 20, 100);

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!user) {
        return res
          .status(404)
          .json({ error: "Not Found", message: "User not found" });
      }

      // Privacy check
      if (user.isPrivate && myId !== userId && !req.isAdmin) {
        const [following] = await db
          .select()
          .from(followsTable)
          .where(
            and(
              eq(followsTable.followerId, myId as string),
              eq(followsTable.followingId, userId),
            ),
          )
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
          ),
        )
        .orderBy(desc(postsTable.createdAt))
        .limit(limit);

      // Fetch author info once
      const [author] = [user];
      const storyStatus = (await getUsersStoryStatus([userId], myId))[userId];

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
            ...storyStatus,
          },
          content: p.content,
          imageUrl: p.imageUrl,
          videoUrl: p.videoUrl,
          location: p.location,
          hashtags: [],
          likesCount: p.likesCount,
          repostsCount: p.repostsCount,
          commentsCount: p.repliesCount, // repliesCount is the DB field
          repliesCount: p.repliesCount,
          isLiked: false,
          isSaved: false,
          createdAt: p.createdAt,
        })),
        nextCursor: null,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.get(
  "/users/:userId/stories",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      let userId = req.params.userId as string;
      if (userId === "me") userId = req.userId!;

      const now = new Date();
      const stories = await db
        .select()
        .from(storiesTable)
        .where(
          and(
            eq(storiesTable.userId, userId),
            sql`${storiesTable.expiresAt} > ${now}`,
          ),
        )
        .orderBy(desc(storiesTable.createdAt));
      res.json(
        stories.map((s) => ({
          id: s.id,
          userId: s.userId,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType,
          duration: s.duration,
          viewsCount: s.viewsCount,
          isViewed: false,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
      );
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.get(
  "/users/:userId/followers",
  optionalAuthenticate,
  async (req: AuthRequest, res) => {
    try {
      let userId = req.params.userId as string;
      if (userId === "me") {
        if (!req.userId) {
          res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required for 'me' alias",
          });
          return;
        }
        userId = req.userId;
      }
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const rows = await db
        .select({ user: usersTable })
        .from(followsTable)
        .innerJoin(usersTable, eq(followsTable.followerId, usersTable.id))
        .where(eq(followsTable.followingId, userId))
        .limit(limit);
      res.json({
        users: await Promise.all(
          rows.map((r) => formatUserSummary(r.user, false, req.userId)),
        ),
        nextCursor: null,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.get(
  "/users/:userId/following",
  optionalAuthenticate,
  async (req: AuthRequest, res) => {
    try {
      let userId = req.params.userId as string;
      if (userId === "me") {
        if (!req.userId) {
          res.status(401).json({
            error: "Unauthorized",
            message: "Authentication required for 'me' alias",
          });
          return;
        }
        userId = req.userId;
      }
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const rows = await db
        .select({ user: usersTable })
        .from(followsTable)
        .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
        .where(eq(followsTable.followerId, userId))
        .limit(limit);
      res.json({
        users: await Promise.all(
          rows.map((r) => formatUserSummary(r.user, false, req.userId)),
        ),
        nextCursor: null,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.post(
  "/users/:userId/follow",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      let userId = req.params.userId as string;
      const myId = req.userId!;
      if (userId === "me") userId = myId;

      if (userId === myId) {
        res
          .status(400)
          .json({ error: "Bad Request", message: "Cannot follow yourself" });
        return;
      }
      const [existing] = await db
        .select()
        .from(followsTable)
        .where(
          and(
            eq(followsTable.followerId, myId as string),
            eq(followsTable.followingId, userId),
          ),
        )
        .limit(1);
      if (!existing) {
        await db
          .insert(followsTable)
          .values({ id: generateId(), followerId: myId, followingId: userId });
        await db
          .update(usersTable)
          .set({ followingCount: sql`${usersTable.followingCount} + 1` })
          .where(eq(usersTable.id, myId));
        await db
          .update(usersTable)
          .set({ followersCount: sql`${usersTable.followersCount} + 1` })
          .where(eq(usersTable.id, userId));
      }
      res.json({ message: "Followed" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

router.delete(
  "/users/:userId/follow",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      let userId = req.params.userId as string;
      const myId = req.userId!;
      if (userId === "me") userId = myId;

      const [existing] = await db
        .select()
        .from(followsTable)
        .where(
          and(
            eq(followsTable.followerId, myId as string),
            eq(followsTable.followingId, userId),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .delete(followsTable)
          .where(
            and(
              eq(followsTable.followerId, myId as string),
              eq(followsTable.followingId, userId),
            ),
          );
        await db
          .update(usersTable)
          .set({
            followingCount: sql`GREATEST(${usersTable.followingCount} - 1, 0)`,
          })
          .where(eq(usersTable.id, myId));
        await db
          .update(usersTable)
          .set({
            followersCount: sql`GREATEST(${usersTable.followersCount} - 1, 0)`,
          })
          .where(eq(usersTable.id, userId));
      }
      res.json({ message: "Unfollowed" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", message: String(err) });
    }
  },
);

export default router;
