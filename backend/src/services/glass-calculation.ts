/**
 * Glass Order Calculation Engine
 * 
 * This service implements the Excel-based calculation logic for glass orders.
 * It handles unit conversions, area/perimeter calculations, rate lookups, and pricing.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface DimensionInput {
  widthMm?: number | undefined;
  heightMm?: number | undefined;
  widthInch?: number | undefined;
  heightInch?: number | undefined;
}

export interface DimensionCalculated {
  widthMm: number;
  heightMm: number;
  widthInch: number;
  heightInch: number;
  widthFt: number;      // Rounded up to nearest 3 inches
  heightFt: number;     // Rounded up to nearest 3 inches
  sqFt: number;         // widthFt * heightFt
}

export interface ProcessInput {
  processCode: string;
  overrideRate?: number;
}

export interface ProcessCalculation {
  processCode: string;
  processName: string;
  pricingType: 'F' | 'A' | 'L';
  defaultRate: number;
  overrideRate?: number | undefined;
  rate: number;  // The rate used (override or default)
  quantity: number;
  area?: number | undefined;
  length?: number | undefined;
  charge: number;
  rateColumn?: string | undefined;
}

export interface LineItemInput {
  thicknessMm: number;
  glassType: string;
  widthMm?: number;
  heightMm?: number;
  widthInch?: number;
  heightInch?: number;
  quantity: number;
  processes?: ProcessInput[];
  discountRate?: number;  // Optional override for glass rate
  perimeterCoeffW?: number;  // Default 1
  perimeterCoeffH?: number;  // Default 1
}

export interface LineCalculationResult {
  dimensions: DimensionCalculated;
  quantity: number;
  totalArea: number;
  totalLength: number;
  glassRate: number;
  baseGlassPrice: number;
  processes: ProcessCalculation[];
  totalProcessCost: number;
  lineTotal: number;
}

// ============================================================================
// UNIT CONVERSION UTILITIES
// ============================================================================

/**
 * Convert millimeters to inches
 * @param mm - Value in millimeters
 * @returns Value in inches
 */
export function mmToInches(mm: number): number {
  return mm / 25.4;
}

/**
 * Convert inches to millimeters
 * @param inches - Value in inches
 * @returns Value in millimeters
 */
export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

/**
 * Convert inches to feet with rounding up to nearest 3-inch increment
 * This matches Excel's CEILING function with 3-inch (0.25 ft) step
 * 
 * @param inches - Value in inches
 * @returns Value in feet, rounded up to nearest 0.25 ft (3 inches)
 * 
 * Examples:
 * - 10 inches -> 1.0 ft (10/12 = 0.833, rounds up to 1.0)
 * - 11 inches -> 1.25 ft (11/12 = 0.916, rounds up to 1.25)
 * - 15 inches -> 1.25 ft (15/12 = 1.25, already at step)
 * - 16 inches -> 1.5 ft (16/12 = 1.333, rounds up to 1.5)
 */
export function inchesToFeetRounded(inches: number): number {
  const feet = inches / 12;
  const step = 3 / 12; // 0.25 feet (3 inches)
  return Math.ceil(feet / step) * step;
}

/**
 * Calculate all dimension values from input
 * Handles both mm and inch inputs, converts to all units
 * 
 * @param input - Dimension input with either mm or inch values
 * @returns Complete dimension calculations in all units
 */
