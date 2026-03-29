import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { startGoalScheduler } from './lib/goal-scheduler';
import app from "./app";

const STORE_PRODUCTS = [
  {
    name: 'Supporter',
    description: 'Buy us a coffee! Every bit helps keep Mind Forge running.',
    amount: 200,
    metadata: { emoji: '☕', category: 'support' },
  },
  {
    name: 'Champion',
    description: 'A generous donation that helps us build new features and improve the app.',
    amount: 500,
    metadata: { emoji: '⭐', category: 'support' },
  },
  {
    name: 'Legend',
    description: 'An incredible contribution that makes a huge difference to our team.',
    amount: 1000,
    metadata: { emoji: '🏆', category: 'support' },
  },
  {
    name: 'Starter Pack',
    description: "A quick boost to get you started. Perfect for grabbing that background you've been eyeing.",
    amount: 199,
    metadata: { emoji: '⚡', category: 'coins', bonus_points: '500' },
  },
  {
    name: 'Value Pack',
    description: 'Great value for dedicated students. Unlock frames, nametags, and more in one go.',
    amount: 499,
    metadata: { emoji: '💎', category: 'coins', bonus_points: '1500' },
  },
  {
    name: 'Mega Pack',
    description: 'The ultimate point haul. Unlock everything you want and flex your style.',
    amount: 1499,
    metadata: { emoji: '🚀', category: 'coins', bonus_points: '5000' },
  },
];

async function seedStoreProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    for (const product of STORE_PRODUCTS) {
      const existing = await stripe.products.search({
        query: `name:'${product.name}' AND active:'true'`,
      });
      if (existing.data.length > 0) continue;

      const created = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: product.metadata,
      });
      await stripe.prices.create({
        product: created.id,
        unit_amount: product.amount,
        currency: 'usd',
      });
      console.log(`Created product: ${product.name}`);
    }
  } catch (err: any) {
    console.error('Product seeding error:', err.message);
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log('Stripe webhook configured');

    stripeSync.syncBackfill()
      .then(() => {
        console.log('Stripe data synced');
        seedStoreProducts();
      })
      .catch((err: any) => console.error('Stripe backfill error:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await initStripe();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startGoalScheduler();
});
