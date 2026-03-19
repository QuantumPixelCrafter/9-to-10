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
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    level: user.level,
    pointsSpent: user.pointsSpent,
    equippedBackground: user.equippedBackground,
    equippedFrame: user.equippedFrame,
    equippedNametag: user.equippedNametag,
    equippedTitle: user.equippedTitle,
    xp: user.xp ?? 0,
    gameLevel: user.gameLevel ?? 1,
  };
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase().trim(),
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      passwordHash,
    })
    .returning();

  const sessionData: SessionData = { user: buildSessionUser(user), access_token: "" };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json({ user: sessionData.user });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const sessionData: SessionData = { user: buildSessionUser(user), access_token: "" };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ user: sessionData.user });
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

  const { level, firstName, lastName } = req.body;
  const validLevels = ["P1","P2","P3","P4","P5","P6","S1","S2","S3","S4","S5","S6","U1","U2","U3","U4"];

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

export default router;
