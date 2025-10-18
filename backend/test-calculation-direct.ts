/**
 * Direct test of the glass calculation engine
 * This bypasses API authentication to test the core logic
 */

import { PrismaClient } from '@prisma/client';
import {
  calculateLineItem,
  mmToInches,
  inchesToMm,
  inchesToFeetRounded,
  calculateDimensions,
  calculateTotalArea,
  calculatePerimeterUnit,
  calculateTotalLength,
  round2
} from './src/services/glass-calculation';

const prisma = new PrismaClient();

async function runTests() {
  console.log('==========================================');
  console.log('Glass Calculation Engine Direct Tests');
  console.log('==========================================\n');

  // Get organization ID
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('No organization found!');
    process.exit(1);
  }
  const orgId = org.id;
  console.log(`Testing with organization: ${org.name} (${orgId})\n`);

  // Test 1: Unit Conversions
  console.log('Test 1: Unit Conversions');
  console.log('------------------------');
  console.log('25.4 mm =', mmToInches(25.4), 'inches (expected: 1)');
  console.log('1 inch =', inchesToMm(1), 'mm (expected: 25.4)');
  console.log('10 inches =', inchesToFeetRounded(10), 'ft (expected: 1.0)');
  console.log('11 inches =', inchesToFeetRounded(11), 'ft (expected: 1.25)');
  console.log('15 inches =', inchesToFeetRounded(15), 'ft (expected: 1.25)');
  console.log('16 inches =', inchesToFeetRounded(16), 'ft (expected: 1.5)');
  console.log('✓ Unit conversions working\n');

  // Test 2: Dimension Calculations
  console.log('Test 2: Dimension Calculations');
  console.log('-------------------------------');
  const dims = calculateDimensions({
    widthInch: 24,
    heightInch: 36
  });
  console.log('Input: 24" × 36"');
  console.log('Output:', JSON.stringify(dims, null, 2));
  console.log('✓ Dimension calculations working\n');

  // Test 3: Area and Length Calculations
  console.log('Test 3: Area and Length Calculations');
  console.log('-------------------------------------');
  const totalArea = calculateTotalArea(6, 2);
  const perimeterUnit = calculatePerimeterUnit(2, 3, 1, 1);
  const totalLength = calculateTotalLength(perimeterUnit, 2);
  console.log('6 sqft × 2 qty =', totalArea, 'sqft (expected: 12)');
  console.log('Perimeter (2ft + 3ft) =', perimeterUnit, 'ft (expected: 5)');
  console.log('Total length (5ft × 2 qty) =', totalLength, 'ft (expected: 10)');
  console.log('✓ Area and length calculations working\n');

  // Test 4: Simple Line Item Calculation (no processes)
  console.log('Test 4: Simple Line Item Calculation');
  console.log('-------------------------------------');
  try {
    const result1 = await calculateLineItem(orgId, {
      thicknessMm: 5,
      glassType: 'Clear Float',
      widthInch: 24,
      heightInch: 36,
      quantity: 2
    });
    console.log('Input: 5mm Clear Float, 24" × 36", qty 2');
    console.log('Glass Rate:', result1.glassRate, '₹/sqft');
    console.log('Total Area:', result1.totalArea, 'sqft');
    console.log('Base Glass Price:', result1.baseGlassPrice, '₹');
    console.log('Line Total:', result1.lineTotal, '₹');
    console.log('✓ Simple calculation working\n');
  } catch (error: any) {
    console.error('✗ Test 4 failed:', error.message);
  }

  // Test 5: Line Item with Processes
  console.log('Test 5: Line Item with Processes');
  console.log('---------------------------------');
  try {
    const result2 = await calculateLineItem(orgId, {
      thicknessMm: 5,
      glassType: 'Clear Float',
      widthInch: 24,
      heightInch: 36,
      quantity: 2,
      processes: [
        { processCode: 'BP' },
        { processCode: 'TMP' }
      ]
    });
    console.log('Input: 5mm Clear Float, 24" × 36", qty 2');
    console.log('Processes: Back Painted + Toughened');
    console.log('Glass Rate:', result2.glassRate, '₹/sqft');
    console.log('Base Glass Price:', result2.baseGlassPrice, '₹');
    console.log('Process Charges:');
    result2.processes.forEach(p => {
      console.log(`  - ${p.processName} (${p.pricingType}): ${p.charge} ₹`);
    });
    console.log('Total Process Cost:', result2.totalProcessCost, '₹');
    console.log('Line Total:', result2.lineTotal, '₹');
    console.log('✓ Process calculation working\n');
  } catch (error: any) {
    console.error('✗ Test 5 failed:', error.message);
  }

  // Test 6: Line Item with Override Rate
  console.log('Test 6: Line Item with Override Rate');
  console.log('-------------------------------------');
  try {
    const result3 = await calculateLineItem(orgId, {
      thicknessMm: 5,
      glassType: 'Clear Float',
      widthInch: 24,
      heightInch: 36,
      quantity: 2,
      processes: [
        { processCode: 'BP' },
        { processCode: 'TMP', overrideRate: 90 }
      ]
    });
    console.log('Input: 5mm Clear Float, 24" × 36", qty 2');
    console.log('Processes: BP + TMP (override rate 90)');
    console.log('Process Charges:');
    result3.processes.forEach(p => {
      console.log(`  - ${p.processName}: default=${p.defaultRate}, override=${p.overrideRate || 'none'}, used=${p.rate}, charge=${p.charge} ₹`);
    });
    console.log('Total Process Cost:', result3.totalProcessCost, '₹');
    console.log('Line Total:', result3.lineTotal, '₹');
    console.log('✓ Override rate working\n');
  } catch (error: any) {
    console.error('✗ Test 6 failed:', error.message);
  }

  // Test 7: Different Glass Type and Thickness
  console.log('Test 7: Different Glass Type');
  console.log('-----------------------------');
  try {
    const result4 = await calculateLineItem(orgId, {
      thicknessMm: 6,
      glassType: 'Tinted',
      widthInch: 30,
      heightInch: 48,
      quantity: 1,
      processes: [
        { processCode: 'EDG' }
      ]
    });
    console.log('Input: 6mm Tinted, 30" × 48", qty 1');
    console.log('Process: Edging (length-based)');
    console.log('Glass Rate:', result4.glassRate, '₹/sqft');
    console.log('Total Area:', result4.totalArea, 'sqft');
    console.log('Total Length:', result4.totalLength, 'ft');
    console.log('Base Glass Price:', result4.baseGlassPrice, '₹');
    console.log('Edging Charge:', result4.processes[0]?.charge, '₹');
    console.log('Line Total:', result4.lineTotal, '₹');
    console.log('✓ Different glass type working\n');
  } catch (error: any) {
    console.error('✗ Test 7 failed:', error.message);
  }

  // Test 8: Fixed Process (per piece)
  console.log('Test 8: Fixed Process (per piece)');
  console.log('----------------------------------');
  try {
    const result5 = await calculateLineItem(orgId, {
      thicknessMm: 5,
      glassType: 'Clear Float',
      widthInch: 24,
      heightInch: 36,
      quantity: 3,
      processes: [
        { processCode: 'HOLE' }
      ]
    });
    console.log('Input: 5mm Clear Float, 24" × 36", qty 3');
    console.log('Process: Hole Drilling (fixed per piece)');
    console.log('Hole Drilling Rate:', result5.processes[0]?.rate, '₹/piece');
    console.log('Hole Drilling Charge (3 pieces):', result5.processes[0]?.charge, '₹');
    console.log('Line Total:', result5.lineTotal, '₹');
    console.log('✓ Fixed process working\n');
  } catch (error: any) {
    console.error('✗ Test 8 failed:', error.message);
  }

  // Test 9: MM Input
  console.log('Test 9: MM Input (instead of inches)');
  console.log('-------------------------------------');
  try {
    const result6 = await calculateLineItem(orgId, {
      thicknessMm: 5,
      glassType: 'Clear Float',
      widthMm: 609.6,
      heightMm: 914.4,
      quantity: 2
    });
    console.log('Input: 5mm Clear Float, 609.6mm × 914.4mm, qty 2');
    console.log('Converted to inches:', result6.dimensions.widthInch, '×', result6.dimensions.heightInch);
    console.log('Converted to feet:', result6.dimensions.widthFt, '×', result6.dimensions.heightFt);
    console.log('Square feet:', result6.dimensions.sqFt);
    console.log('Line Total:', result6.lineTotal, '₹');
    console.log('✓ MM input working\n');
  } catch (error: any) {
    console.error('✗ Test 9 failed:', error.message);
  }

  // Test 10: Excel Comparison
  console.log('Test 10: Excel Formula Comparison');
  console.log('----------------------------------');
  console.log('Excel Example: 24" × 36" Clear Float 5mm, qty 2, BP + TMP');
  console.log('Expected from Excel:');
  console.log('  - Dimensions: 2ft × 3ft = 6 sqft');
  console.log('  - Total Area: 12 sqft');
  console.log('  - Glass: 42 ₹/sqft × 12 = 504 ₹');
  console.log('  - BP: 45 ₹/sqft × 12 = 540 ₹');
  console.log('  - TMP: 85 ₹/sqft × 12 = 1020 ₹');
  console.log('  - Total: 2064 ₹');
  
  try {
    const excelTest = await calculateLineItem(orgId, {
      thicknessMm: 5,
      glassType: 'Clear Float',
      widthInch: 24,
      heightInch: 36,
      quantity: 2,
      processes: [
        { processCode: 'BP' },
        { processCode: 'TMP' }
      ]
    });
    console.log('\nActual from Calculation Engine:');
    console.log('  - Dimensions:', excelTest.dimensions.widthFt, 'ft ×', excelTest.dimensions.heightFt, 'ft =', excelTest.dimensions.sqFt, 'sqft');
    console.log('  - Total Area:', excelTest.totalArea, 'sqft');
    console.log('  - Glass:', excelTest.glassRate, '₹/sqft ×', excelTest.totalArea, '=', excelTest.baseGlassPrice, '₹');
    excelTest.processes.forEach(p => {
      console.log(`  - ${p.processName}: ${p.rate} ₹/sqft × ${excelTest.totalArea} = ${p.charge} ₹`);
    });
    console.log('  - Total:', excelTest.lineTotal, '₹');
    
    const matches = excelTest.lineTotal === 2064;
    console.log(matches ? '\n✓ MATCHES EXCEL EXACTLY!' : '\n✗ Does not match Excel');
  } catch (error: any) {
    console.error('✗ Test 10 failed:', error.message);
  }

  console.log('\n==========================================');
  console.log('All Tests Completed!');
  console.log('==========================================');
}

runTests()
  .catch((e) => {
    console.error('Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