export function calculateDimensions(input: DimensionInput): DimensionCalculated {
  let widthMm: number;
  let heightMm: number;
  let widthInch: number;
  let heightInch: number;

  // Determine which input was provided and convert
  if (input.widthMm !== undefined && input.heightMm !== undefined) {
    // Input in mm, convert to inches
    widthMm = input.widthMm;
    heightMm = input.heightMm;
    widthInch = mmToInches(widthMm);
    heightInch = mmToInches(heightMm);
  } else if (input.widthInch !== undefined && input.heightInch !== undefined) {
    // Input in inches, convert to mm
    widthInch = input.widthInch;
    heightInch = input.heightInch;
    widthMm = inchesToMm(widthInch);
    heightMm = inchesToMm(heightInch);
  } else {
    throw new Error('Either widthMm/heightMm or widthInch/heightInch must be provided');
  }

  // Convert inches to feet with rounding
  const widthFt = inchesToFeetRounded(widthInch);
  const heightFt = inchesToFeetRounded(heightInch);

  // Calculate square feet
  const sqFt = widthFt * heightFt;

  return {
    widthMm: round2(widthMm),
    heightMm: round2(heightMm),
    widthInch: round2(widthInch),
    heightInch: round2(heightInch),
    widthFt: round2(widthFt),
    heightFt: round2(heightFt),
    sqFt: round2(sqFt)
  };
}

// ============================================================================
// AREA AND PERIMETER CALCULATIONS
// ============================================================================

/**
 * Calculate total area from square feet and quantity
 * @param sqFt - Square feet per piece
 * @param quantity - Number of pieces
 * @returns Total area
 */
export function calculateTotalArea(sqFt: number, quantity: number): number {
  return round2(sqFt * quantity);
}

/**
 * Calculate perimeter unit from feet dimensions with coefficients
 * Default coefficients are 1 for both width and height
 * 
 * @param widthFt - Width in feet
 * @param heightFt - Height in feet
 * @param coeffW - Width coefficient (default 1)
 * @param coeffH - Height coefficient (default 1)
 * @returns Perimeter unit
 */
export function calculatePerimeterUnit(
  widthFt: number,
  heightFt: number,
  coeffW: number = 1,
  coeffH: number = 1
): number {
  return round2((widthFt * coeffW) + (heightFt * coeffH));
}

/**
 * Calculate total length from perimeter unit and quantity
 * @param perimeterUnit - Perimeter per piece
 * @param quantity - Number of pieces
 * @returns Total length
 */
