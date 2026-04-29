import { Router, type Response, type NextFunction } from "express";
import { db, usersTable, postsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.isAdmin) {
    res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  next();
};

router.use(authenticate);
router.use(isAdmin);

router.post("/admin/users/:userId/freeze", async (req, res) => {
  try {
    const userId = req.params.userId as string;
    await db.update(usersTable).set({ isFrozen: true }).where(eq(usersTable.id, userId));
    res.json({ message: "User frozen" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/admin/users/:userId/unfreeze", async (req, res) => {
  try {
    const userId = req.params.userId as string;
    await db.update(usersTable).set({ isFrozen: false }).where(eq(usersTable.id, userId));
    res.json({ message: "User unfrozen" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/admin/users/:userId/approve-verification", async (req, res) => {
  try {
    const userId = req.params.userId as string;
    await db.update(usersTable).set({ isVerified: true, verificationStatus: 'verified' }).where(eq(usersTable.id, userId));
    res.json({ message: "Verification approved" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.delete("/admin/posts/:postId", async (req, res) => {
  try {
    const postId = req.params.postId as string;
    await db.delete(postsTable).where(eq(postsTable.id, postId));
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
