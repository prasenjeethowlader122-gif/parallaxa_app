import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, usersTable } from "@workspace/db";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { generateId } from "../lib/auth";

const router = Router();

function formatParticipant(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    isFollowing: false,
  };
}

router.post("/conversations/start", authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    const myId = req.userId!;
    if (!userId) {
      res.status(400).json({ error: "Bad Request", message: "userId is required" });
      return;
    }
    const [existing] = await db
      .select()
      .from(conversationsTable)
      .where(
        or(
          and(eq(conversationsTable.participant1Id, myId), eq(conversationsTable.participant2Id, userId)),
          and(eq(conversationsTable.participant1Id, userId), eq(conversationsTable.participant2Id, myId))
        )
      )
      .limit(1);

    if (existing) {
      const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      res.status(201).json({
        id: existing.id,
        participant: formatParticipant(participant),
        lastMessage: null,
        unreadCount: myId === existing.participant1Id ? existing.unreadCount1 : existing.unreadCount2,
        updatedAt: existing.updatedAt,
      });
      return;
    }

    const id = generateId();
    const [convo] = await db.insert(conversationsTable).values({
      id,
      participant1Id: myId,
      participant2Id: userId,
    }).returning();

    const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    res.status(201).json({
      id: convo.id,
      participant: formatParticipant(participant),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: convo.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/conversations", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const convos = await db
      .select()
      .from(conversationsTable)
      .where(or(eq(conversationsTable.participant1Id, myId), eq(conversationsTable.participant2Id, myId)))
      .orderBy(desc(conversationsTable.updatedAt));

    const result = await Promise.all(convos.map(async (convo) => {
      const participantId = convo.participant1Id === myId ? convo.participant2Id : convo.participant1Id;
      const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, participantId)).limit(1);
      const unreadCount = myId === convo.participant1Id ? convo.unreadCount1 : convo.unreadCount2;

      let lastMessage = null;
      if (convo.lastMessageId) {
        const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, convo.lastMessageId)).limit(1);
        if (msg) {
          lastMessage = {
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            content: msg.content,
            mediaUrl: msg.mediaUrl,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
          };
        }
      }

      return {
        id: convo.id,
        participant: participant ? formatParticipant(participant) : { id: participantId, username: "", displayName: "", avatarUrl: null, isVerified: false, isFollowing: false },
        lastMessage,
        unreadCount,
        updatedAt: convo.updatedAt,
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/conversations/:conversationId", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, req.params.conversationId)).limit(1);
    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" });
      return;
    }
    if (convo.participant1Id !== myId && convo.participant2Id !== myId) {
      res.status(403).json({ error: "Forbidden", message: "Not a participant" });
      return;
    }
    const participantId = convo.participant1Id === myId ? convo.participant2Id : convo.participant1Id;
    const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, participantId)).limit(1);
    const unreadCount = myId === convo.participant1Id ? convo.unreadCount1 : convo.unreadCount2;
    res.json({
      id: convo.id,
      participant: participant ? formatParticipant(participant) : { id: participantId, username: "", displayName: "", avatarUrl: null, isVerified: false, isFollowing: false },
      lastMessage: null,
      unreadCount,
      updatedAt: convo.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/conversations/:conversationId/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, req.params.conversationId)).limit(1);
    if (!convo || (convo.participant1Id !== myId && convo.participant2Id !== myId)) {
      res.status(403).json({ error: "Forbidden", message: "Not a participant" });
      return;
    }
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, req.params.conversationId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(limit);
    res.json({
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        mediaUrl: m.mediaUrl,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      nextCursor: null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/conversations/:conversationId/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const myId = req.userId!;
    const { conversationId } = req.params;
    const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId)).limit(1);
    if (!convo || (convo.participant1Id !== myId && convo.participant2Id !== myId)) {
      res.status(403).json({ error: "Forbidden", message: "Not a participant" });
      return;
    }
    const { content, mediaUrl } = req.body;
    const id = generateId();
    const [msg] = await db.insert(messagesTable).values({
      id, conversationId, senderId: myId, content, mediaUrl,
    }).returning();

    const isP1 = convo.participant1Id === myId;
    await db.update(conversationsTable).set({
      lastMessageId: id,
      updatedAt: new Date(),
      unreadCount1: isP1 ? convo.unreadCount1 : sql`${conversationsTable.unreadCount1} + 1`,
      unreadCount2: isP1 ? sql`${conversationsTable.unreadCount2} + 1` : convo.unreadCount2,
    }).where(eq(conversationsTable.id, conversationId));

    res.status(201).json({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
