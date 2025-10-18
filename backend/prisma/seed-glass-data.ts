import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for glass rates and process masters
 * Run with: npx ts-node prisma/seed-glass-data.ts
 */

async function seedGlassRates(organizationId: string) {
  console.log('Seeding glass rates...');

  const glassTypes = [
    {
      glassType: 'Clear Float',
      rate_3_5mm: 35.00,
      rate_4mm: 38.00,
      rate_5mm: 42.00,
      rate_6mm: 48.00,
      rate_8mm: 62.00,
      rate_10mm: 78.00,
      rate_12mm: 95.00,
      rate_19mm: 145.00,
      rate_dgu: 180.00,
      notes: 'Standard clear float glass'
    },
    {
      glassType: 'Tinted',
      rate_3_5mm: 40.00,
      rate_4mm: 43.00,
      rate_5mm: 47.00,
      rate_6mm: 53.00,
      rate_8mm: 67.00,
      rate_10mm: 83.00,
      rate_12mm: 100.00,
      rate_19mm: 150.00,
      rate_dgu: 190.00,
      notes: 'Tinted glass - various colors'
    },
    {
      glassType: 'Laminated',
      rate_3_5mm: null,
      rate_4mm: null,
      rate_5mm: 65.00,
      rate_6mm: 72.00,
      rate_8mm: 88.00,
      rate_10mm: 105.00,
      rate_12mm: 125.00,
      rate_19mm: 180.00,
      rate_dgu: null,
      notes: 'Laminated safety glass'
    }
  ];

  for (const glassType of glassTypes) {
    await prisma.glassRate.upsert({
      where: {
        organizationId_glassType: {
          organizationId,
          glassType: glassType.glassType
        }
      },
      update: {},
      create: {
        organizationId,
        ...glassType,
        rate_3_5mm: glassType.rate_3_5mm ? new Prisma.Decimal(glassType.rate_3_5mm) : null,
        rate_4mm: glassType.rate_4mm ? new Prisma.Decimal(glassType.rate_4mm) : null,
        rate_5mm: glassType.rate_5mm ? new Prisma.Decimal(glassType.rate_5mm) : null,
        rate_6mm: glassType.rate_6mm ? new Prisma.Decimal(glassType.rate_6mm) : null,
        rate_8mm: glassType.rate_8mm ? new Prisma.Decimal(glassType.rate_8mm) : null,
        rate_10mm: glassType.rate_10mm ? new Prisma.Decimal(glassType.rate_10mm) : null,
        rate_12mm: glassType.rate_12mm ? new Prisma.Decimal(glassType.rate_12mm) : null,
        rate_19mm: glassType.rate_19mm ? new Prisma.Decimal(glassType.rate_19mm) : null,
        rate_dgu: glassType.rate_dgu ? new Prisma.Decimal(glassType.rate_dgu) : null
      }
    });
  }

  console.log(`✓ Seeded ${glassTypes.length} glass rates`);
}


async function seedProcessMasters(organizationId: string) {
  console.log('Seeding process masters...');

  const processes = [
    {
      processCode: 'BP',
      name: 'Back Painted',
      pricingType: 'A',
      rateA: 45.00,
      remarks: 'Back painting process'
    },
    {
      processCode: 'TMP',
      name: 'Toughened',
      pricingType: 'A',
      rateA: 85.00,
      remarks: 'Toughening/tempering process'
    },
    {
      processCode: 'EDG',
      name: 'Edging',
      pricingType: 'L',
      rateL: 12.00,
      remarks: 'Edge polishing'
    },
    {
      processCode: 'HOLE',
      name: 'Hole Drilling',
      pricingType: 'F',
      rateF: 50.00,
      remarks: 'Per hole charge'
    },
    {
      processCode: 'LAM',
      name: 'Lamination',
      pricingType: 'A',
      rateA: 95.00,
      remarks: 'Lamination process'
    }
  ];

  for (const process of processes) {
    await prisma.processMaster.upsert({
      where: {
        organizationId_processCode: {
          organizationId,
          processCode: process.processCode
        }
      },
      update: {},
      create: {
        organizationId,
        processCode: process.processCode,
        name: process.name,
        pricingType: process.pricingType,
        rateT: null,
        rateA: process.pricingType === 'A' && process.rateA ? new Prisma.Decimal(process.rateA) : null,
        rateL: process.pricingType === 'L' && process.rateL ? new Prisma.Decimal(process.rateL) : null,
        rateF: process.pricingType === 'F' && process.rateF ? new Prisma.Decimal(process.rateF) : null,
        rateS: null,
        rateW: null,
        rateY: null,
        rateZ: null,
        rateCOL: null,
        remarks: process.remarks
      }
    });
  }

  console.log(`✓ Seeded ${processes.length} process masters`);
}

async function main() {
  try {
    // Get the first organization (or specify an organization ID)
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      console.error('No organization found. Please create an organization first.');
      process.exit(1);
    }

    console.log(`Seeding data for organization: ${org.name} (${org.id})`);
    
    await seedGlassRates(org.id);
    await seedProcessMasters(org.id);
    
    console.log('✓ Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
