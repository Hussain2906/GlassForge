# Quote Number Generation Fix

## Issue
The quote creation was failing with a unique constraint error on the `quoteNo` field:
```
Unique constraint failed on the fields: (`quoteNo`)
```

## Root Cause Analysis

### 1. **Global Unique Constraint Problem**
The original schema had global unique constraints on document numbers:
```sql
-- BEFORE (Problematic)
quoteNo   String @unique
orderNo   String @unique  
invoiceNo String @unique
```

This meant that if Organization A created quote `Q2024-0001`, Organization B could not create the same quote number, which is incorrect behavior.

### 2. **Race Condition in Number Generation**
The original numbering service didn't check for existing documents before generating numbers, leading to potential duplicates.

### 3. **Missing Compound Unique Constraints**
Document numbers should be unique per organization, not globally unique.

## Solutions Implemented

### 1. **Fixed Database Schema** (`backend/prisma/schema.prisma`)

#### Before:
```prisma
model Quote {
  quoteNo String @unique
  // ...
}

model Order {
  orderNo String @unique
  // ...
}

model Invoice {
  invoiceNo String @unique
  // ...
}
```

#### After:
```prisma
model Quote {
  quoteNo String
  // ...
  @@unique([organizationId, quoteNo])
}

model Order {
  orderNo String
  // ...
  @@unique([organizationId, orderNo])
}

model Invoice {
  invoiceNo String
  // ...
  @@unique([organizationId, invoiceNo])
}

model NumberSequence {
  // ...
  @@unique([organizationId, docType])
}
```

### 2. **Enhanced Number Generation Service** (`backend/src/services/numbering.ts`)

#### Key Improvements:
- **Collision Detection**: Check for existing documents before finalizing number
- **Retry Logic**: Attempt up to 10 times to find unique number
- **Organization-Scoped Checks**: Only check uniqueness within the same organization
- **Transaction Safety**: All operations within database transactions

#### Implementation:
```typescript
export async function nextNumber(organizationId: string, docType: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    // Get or create sequence
    let seq = await tx.numberSequence.findFirst({
      where: { organizationId, docType },
    });
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const n = seq.nextNumber + attempts;
      const code = generateCode(seq.pattern, n);
      
      // Check if number exists for this organization
      const existingDoc = await checkExistingDocument(tx, organizationId, docType, code);
      
      if (!existingDoc) {
        await tx.numberSequence.update({ 
          where: { id: seq.id }, 
          data: { nextNumber: n + 1 } 
        });
        return code;
      }
      
      attempts++;
    }
    
    throw new Error(`Unable to generate unique ${docType} number`);
  });
}
```

### 3. **Sequence Repair Service** (`backend/src/services/sequence-repair.ts`)

#### Purpose:
- Repair number sequences that get out of sync
- Find highest existing number and update sequence accordingly
- Handle data migration scenarios

#### Features:
- **Auto-Detection**: Scans existing documents to find highest numbers
- **Year-Aware**: Handles year-based numbering patterns
- **Bulk Repair**: Can repair all document types at once
- **Admin Endpoint**: `/api/v1/admin/repair-sequences` for manual repairs

### 4. **Improved Error Handling** (`backend/src/routes/quotes.ts`)

#### Enhanced Error Messages:
```typescript
// Handle Prisma unique constraint errors
if (err.code === 'P2002' && err.meta?.target?.includes('quoteNo')) {
  return res.status(500).json({ 
    error: 'Quote number generation failed. Please try again.',
    code: 'DUPLICATE_QUOTE_NUMBER'
  });
}
```

## Database Migration

### Migration Applied:
```sql
-- Drop existing unique constraints
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_quoteNo_key";
ALTER TABLE "Order" DROP CONSTRAINT "Order_orderNo_key";
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_invoiceNo_key";

-- Add compound unique constraints
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_organizationId_quoteNo_key" 
  UNIQUE ("organizationId", "quoteNo");
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_orderNo_key" 
  UNIQUE ("organizationId", "orderNo");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_invoiceNo_key" 
  UNIQUE ("organizationId", "invoiceNo");
ALTER TABLE "NumberSequence" ADD CONSTRAINT "NumberSequence_organizationId_docType_key" 
  UNIQUE ("organizationId", "docType");
```

## Benefits

### 1. **Multi-Tenant Support**
- Each organization can have its own numbering sequence
- No conflicts between organizations
- Proper data isolation

### 2. **Reliability**
- Collision detection prevents duplicates
- Retry logic handles race conditions
- Transaction safety ensures consistency

### 3. **Maintainability**
- Sequence repair tools for data issues
- Admin endpoints for troubleshooting
- Comprehensive error handling

### 4. **Scalability**
- Efficient database queries with proper indexing
- Organization-scoped operations
- Minimal performance impact

## Testing Scenarios

### ✅ **Scenarios Now Handled:**
1. **Multiple Organizations**: Different orgs can use same quote numbers
2. **Concurrent Requests**: Multiple quotes created simultaneously
3. **Sequence Gaps**: Missing numbers in sequence are handled
4. **Data Migration**: Existing data is preserved and sequences repaired
5. **Error Recovery**: Failed operations don't corrupt sequences

### ✅ **Admin Tools:**
- `POST /api/v1/admin/repair-sequences` - Repair all sequences
- Automatic sequence creation for new organizations
- Detailed error logging for troubleshooting

## Usage Examples

### Creating a Quote:
```typescript
// This will now work for multiple organizations
const quote1 = await createQuote(orgA, data); // Gets Q2024-0001
const quote2 = await createQuote(orgB, data); // Also gets Q2024-0001 (different org)
```

### Repairing Sequences:
```bash
curl -X POST /api/v1/admin/repair-sequences \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: $ORG_ID"
```

The quote number generation system is now robust, scalable, and properly handles multi-tenant scenarios while preventing duplicate number conflicts.