import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Repair number sequences by finding the highest existing number and updating the sequence
 */
export async function repairNumberSequence(organizationId: string, docType: string) {
  return prisma.$transaction(async (tx) => {
    let highestNumber = 0;
    const currentYear = new Date().getFullYear();
    
    // Find the highest existing number for this year
    switch (docType) {
      case 'QUOTE':
        const quotes = await tx.quote.findMany({
          where: { 
            organizationId,
            quoteNo: { startsWith: `Q${currentYear}-` }
          },
          select: { quoteNo: true }
        });
        
        quotes.forEach(quote => {
          const match = quote.quoteNo.match(/Q\d{4}-(\d{4})/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNumber) highestNumber = num;
          }
        });
        break;
        
      case 'ORDER':
        const orders = await tx.order.findMany({
          where: { 
            organizationId,
            orderNo: { startsWith: `O${currentYear}-` }
          },
          select: { orderNo: true }
        });
        
        orders.forEach(order => {
          const match = order.orderNo.match(/O\d{4}-(\d{4})/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNumber) highestNumber = num;
          }
        });
        break;
        
      case 'INVOICE':
        const invoices = await tx.invoice.findMany({
          where: { 
            organizationId,
            invoiceNo: { startsWith: `INV${currentYear}-` }
          },
          select: { invoiceNo: true }
        });
        
        invoices.forEach(invoice => {
          const match = invoice.invoiceNo.match(/INV\d{4}-(\d{4})/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNumber) highestNumber = num;
          }
        });
        break;
    }
    
    // Update the sequence to the next available number
    const nextNum = highestNumber + 1;
    
    await tx.numberSequence.upsert({
      where: {
        organizationId_docType: {
          organizationId,
          docType
        }
      },
      update: {
        nextNumber: nextNum
      },
      create: {
        organizationId,
        docType,
        pattern: docType === 'QUOTE' ? 'Q{YYYY}-{####}' : 
                docType === 'ORDER' ? 'O{YYYY}-{####}' : 
                'INV{YYYY}-{####}',
        nextNumber: nextNum
      }
    });
    
    console.log(`Repaired ${docType} sequence for org ${organizationId}: next number is ${nextNum}`);
    return nextNum;
  });
}

/**
 * Check and repair all number sequences for an organization
 */
export async function repairAllSequences(organizationId: string) {
  const docTypes = ['QUOTE', 'ORDER', 'INVOICE'];
  const results = [];
  
  for (const docType of docTypes) {
    try {
      const nextNum = await repairNumberSequence(organizationId, docType);
      results.push({ docType, nextNumber: nextNum, status: 'repaired' });
    } catch (error) {
      console.error(`Failed to repair ${docType} sequence:`, error);
      results.push({ docType, error: error.message, status: 'failed' });
    }
  }
  
  return results;
}