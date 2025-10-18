import { PrismaClient, PriceRule } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin',
      passwordHash: await bcrypt.hash('admin123', 10)
    }
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Your Shop',
      slug: 'your-shop',
      settings: {},
      users: { create: [{ userId: admin.id, role: 'ADMIN' }] },
      numbers: {
        create: [
          { docType: 'QUOTE', pattern: 'QUO-{YYYY}-{####}' },
          { docType: 'ORDER', pattern: 'ORD-{YYYY}-{####}' },
          { docType: 'INVOICE', pattern: 'INV-{YYYY}-{####}' }
        ]
      },
      workflows: {
        create: [
          {
            entity: 'quote',
            name: 'Quote Flow',
            initialState: 'DRAFT',
            states: [{ key: 'DRAFT', label: 'Draft' }, { key: 'FINALIZED', label: 'Finalized' }, { key: 'CANCELLED', label: 'Cancelled' }],
            transitions: [
              { from: 'DRAFT', to: 'FINALIZED', label: 'Finalize' },
              { from: 'DRAFT', to: 'CANCELLED', label: 'Cancel' }
            ]
          },
          {
            entity: 'order',
            name: 'Order Flow',
            initialState: 'NEW',
            states: [
              { key: 'NEW', label: 'New' },
              { key: 'CONFIRMED', label: 'Confirmed' },
              { key: 'IN_PRODUCTION', label: 'In Production' },
              { key: 'READY', label: 'Ready' },
              { key: 'DELIVERED', label: 'Delivered' }
            ],
            transitions: [
              { from: 'NEW', to: 'CONFIRMED', label: 'Confirm' },
              { from: 'CONFIRMED', to: 'IN_PRODUCTION', label: 'Start Prod' },
              { from: 'IN_PRODUCTION', to: 'READY', label: 'Finish' },
              { from: 'READY', to: 'DELIVERED', label: 'Deliver' }
            ]
          }
        ]
      },
      settingsKV: {
        create: [
          { key: 'min_charge', value: 0 },
          { key: 'wastage_percent', value: 0 }
        ]
      },
      taxes: {
        create: [
          { name: 'CGST', rate: 0.09 },
          { name: 'SGST', rate: 0.09 },
          { name: 'IGST', rate: 0.18 }
        ]
      },
      products: {
        create: [
          { name: 'Clear Float', thicknessMm: 8, unitPrice: 750 },
          { name: 'Clear Float', thicknessMm: 10, unitPrice: 900 }
        ]
      },
      processes: {
        create: [
          { name: 'Tempering',    priceRule: PriceRule.PER_AREA, rate: 150, unit: 'sqm' },
          { name: 'Polish Edge',  priceRule: PriceRule.PER_EDGE, rate: 50,  unit: 'm'   },
          { name: 'Delivery',     priceRule: PriceRule.FLAT,     rate: 300, unit: 'job' }
        ]
      }
    }
  });

  console.log('Seeded org:', org.slug);
}

main().finally(() => prisma.$disconnect());
