import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function nextNumber(organizationId: string, docType: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    let seq = await tx.numberSequence.findFirst({
      where: { organizationId, docType },
    });
    
    // If no sequence exists, create a default one
    if (!seq) {
      const patterns: Record<string, string> = {
        'QUOTE': 'Q{YYYY}-{####}',
        'ORDER': 'O{YYYY}-{####}',
        'INVOICE': 'INV{YYYY}-{####}',
      };
      
      seq = await tx.numberSequence.create({
        data: {
          organizationId,
          docType,
          pattern: patterns[docType] || `${docType}{YYYY}-{####}`,
          nextNumber: 1,
        },
      });
    }
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const n = seq.nextNumber + attempts;
      const now = new Date();
      const yyyy = now.getFullYear();
      const hash = `${n}`.padStart(4, '0');
      const code = seq.pattern.replace('{YYYY}', `${yyyy}`).replace('{####}', hash);
      
      // Check if this number already exists for this organization
      let existingDoc;
      switch (docType) {
        case 'QUOTE':
          existingDoc = await tx.quote.findUnique({ 
            where: { 
              organizationId_quoteNo: { 
                organizationId, 
                quoteNo: code 
              } 
            } 
          });
          break;
        case 'ORDER':
          existingDoc = await tx.order.findUnique({ 
            where: { 
              organizationId_orderNo: { 
                organizationId, 
                orderNo: code 
              } 
            } 
          });
          break;
        case 'INVOICE':
          existingDoc = await tx.invoice.findUnique({ 
            where: { 
              organizationId_invoiceNo: { 
                organizationId, 
                invoiceNo: code 
              } 
            } 
          });
          break;
      }
      
      if (!existingDoc) {
        // Update the sequence to the next available number
        await tx.numberSequence.update({ 
          where: { id: seq.id }, 
          data: { nextNumber: n + 1 } 
        });
        return code;
      }
      
      attempts++;
    }
    
    throw new Error(`Unable to generate unique ${docType} number after ${maxAttempts} attempts`);
  });
}
