import { Router, type IRouter } from "express";
import { getUserAchievements, checkAndAwardAchievements, getTotalPoints } from "../lib/achievements";

const router: IRouter = Router();

router.get("/achievements", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const achievements = await getUserAchievements(req.user.id);
  const totalPoints = getTotalPoints(achievements);
  res.json({ achievements, totalPoints });
});

router.post("/achievements/check", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const newlyEarned = await checkAndAwardAchievements(req.user.id);
  const achievements = await getUserAchievements(req.user.id);
  const totalPoints = getTotalPoints(achievements);
  res.json({ newlyEarned, achievements, totalPoints });
});

export default router;
