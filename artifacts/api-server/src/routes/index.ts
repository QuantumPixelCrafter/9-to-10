import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customAuthRouter from "./custom-auth";
import subjectsRouter from "./subjects";
import notesRouter from "./notes";
import quizRouter from "./quiz";
import gamesRouter from "./games";
import schedulesRouter from "./schedules";
import goalsRouter from "./goals";
import moodsRouter from "./moods";
import leaderboardRouter from "./leaderboard";
import achievementsRouter from "./achievements";
import shopRouter from "./shop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customAuthRouter);
router.use(subjectsRouter);
router.use(notesRouter);
router.use(quizRouter);
router.use(gamesRouter);
router.use(schedulesRouter);
router.use(goalsRouter);
router.use(moodsRouter);
router.use(leaderboardRouter);
router.use(achievementsRouter);
router.use(shopRouter);

export default router;