export function calculateTotalLength(perimeterUnit: number, quantity: number): number {
  return round2(perimeterUnit * quantity);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Round number to 2 decimal places
 * @param n - Number to round
 * @returns Rounded number
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Safely convert Prisma Decimal to number
 * @param decimal - Prisma Decimal value
 * @returns Number value or 0 if null/undefined
 */
export function decimalToNumber(decimal: Prisma.Decimal | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  return Number(decimal);
}


// ============================================================================
// GLASS RATE LOOKUP
// ============================================================================

/**
 * Lookup glass rate from GlassRate table
 * Implements INDEX-MATCH logic from Excel
 * 
 * @param orgId - Organization ID
 * @param glassType - Glass type name
 * @param thicknessMm - Thickness in millimeters
 * @returns Rate per sq.ft or null if not found
 */
export async function lookupGlassRate(
  orgId: string,
  glassType: string,
  thicknessMm: number
): Promise<number | null> {
  try {
    const glassRate = await prisma.glassRate.findUnique({
      where: {
        organizationId_glassType: {
          organizationId: orgId,
          glassType: glassType
        }
      }
    });

    if (!glassRate) {
      console.warn(`Glass rate not found for type: ${glassType}`);
      return null;
    }

    // Map thickness to column name
    const columnMap: Record<number, keyof typeof glassRate> = {
      3.5: 'rate_3_5mm',
      4: 'rate_4mm',
      5: 'rate_5mm',
      6: 'rate_6mm',
      8: 'rate_8mm',
      10: 'rate_10mm',
      12: 'rate_12mm',
      19: 'rate_19mm'
    };

    // Check if it's a standard thickness
    const column = columnMap[thicknessMm];
    if (column) {
      const rate = glassRate[column];
      return rate ? decimalToNumber(rate as Prisma.Decimal) : null;
    }

    // Check DGU
    if (thicknessMm === 0 || glassType.toLowerCase().includes('dgu')) {
      const rate = glassRate.rate_dgu;
      return rate ? decimalToNumber(rate) : null;
    }

    // Check custom rates
    if (glassRate.customRates) {
      const customRates = glassRate.customRates as Record<string, number>;
      const customKey = `${thicknessMm}mm`;
      if (customRates[customKey]) {
        return customRates[customKey];
      }
    }

    console.warn(`No rate found for thickness ${thicknessMm}mm in glass type: ${glassType}`);
    return null;
  } catch (error) {
    console.error('Error looking up glass rate:', error);
    return null;
  }
}

// ============================================================================
// PROCESS RATE LOOKUP AND CALCULATION
// ============================================================================

/**
 * Lookup process rate from ProcessMaster table
 * Implements INDEX-MATCH logic from Excel
 * 
 * @param orgId - Organization ID
 * @param processCode - Process code
 * @returns Process details with pricing type and rate, or null if not found
 */
export async function lookupProcess(
  orgId: string,
  processCode: string
): Promise<{ name: string; pricingType: 'F' | 'A' | 'L'; rate: number } | null> {
  try {
    const process = await prisma.processMaster.findUnique({
      where: {
        organizationId_processCode: {
          organizationId: orgId,
          processCode: processCode
        }
      }
    });

    if (!process) {
      console.warn(`Process not found: ${processCode}`);
      return null;
    }

    // Get the pricing type
    const pricingType = process.pricingType as 'F' | 'A' | 'L';

    // Map pricing type to rate column
    // In Excel, the rate column is determined by the pricing type
    // For simplicity, we'll use the primary rate columns
    let rate = 0;
    switch (pricingType) {
      case 'F':
        rate = decimalToNumber(process.rateF);
        break;
      case 'A':
        rate = decimalToNumber(process.rateA);
        break;
      case 'L':
        rate = decimalToNumber(process.rateL);
        break;
    }

    return {
      name: process.name,
      pricingType,
      rate
    };
  } catch (error) {
    console.error('Error looking up process:', error);
    return null;
  }
}

/**
 * Calculate process charge based on pricing type
 * 
 * @param pricingType - 'F' (Fixed per piece), 'A' (Per area), 'L' (Per length)
 * @param rate - Rate to apply
 * @param quantity - Number of pieces
 * @param totalArea - Total area in sq.ft
 * @param totalLength - Total length
 * @returns Calculated charge
 */
export function calculateProcessCharge(
  pricingType: 'F' | 'A' | 'L',
  rate: number,
  quantity: number,
  totalArea: number,
  totalLength: number
): number {
  switch (pricingType) {
    case 'F': // Fixed per piece
      return round2(rate * quantity);
    case 'A': // Per area
      return round2(rate * totalArea);
    case 'L': // Per length
      return round2(rate * totalLength);
    default:
      return 0;
  }
}

// ============================================================================
// LINE ITEM CALCULATION ORCHESTRATOR
// ============================================================================

/**
 * Calculate complete line item with all values
 * This orchestrates all calculations in the correct sequence to match Excel
 * 
 * @param orgId - Organization ID
 * @param input - Line item input data
 * @returns Complete calculation result
 */
export async function calculateLineItem(
  orgId: string,
  input: LineItemInput
): Promise<LineCalculationResult> {
  try {
    // Step 1: Calculate dimensions (unit conversions and rounding)
    const dimensions = calculateDimensions({
      widthMm: input.widthMm,
      heightMm: input.heightMm,
      widthInch: input.widthInch,
      heightInch: input.heightInch
    });

    // Step 2: Calculate total area
    const totalArea = calculateTotalArea(dimensions.sqFt, input.quantity);

    // Step 3: Calculate perimeter and total length
    const perimeterUnit = calculatePerimeterUnit(
      dimensions.widthFt,
      dimensions.heightFt,
      input.perimeterCoeffW || 1,
      input.perimeterCoeffH || 1
    );
    const totalLength = calculateTotalLength(perimeterUnit, input.quantity);

    // Step 4: Lookup glass rate
    let glassRate = 0;
    if (input.discountRate !== undefined) {
      // Use discount rate if provided
      glassRate = input.discountRate;
    } else {
      // Lookup from master table
      const lookedUpRate = await lookupGlassRate(orgId, input.glassType, input.thicknessMm);
      glassRate = lookedUpRate || 0;
    }

    // Step 5: Calculate base glass price
    const baseGlassPrice = round2(glassRate * totalArea);

    // Step 6: Calculate process charges
    const processes: ProcessCalculation[] = [];
    let totalProcessCost = 0;

    if (input.processes && input.processes.length > 0) {
      for (const processInput of input.processes) {
        const processDetails = await lookupProcess(orgId, processInput.processCode);
        
        if (!processDetails) {
          // Process not found, skip it
          console.warn(`Skipping process ${processInput.processCode} - not found`);
          continue;
        }

        // Use override rate if provided, otherwise use default
        const rate = processInput.overrideRate !== undefined 
          ? processInput.overrideRate 
          : processDetails.rate;

        // Calculate charge based on pricing type
        const charge = calculateProcessCharge(
          processDetails.pricingType,
          rate,
          input.quantity,
          totalArea,
          totalLength
        );

        processes.push({
          processCode: processInput.processCode,
          processName: processDetails.name,
          pricingType: processDetails.pricingType,
          defaultRate: processDetails.rate,
          overrideRate: processInput.overrideRate,
          rate,
          quantity: input.quantity,
          area: totalArea,
          length: totalLength,
          charge
        });

        totalProcessCost += charge;
      }
    }

    totalProcessCost = round2(totalProcessCost);

    // Step 7: Calculate line total
    const lineTotal = round2(baseGlassPrice + totalProcessCost);

    return {
      dimensions,
      quantity: input.quantity,
      totalArea,
      totalLength,
      glassRate,
      baseGlassPrice,
      processes,
      totalProcessCost,
      lineTotal
    };
  } catch (error) {
    console.error('Error calculating line item:', error);
    throw error;
  }
}

/**
 * Calculate order totals from line items and additional charges
 * 
 * @param lineItems - Array of line calculation results
 * @param additionalCharges - Additional charges object
 * @returns Order totals
 */
export function calculateOrderTotals(
  lineItems: LineCalculationResult[],
  additionalCharges: {
    deliveryCharge?: number;
    loadingCharge?: number;
    labourCharge?: number;
    fittingsCharge?: number;
    additionalCharge?: number;
  } = {}
): {
  subtotal: number;
  deliveryCharge: number;
  loadingCharge: number;
  labourCharge: number;
  fittingsCharge: number;
  additionalCharge: number;
  billAmount: number;
} {
  // Sum all line totals
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));

  // Get additional charges (default to 0)
  const deliveryCharge = additionalCharges.deliveryCharge || 0;
  const loadingCharge = additionalCharges.loadingCharge || 0;
  const labourCharge = additionalCharges.labourCharge || 0;
  const fittingsCharge = additionalCharges.fittingsCharge || 0;
  const additionalCharge = additionalCharges.additionalCharge || 0;

  // Calculate bill amount
  const billAmount = round2(
    subtotal + 
    deliveryCharge + 
    loadingCharge + 
    labourCharge + 
    fittingsCharge + 
    additionalCharge
  );

  return {
    subtotal,
    deliveryCharge,
    loadingCharge,
    labourCharge,
    fittingsCharge,
    additionalCharge,
    billAmount
  };
}

/**
 * Calculate balance from bill amount and advance
 * 
 * @param billAmount - Total bill amount
 * @param advanceAmount - Advance payment received
 * @returns Balance amount (can be negative if overpaid)
 */
export function calculateBalance(billAmount: number, advanceAmount: number): number {
  return round2(billAmount - advanceAmount);
}
