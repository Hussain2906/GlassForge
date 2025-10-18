import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  
  if (!org) {
    console.error('No organization found');
    process.exit(1);
  }

  console.log(`Seeding customers for: ${org.name}`);

  const customers = [
    {
      name: 'ABC Glass Co',
      phone: '+91 98765 43210',
      gstNumber: '29ABCDE1234F1Z5',
      billingAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    },
    {
      name: 'XYZ Constructions',
      phone: '+91 98765 43211',
      gstNumber: '27XYZAB5678G2Z6',
      billingAddress: {
        street: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      }
    },
    {
      name: 'John Doe',
      phone: '+91 98765 43212',
      gstNumber: null,
      billingAddress: {
        street: '789 Lake Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001'
      }
    },
    {
      name: 'Premium Interiors',
      phone: '+91 98765 43213',
      gstNumber: '33PQRST9012H3Z7',
      billingAddress: {
        street: '321 Garden Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      }
    },
    {
      name: 'Modern Homes Pvt Ltd',
      phone: '+91 98765 43214',
      gstNumber: '24MNOPQ3456I4Z8',
      billingAddress: {
        street: '654 Beach Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001'
      }
    }
  ];

  for (const customer of customers) {
    await prisma.client.upsert({
      where: {
        id: `customer-${customer.name.toLowerCase().replace(/\s+/g, '-')}`
      },
      update: {},
      create: {
        id: `customer-${customer.name.toLowerCase().replace(/\s+/g, '-')}`,
        organizationId: org.id,
        name: customer.name,
        phone: customer.phone,
        gstNumber: customer.gstNumber,
        billingAddress: customer.billingAddress
      }
    });
  }

  console.log(`✓ Seeded ${customers.length} customers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
