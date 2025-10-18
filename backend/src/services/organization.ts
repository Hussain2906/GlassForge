import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function initializeOrganizationDefaults(organizationId: string) {
  // Initialize number sequences for different document types
  const sequences = [
    { docType: 'QUOTE', pattern: 'Q{YYYY}-{####}' },
    { docType: 'ORDER', pattern: 'O{YYYY}-{####}' },
    { docType: 'INVOICE', pattern: 'INV{YYYY}-{####}' },
  ];

  await Promise.all(
    sequences.map(seq =>
      prisma.numberSequence.create({
        data: {
          organizationId,
          docType: seq.docType,
          pattern: seq.pattern,
          nextNumber: 1,
        },
      })
    )
  );
}