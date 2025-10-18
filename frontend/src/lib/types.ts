export type Role = 'ADMIN'|'STAFF'|'VIEWER';

export type Product = {
  id: string;
  name: string;
  thicknessMm?: number | null;
  unitPrice: number;          // ₹ per m²
  attributes?: any | null;    // may contain { defaultProcesses: Process[] }
  notes?: string | null;
};

export type ProcessDefinition = {
  id: string;
  name: string;
  priceRule: 'PER_AREA'|'PER_EDGE'|'FLAT';
  rate: number;
  unit?: string | null;
  attributes?: any | null;
};

export type QuoteItemInput = {
  productId?: string;
  productName: string;
  thicknessMm: number;
  lengthMm: number;
  widthMm: number;
  qty: number;
  unitPrice: number;
  processes: Array<{ priceRule: 'PER_AREA'|'PER_EDGE'|'FLAT'; rate: number; unit?: string }>;
};

// ============================================================================
// GLASS CALCULATION SYSTEM TYPES
// ============================================================================

export type GlassRate = {
  id: string;
  organizationId: string;
  glassType: string;
  rate_3_5mm?: number | null;
  rate_4mm?: number | null;
  rate_5mm?: number | null;
  rate_6mm?: number | null;
  rate_8mm?: number | null;
  rate_10mm?: number | null;
  rate_12mm?: number | null;
  rate_19mm?: number | null;
  rate_dgu?: number | null;
  customRates?: Record<string, number> | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProcessMaster = {
  id: string;
  organizationId: string;
  processCode: string;
  name: string;
  pricingType: 'F' | 'A' | 'L'; // Fixed, Area, Length
  rateT?: number | null;
  rateA?: number | null;
  rateL?: number | null;
  rateF?: number | null;
  rateS?: number | null;
  rateW?: number | null;
  rateY?: number | null;
  rateZ?: number | null;
  rateCOL?: number | null;
  remarks?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LineCalculationInput = {
  thicknessMm: number;
  glassType: string;
  widthMm?: number;
  heightMm?: number;
  widthInch?: number;
  heightInch?: number;
  quantity: number;
  processes?: Array<{
    processCode: string;
    overrideRate?: number;
  }>;
  discountRate?: number;
  perimeterCoeffW?: number;
  perimeterCoeffH?: number;
};

export type DimensionCalculated = {
  widthMm: number;
  heightMm: number;
  widthInch: number;
  heightInch: number;
  widthFt: number;
  heightFt: number;
  sqFt: number;
};

export type ProcessCalculation = {
  processCode: string;
  processName: string;
  pricingType: 'F' | 'A' | 'L';
  defaultRate: number;
  overrideRate?: number;
  rate: number;
  quantity: number;
  area?: number;
  length?: number;
  charge: number;
  rateColumn?: string;
};

export type LineCalculationResult = {
  dimensions: DimensionCalculated;
  quantity: number;
  totalArea: number;
  totalLength: number;
  glassRate: number;
  baseGlassPrice: number;
  processes: ProcessCalculation[];
  totalProcessCost: number;
  lineTotal: number;
};
