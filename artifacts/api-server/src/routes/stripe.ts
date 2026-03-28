import { Router, type IRouter } from 'express';
import { db } from '@workspace/db';
import { usersTable, stripeClaimedSessionsTable } from '@workspace/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripeClient';

const router: IRouter = Router();

router.get('/stripe/config', async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stripe/products', async (_req, res) => {
  try {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = true
          ORDER BY id
        )
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY pr.unit_amount ASC
      `
    );

    const productsMap = new Map<string, any>();
    for (const row of result.rows) {
      if (!productsMap.has(row.product_id as string)) {
        productsMap.set(row.product_id as string, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id as string).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    console.error('Error fetching stripe products:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/stripe/checkout', async (req: any, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId },
        ...(user.email ? { email: user.email } : {}),
        ...(user.username ? { name: user.username } : {}),
      });
      await db.update(usersTable)
        .set({ stripeCustomerId: customer.id })
        .where(eq(usersTable.id, userId));
      customerId = customer.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${baseUrl}/support?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/support?canceled=1`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/stripe/claim', async (req: any, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [existing] = await db
      .select()
      .from(stripeClaimedSessionsTable)
      .where(eq(stripeClaimedSessionsTable.sessionId, sessionId));

    if (existing) {
      return res.json({ alreadyClaimed: true, pointsAwarded: existing.pointsAwarded });
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product as any;
    const bonusPointsStr = product?.metadata?.bonus_points;
    const bonusPoints = bonusPointsStr ? parseInt(bonusPointsStr, 10) : 0;

    await db.insert(stripeClaimedSessionsTable).values({
      sessionId,
      userId,
      pointsAwarded: bonusPoints,
    });

    if (bonusPoints > 0) {
      await db.update(usersTable)
        .set({ bonusPoints: sql`${usersTable.bonusPoints} + ${bonusPoints}` })
        .where(eq(usersTable.id, userId));
    }

    res.json({ pointsAwarded: bonusPoints, alreadyClaimed: false });
  } catch (err: any) {
    console.error('Claim error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
