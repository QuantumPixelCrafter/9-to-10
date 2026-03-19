import { Router, type IRouter } from "express";
import { db, usersTable, userInventoryTable, userAchievementsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SHOP_ITEMS, getItem } from "../lib/shop";
import { ACHIEVEMENTS } from "../lib/achievements";
import {
  getSessionId,
  updateSession,
  getSession,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

async function getUserBalance(userId: string): Promise<number> {
  const [earned, [userRow]] = await Promise.all([
    db.select({ key: userAchievementsTable.achievementKey }).from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId)),
    db.select({ pointsSpent: usersTable.pointsSpent, bonusPoints: usersTable.bonusPoints }).from(usersTable).where(eq(usersTable.id, userId)),
  ]);
  const totalEarned = earned.reduce((sum, e) => {
    const def = ACHIEVEMENTS.find(a => a.key === e.key);
    return sum + (def?.points ?? 0);
  }, 0);
  const bonus = userRow?.bonusPoints ?? 0;
  const spent = userRow?.pointsSpent ?? 0;
  return Math.max(0, totalEarned + bonus - spent);
}

router.get("/shop/items", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [inventory, [userRow], balance] = await Promise.all([
    db.select({ itemKey: userInventoryTable.itemKey }).from(userInventoryTable).where(eq(userInventoryTable.userId, req.user.id)),
    db.select({ equippedBackground: usersTable.equippedBackground, equippedFrame: usersTable.equippedFrame, equippedNametag: usersTable.equippedNametag, equippedTitle: usersTable.equippedTitle }).from(usersTable).where(eq(usersTable.id, req.user.id)),
    getUserBalance(req.user.id),
  ]);

  const ownedKeys = new Set(inventory.map(i => i.itemKey));

  const items = SHOP_ITEMS.map(item => ({
    ...item,
    owned: ownedKeys.has(item.key),
    equipped:
      (item.type === "background" && userRow?.equippedBackground === item.key) ||
      (item.type === "frame"      && userRow?.equippedFrame === item.key)      ||
      (item.type === "nametag"    && userRow?.equippedNametag === item.key)    ||
      (item.type === "title"      && userRow?.equippedTitle === item.key),
  }));

  res.json({
    items,
    balance,
    equipped: {
      background: userRow?.equippedBackground ?? null,
      frame: userRow?.equippedFrame ?? null,
      nametag: userRow?.equippedNametag ?? null,
      title: userRow?.equippedTitle ?? null,
    },
  });
});

router.post("/shop/purchase", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { itemKey } = req.body;
  const item = getItem(itemKey);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const existing = await db.select({ id: userInventoryTable.id })
    .from(userInventoryTable)
    .where(and(eq(userInventoryTable.userId, req.user.id), eq(userInventoryTable.itemKey, itemKey)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Item already owned" });
    return;
  }

  const balance = await getUserBalance(req.user.id);
  if (balance < item.price) {
    res.status(400).json({ error: "Insufficient points" });
    return;
  }

  await Promise.all([
    db.insert(userInventoryTable).values({ userId: req.user.id, itemKey }),
    db.update(usersTable).set({ pointsSpent: req.user.pointsSpent + item.price, updatedAt: new Date() }).where(eq(usersTable.id, req.user.id)),
  ]);

  res.json({ success: true, newBalance: balance - item.price });
});

router.post("/shop/equip", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { itemKey } = req.body;

  if (itemKey === null || itemKey === undefined) {
    res.status(400).json({ error: "itemKey required" });
    return;
  }

  let update: Partial<{ equippedBackground: string | null; equippedFrame: string | null; equippedNametag: string | null; equippedTitle: string | null }> = {};

  if (itemKey === "") {
    const { slot } = req.body;
    if (slot === "background") update = { equippedBackground: null };
    else if (slot === "frame") update = { equippedFrame: null };
    else if (slot === "nametag") update = { equippedNametag: null };
    else if (slot === "title") update = { equippedTitle: null };
    else { res.status(400).json({ error: "Invalid slot" }); return; }
  } else {
    const item = getItem(itemKey);
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }

    const owned = await db.select({ id: userInventoryTable.id })
      .from(userInventoryTable)
      .where(and(eq(userInventoryTable.userId, req.user.id), eq(userInventoryTable.itemKey, itemKey)))
      .limit(1);

    if (owned.length === 0) { res.status(403).json({ error: "Item not owned" }); return; }

    if (item.type === "background") update = { equippedBackground: itemKey };
    else if (item.type === "frame") update = { equippedFrame: itemKey };
    else if (item.type === "nametag") update = { equippedNametag: itemKey };
    else if (item.type === "title") update = { equippedTitle: itemKey };
  }

  const [updated] = await db.update(usersTable).set({ ...update, updatedAt: new Date() }).where(eq(usersTable.id, req.user.id)).returning();

  const sid = getSessionId(req);
  if (sid) {
    const session = await getSession(sid);
    if (session) {
      session.user = {
        ...session.user,
        equippedBackground: updated.equippedBackground ?? null,
        equippedFrame: updated.equippedFrame ?? null,
        equippedNametag: updated.equippedNametag ?? null,
        equippedTitle: updated.equippedTitle ?? null,
      };
      await updateSession(sid, session);
    }
  }

  res.json({ success: true, equipped: { background: updated.equippedBackground, frame: updated.equippedFrame, nametag: updated.equippedNametag, title: updated.equippedTitle } });
});

export default router;
