import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  createSession,
  updateSession,
  clearSession,
  getSessionId,
  deleteSession,
  getSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function buildSessionUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    level: user.level,
    pointsSpent: user.pointsSpent,
    equippedBackground: user.equippedBackground,
    equippedFrame: user.equippedFrame,
    equippedNametag: user.equippedNametag,
    xp: user.xp ?? 0,
    gameLevel: user.gameLevel ?? 1,
    isPublic: user.isPublic ?? true,
    showNameOnLeaderboard: user.showNameOnLeaderboard ?? true,
    showNameInSearch: user.showNameInSearch ?? true,
    allowProfileView: user.allowProfileView ?? true,
    isDeveloper: user.isDeveloper ?? false,
  };
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  if (typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters." });
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "This username is already taken." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      username: username.toLowerCase().trim(),
      passwordHash,
    })
    .returning();

  const sessionData: SessionData = { user: buildSessionUser(user), access_token: "" };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json({ user: sessionData.user, sid });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const sessionData: SessionData = { user: buildSessionUser(user), access_token: "" };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ user: sessionData.user, sid });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ success: true });
});

router.put("/auth/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { level, firstName, lastName, isPublic, showNameOnLeaderboard, showNameInSearch, allowProfileView } = req.body;
  const validLevels = ["P1","P2","P3","P4","P5","P6","S1","S2","S3","S4","S5","S6","U1","U2","U3","U4"];

  if (isPublic !== undefined && typeof isPublic !== "boolean") {
    res.status(400).json({ error: "isPublic must be a boolean." });
    return;
  }

  if (level !== undefined && level !== null && !validLevels.includes(level)) {
    res.status(400).json({ error: "Invalid level." });
    return;
  }

  if (firstName !== undefined && (typeof firstName !== "string" || firstName.trim().length === 0)) {
    res.status(400).json({ error: "First name cannot be empty." });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
  if (level !== undefined) updates.level = level ?? null;
  if (firstName !== undefined) updates.firstName = firstName.trim();
  if (lastName !== undefined) updates.lastName = lastName?.trim() || null;
  if (isPublic !== undefined) updates.isPublic = isPublic;
  if (showNameOnLeaderboard !== undefined && typeof showNameOnLeaderboard === "boolean") updates.showNameOnLeaderboard = showNameOnLeaderboard;
  if (showNameInSearch !== undefined && typeof showNameInSearch === "boolean") updates.showNameInSearch = showNameInSearch;
  if (allowProfileView !== undefined && typeof allowProfileView === "boolean") updates.allowProfileView = allowProfileView;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user.id))
    .returning();

  const sid = getSessionId(req);
  if (sid) {
    const session = await getSession(sid);
    if (session) {
      session.user = buildSessionUser(updated);
      await updateSession(sid, session);
    }
  }

  res.json({ user: buildSessionUser(updated) });
});

router.put("/auth/profile-picture", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { imageData } = req.body;

  if (!imageData || typeof imageData !== "string") {
    res.status(400).json({ error: "imageData is required" });
    return;
  }

  if (!imageData.startsWith("data:image/")) {
    res.status(400).json({ error: "Must be a valid image data URL" });
    return;
  }

  const base64Part = imageData.split(",")[1] ?? "";
  const sizeInBytes = (base64Part.length * 3) / 4;
  if (sizeInBytes > 3 * 1024 * 1024) {
    res.status(400).json({ error: "Image too large. Max 3MB." });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ profileImageUrl: imageData, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user.id))
    .returning();

  const sid = getSessionId(req);
  if (sid) {
    const session = await getSession(sid);
    if (session) {
      session.user = buildSessionUser(updated);
      await updateSession(sid, session);
    }
  }

  res.json({ user: buildSessionUser(updated) });
});

router.put("/auth/change-password", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required." });
    return;
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(400).json({ error: "Password change is not available for accounts using Replit login." });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(usersTable)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user.id));

  res.json({ success: true });
});

router.delete("/auth/account", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  await db.delete(usersTable).where(eq(usersTable.id, userId));

  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });

  res.json({ success: true });
});

export default router;
