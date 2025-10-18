import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seed...\n');

  // Check if organization exists
  const org = await prisma.organization.findFirst();
  
  if (!org) {
    console.log('📦 No organization found. Running main seed...');
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
  } else {
    console.log(`✓ Organization exists: ${org.name}\n`);
  }

  // Seed glass rates and process masters
  console.log('🔧 Seeding glass rates and process masters...');
  execSync('npx ts-node prisma/seed-glass-data.ts', { stdio: 'inherit' });

  // Seed customers
  console.log('\n👥 Seeding customers...');
  execSync('npx ts-node prisma/seed-customers.ts', { stdio: 'inherit' });

  console.log('\n✅ All seed data loaded successfully!');
  console.log('\n📊 Summary:');
  
  const counts = await Promise.all([
    prisma.organization.count(),
    prisma.client.count(),
    prisma.glassRate.count(),
    prisma.processMaster.count(),
    prisma.quote.count(),
    prisma.order.count()
  ]);

  console.log(`   Organizations: ${counts[0]}`);
  console.log(`   Customers: ${counts[1]}`);
  console.log(`   Glass Rates: ${counts[2]}`);
  console.log(`   Process Masters: ${counts[3]}`);
  console.log(`   Quotes: ${counts[4]}`);
  console.log(`   Orders: ${counts[5]}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
