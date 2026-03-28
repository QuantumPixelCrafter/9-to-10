import { getUncachableStripeClient } from '../../artifacts/api-server/src/stripeClient';

const SUPPORT_TIERS = [
  {
    name: 'Supporter',
    description: 'Buy us a coffee! Every bit helps keep Mind Forge running.',
    amount: 200,
    emoji: '☕',
  },
  {
    name: 'Champion',
    description: 'A generous donation that helps us build new features and improve the app.',
    amount: 500,
    emoji: '⭐',
  },
  {
    name: 'Legend',
    description: 'An incredible contribution that makes a huge difference to our team.',
    amount: 1000,
    emoji: '🏆',
  },
];

async function seedProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Seeding Mind Forge support tiers...');

    for (const tier of SUPPORT_TIERS) {
      const existing = await stripe.products.search({
        query: `name:'${tier.name}' AND active:'true'`,
      });

      if (existing.data.length > 0) {
        console.log(`${tier.emoji} ${tier.name} already exists — skipping`);
        continue;
      }

      const product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: { emoji: tier.emoji, category: 'support' },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.amount,
        currency: 'usd',
      });

      console.log(`${tier.emoji} Created ${tier.name}: $${tier.amount / 100} (${price.id})`);
    }

    console.log('Done!');
  } catch (err: any) {
    console.error('Error seeding products:', err.message);
    process.exit(1);
  }
}

seedProducts();
