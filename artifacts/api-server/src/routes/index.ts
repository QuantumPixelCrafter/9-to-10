import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import notesRouter from "./notes";
import quizRouter from "./quiz";
import schedulesRouter from "./schedules";
import goalsRouter from "./goals";
import moodsRouter from "./moods";

const router: IRouter = Router();

router.use(healthRouter);
router.use(subjectsRouter);
router.use(notesRouter);
router.use(quizRouter);
router.use(schedulesRouter);
router.use(goalsRouter);
router.use(moodsRouter);

export default router;
