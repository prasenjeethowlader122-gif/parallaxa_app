import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import postsRouter from "./posts";
import storiesRouter from "./stories";
import commentsRouter from "./comments";
import likesRouter from "./likes";
import notificationsRouter from "./notifications";
import messagesRouter from "./messages";
import searchRouter from "./search";
import savedRouter from "./saved";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(storiesRouter);
router.use(commentsRouter);
router.use(likesRouter);
router.use(notificationsRouter);
router.use(messagesRouter);
router.use(searchRouter);
router.use(savedRouter);

export default router;
