'use client';

import Topbar from '@/components/Topbar';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { apiV1 } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import CustomerCombobox from '@/components/CustomerCombobox';
import CreateCustomerModal from '@/components/CreateCustomerModal';
import type { GlassRate } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, X, Trash2, Edit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


// Calculation functions - dimensions in INCHES
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function inchToFt(inch: number, roundingStepInch = 3) {
  const ft = inch / 12;
  const step = roundingStepInch / 12;
  return Math.ceil(ft / step) * step;
}

function computeDimensions(widthInch: number, heightInch: number) {
  const widthFt = inchToFt(widthInch);
  const heightFt = inchToFt(heightInch);
  const sqFt = widthFt * heightFt;
  return { widthFt, heightFt, sqFt };
}

type ProcessItem = {
  id: string;
  processCode: string;
  processName: string;
  pricingType: 'F' | 'A' | 'L';
  rate: number;
};

type LineItem = {
  id: string;
  glassType: string;
  thicknessMm: number;
  widthInch: number;
  heightInch: number;
  qty: number;
  processes: ProcessItem[];
};

const itemSchema = z.object({
  id: z.string(),
  glassType: z.string().min(1, 'Required'),
  thicknessMm: z.coerce.number().positive('Required'),
  widthInch: z.coerce.number().positive('Required'),
  heightInch: z.coerce.number().positive('Required'),
  qty: z.coerce.number().int().positive('Required'),
  processes: z.array(z.object({
    id: z.string(),
    processCode: z.string(),
    processName: z.string(),
    pricingType: z.enum(['F', 'A', 'L']),
    rate: z.coerce.number().nonnegative(),
  })).default([])
});

const schema = z.object({
  customerId: z.string().optional(),
  date: z.string().optional(),
  taxMode: z.enum(['INTRA', 'INTER']).default('INTRA'),
  enableGST: z.boolean().default(true),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type FormData = z.infer<typeof schema>;

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  gstNumber?: string | null;
};

export default function NewQuote() {
  const r = useRouter();

  const [glassRates, setGlassRates] = useState<GlassRate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  
  // Dimension modal state
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [dimensionModalData, setDimensionModalData] = useState<{
    itemIndex: number;
    glassType: string;
    thicknessMm: number;
  } | null>(null);
  const [tempDimensions, setTempDimensions] = useState({ widthInch: 12, heightInch: 24 });

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const [glassRatesList, customerList, productList] = await Promise.all([
          apiV1.get('admin/glass-rates').json<GlassRate[]>(),
          apiV1.get('customers').json<Customer[]>(),
          apiV1.get('admin/products').json<any[]>()
        ]);
        setGlassRates(glassRatesList.filter(g => g.isActive));
        setCustomers(customerList);
        setProducts(productList);
      } catch {
        setGlassRates([]);
        setCustomers([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { control, register, handleSubmit, watch, setValue, formState: { isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        customerId: undefined,
        date: new Date().toISOString().split('T')[0],
        taxMode: 'INTRA',
        enableGST: true,
        discountPercent: 0,
        items: []
      }
    });

  const { fields, append, remove, update } = useFieldArray({ control, name: 'items' });
  const fv = watch();

  // Get glass rate for a specific glass type and thickness
  const getGlassRate = (glassType: string, thicknessMm: number): number => {
    const rate = glassRates.find(r => r.glassType === glassType);
    if (!rate) return 0;

    let thicknessKey: keyof GlassRate;
    
    if (thicknessMm === 3.5) {
      thicknessKey = 'rate_3_5mm';
    } else if (thicknessMm === 4) {
      thicknessKey = 'rate_4mm';
    } else if (thicknessMm === 5) {
      thicknessKey = 'rate_5mm';
    } else if (thicknessMm === 6) {
      thicknessKey = 'rate_6mm';
    } else if (thicknessMm === 8) {
      thicknessKey = 'rate_8mm';
    } else if (thicknessMm === 10) {
      thicknessKey = 'rate_10mm';
    } else if (thicknessMm === 12) {
      thicknessKey = 'rate_12mm';
    } else if (thicknessMm === 19) {
      thicknessKey = 'rate_19mm';
    } else {
      return 0;
    }
    
    const rateValue = rate[thicknessKey];
    
    if (rateValue !== null && rateValue !== undefined) {
      const numValue = typeof rateValue === 'string' ? parseFloat(rateValue) : rateValue;
      if (!isNaN(numValue)) return numValue;
    }
    
    return 0;
  };

  // Calculate line totals
  const calculateLine = (item: LineItem) => {
    if (!item.glassType || !item.widthInch || !item.heightInch) {
      return {
        dims: { widthFt: 0, heightFt: 0, sqFt: 0 },
        totalArea: 0,
        totalLength: 0,
        glassRate: 0,
        baseGlassPrice: 0,
        totalProcessCost: 0,
        lineTotal: 0
      };
    }

    const dims = computeDimensions(item.widthInch, item.heightInch);
    const qty = Number(item.qty) || 1; // Ensure qty is a number
    const totalArea = dims.sqFt * qty;
    const totalLength = (dims.widthFt + dims.heightFt) * 2 * qty;
    
    const glassRate = getGlassRate(item.glassType, item.thicknessMm);
    const baseGlassPrice = glassRate * totalArea;
    
    let totalProcessCost = 0;
    item.processes.forEach(proc => {
      if (proc.pricingType === 'F') {
        totalProcessCost += proc.rate * qty;
      } else if (proc.pricingType === 'A') {
        totalProcessCost += proc.rate * totalArea;
      } else if (proc.pricingType === 'L') {
        totalProcessCost += proc.rate * totalLength;
      }
    });
    
    const lineTotal = baseGlassPrice + totalProcessCost;
    
    return {
      dims,
      totalArea,
      totalLength,
      glassRate,
      baseGlassPrice,
      totalProcessCost,
      lineTotal: round2(lineTotal)
    };
  };

  // Calculate totals with discount
  const totals = useMemo(() => {
    let subtotal = 0;
    const lines = fv.items.map((item) => {
      const calc = calculateLine(item as LineItem);
      subtotal += calc.lineTotal;
      return calc;
    });
    
    const discountAmount = round2(subtotal * (fv.discountPercent / 100));
    const afterDiscount = round2(subtotal - discountAmount);
    const tax = fv.enableGST ? round2(afterDiscount * 0.18) : 0;
    const breakdown = fv.taxMode === 'INTRA'
      ? { cgst: round2(tax / 2), sgst: round2(tax / 2), igst: 0 }
      : { cgst: 0, sgst: 0, igst: tax };
    
    return { 
      subtotal: round2(subtotal), 
      discountAmount,
      afterDiscount,
      tax, 
      total: round2(afterDiscount + tax), 
      lines, 
      breakdown 
    };
  }, [fv.items, fv.taxMode, fv.enableGST, fv.discountPercent]);



  const onSelectCustomer = (customer: Customer | null) => {
    setValue('customerId', customer?.id);
  };

  const onCustomerCreated = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    setValue('customerId', customer.id);
  };

  // Open dimension modal when glass type is selected
  const openDimensionModal = (itemIndex: number, glassType: string, thicknessMm: number) => {
    setDimensionModalData({ itemIndex, glassType, thicknessMm });
    setTempDimensions({ widthInch: 12, heightInch: 24 });
    setShowDimensionModal(true);
  };

  // Add product with dimensions
  const addProductWithDimensions = () => {
    if (!dimensionModalData) return;
    
    const { itemIndex, glassType, thicknessMm } = dimensionModalData;
    const currentItem = fv.items[itemIndex];
    
    update(itemIndex, {
      ...currentItem,
      glassType,
      thicknessMm,
      widthInch: tempDimensions.widthInch,
      heightInch: tempDimensions.heightInch
    });
    
    setShowDimensionModal(false);
    setDimensionModalData(null);
  };

  // Add new product (manual entry)
  const addNewProduct = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      glassType: '',
      thicknessMm: 8,
      widthInch: 12,
      heightInch: 24,
      qty: 1,
      processes: []
    };
    append(newItem);
  };

  // Add product from saved products
  // Add product from saved products
  const addProductFromTemplate = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    const attrs = product.attributes as any;
    
    if (!attrs || !attrs.glassType) {
      toast.error('Product is missing glass type information. Please recreate this product.');
      return;
    }

    const newItem = {
      id: `item_${Date.now()}`,
      glassType: attrs.glassType,
      thicknessMm: Number(product.thicknessMm) || 8,
      widthInch: Number(attrs.widthInch) || 12,
      heightInch: Number(attrs.heightInch) || 24,
      qty: 1,
      processes: []
    };
    
    append(newItem);
    toast.success(`Added ${product.name}`);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const organizationId = localStorage.getItem('orgId');
      if (!organizationId) {
        toast.error('No organization selected');
        return;
      }

      // Transform data to match backend expectations
      const payload = {
        organizationId,
        clientId: data.customerId,
        date: data.date,
        taxMode: data.taxMode,
        enableGST: data.enableGST,
        discountPercent: data.discountPercent,
        notes: data.notes,
        items: data.items.map(item => ({
          glassType: item.glassType,
          thicknessMm: item.thicknessMm,
          widthInch: item.widthInch,
          heightInch: item.heightInch,
          qty: item.qty,
          processes: item.processes.map(p => ({
            processCode: p.processCode,
            processName: p.processName,
            pricingType: p.pricingType,
            rate: p.rate
          }))
        }))
      };

      const res = await apiV1.post('quotes', { json: payload }).json<any>();
      toast.success('Quote created successfully');
      r.push(`/quotes/${res.id}`);
    } catch (e: any) {
      let msg = 'Failed to create quote.';
      try { msg = (await e.response.json()).error || msg; } catch { }
      toast.error(`Error: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div>
        <Topbar />
        <div className="p-6 text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  // Get unique glass types with their available thicknesses
  const glassTypes = Array.from(new Set(glassRates.map(r => r.glassType)));
  
  // Get available thicknesses for a glass type
  const getAvailableThicknesses = (glassType: string): number[] => {
    const rate = glassRates.find(r => r.glassType === glassType);
    if (!rate) return [];
    
    const thicknesses: number[] = [];
    const thicknessKeys = ['rate_3_5mm', 'rate_4mm', 'rate_5mm', 'rate_6mm', 'rate_8mm', 'rate_10mm', 'rate_12mm', 'rate_19mm', 'rate_dgu'];
    const thicknessValues = [3.5, 4, 5, 6, 8, 10, 12, 19, 0]; // 0 for DGU
    
    thicknessKeys.forEach((key, idx) => {
      if (rate[key as keyof GlassRate] && typeof rate[key as keyof GlassRate] === 'number') {
        thicknesses.push(thicknessValues[idx]);
      }
    });
    
    return thicknesses;
  };

  return (
    <div>
      <Topbar />
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">New Quote</h1>
            <p className="text-sm text-gray-600">Create a quote with automatic glass pricing and process calculations</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-right text-sm">
              <div>Subtotal: <span className="font-medium">₹ {totals.subtotal.toFixed(2)}</span></div>
              {fv.discountPercent > 0 && (
                <div className="text-green-600">Discount ({fv.discountPercent}%): -₹ {totals.discountAmount.toFixed(2)}</div>
              )}
              {fv.enableGST && <div>Tax (GST): <span className="font-medium">₹ {totals.tax.toFixed(2)}</span></div>}
              <div className="text-base">Total: <span className="font-semibold">₹ {totals.total.toFixed(2)}</span></div>
            </div>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || fv.items.length === 0}>
              {isSubmitting ? 'Creating...' : 'Create Quote'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <CustomerCombobox
                  customers={customers}
                  value={fv.customerId}
                  onChange={onSelectCustomer}
                  onCreateNew={() => setShowCreateCustomer(true)}
                  placeholder="Select customer or create new..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  {...register('date')}
                />
              </div>
            </div>

            <Separator />

            {/* Tax & Discount Settings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableGST"
                  checked={fv.enableGST}
                  onChange={(e) => setValue('enableGST', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="enableGST" className="cursor-pointer">Enable GST (18%)</Label>
              </div>
              {fv.enableGST && (
                <div>
                  <Label>Tax Mode</Label>
                  <Select value={fv.taxMode} onValueChange={(value: 'INTRA' | 'INTER') => setValue('taxMode', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTRA">INTRA (CGST+SGST)</SelectItem>
                      <SelectItem value="INTER">INTER (IGST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register('discountPercent')}
                  placeholder="0"
                />
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Products</Label>
              <div className="flex gap-2">
                {products.length > 0 && (
                  <Select value="" onValueChange={addProductFromTemplate}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Add from saved products..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - ₹{Number(p.unitPrice).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addNewProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Custom Product
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products added yet.</p>
                  <p className="text-sm">Click "Add Product" to get started.</p>
                </div>
              )}
              
              {fields.map((field, i) => {
                const calc = totals.lines[i];
                const item = fv.items[i];
                const hasGlassType = item?.glassType && item.glassType !== '';
                
                return (
                  <div key={field.id} className="rounded-lg border bg-white p-4 space-y-4">
                    {/* Item Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Product {i + 1}</Badge>
                        {hasGlassType && (
                          <span className="text-sm font-medium">{item.glassType} {item.thicknessMm}mm</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {hasGlassType && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openDimensionModal(i, item.glassType, item.thicknessMm)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit Dimensions
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(i)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Glass Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Glass Type *</Label>
                        <Select
                          value={item?.glassType || ''}
                          onValueChange={(value) => {
                            const availableThicknesses = getAvailableThicknesses(value);
                            const defaultThickness = availableThicknesses[0] || 8;
                            openDimensionModal(i, value, defaultThickness);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select glass type" />
                          </SelectTrigger>
                          <SelectContent>
                            {glassTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Width (inches) *</Label>
                        <Input type="number" step="0.1" {...register(`items.${i}.widthInch`)} disabled={!hasGlassType} />
                      </div>
                      <div>
                        <Label className="text-xs">Height (inches) *</Label>
                        <Input type="number" step="0.1" {...register(`items.${i}.heightInch`)} disabled={!hasGlassType} />
                      </div>
                      <div>
                        <Label className="text-xs">Quantity *</Label>
                        <Input type="number" {...register(`items.${i}.qty`)} disabled={!hasGlassType} />
                      </div>
                    </div>

                    {/* Dimensions Display */}
                    {calc && hasGlassType && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        <span className="font-medium">Calculated:</span> {calc.dims.widthFt.toFixed(2)} × {calc.dims.heightFt.toFixed(2)} ft 
                        ({calc.dims.sqFt.toFixed(2)} sq.ft per piece) • 
                        Total Area: {calc.totalArea.toFixed(2)} sq.ft • 
                        Glass Rate: ₹{calc.glassRate}/sq.ft
                      </div>
                    )}



                    {/* Line Total */}
                    {hasGlassType && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm text-muted-foreground">
                          {calc ? (
                            <>₹{calc.glassRate}/sq.ft × {calc.totalArea.toFixed(2)} sq.ft</>
                          ) : (
                            'Calculating...'
                          )}
                        </div>
                        <div className="text-base font-semibold">
                          Line Total: ₹{calc ? calc.lineTotal.toFixed(2) : '0.00'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Input placeholder="Additional notes..." {...register('notes')} />
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer */}
        <div className="mt-6 flex items-center justify-end gap-6">
          {fv.enableGST && (
            <div className="text-sm text-gray-600">
              {fv.taxMode === 'INTRA'
                ? <>CGST: ₹{totals.breakdown.cgst.toFixed(2)} · SGST: ₹{totals.breakdown.sgst.toFixed(2)}</>
                : <>IGST: ₹{totals.breakdown.igst.toFixed(2)}</>}
            </div>
          )}
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || fv.items.length === 0}>
            {isSubmitting ? 'Creating...' : 'Create Quote'}
          </Button>
        </div>

        {/* Dimension Modal */}
        <Dialog open={showDimensionModal} onOpenChange={setShowDimensionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Glass Dimensions</DialogTitle>
              <DialogDescription>
                {dimensionModalData && (
                  <>
                    Glass Type: <strong>{dimensionModalData.glassType}</strong> | 
                    Thickness: <strong>{dimensionModalData.thicknessMm}mm</strong>
                    <br />
                    <span className="text-xs">Price: ₹{getGlassRate(dimensionModalData.glassType, dimensionModalData.thicknessMm)}/sq.ft</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Width (inches)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempDimensions.widthInch}
                  onChange={(e) => setTempDimensions(prev => ({ ...prev, widthInch: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 12"
                />
              </div>
              <div>
                <Label>Height (inches)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempDimensions.heightInch}
                  onChange={(e) => setTempDimensions(prev => ({ ...prev, heightInch: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 24"
                />
              </div>
              
              {tempDimensions.widthInch > 0 && tempDimensions.heightInch > 0 && (
                <div className="bg-muted p-3 rounded text-sm">
                  <div className="font-medium mb-1">Calculated:</div>
                  <div>Width: {inchToFt(tempDimensions.widthInch).toFixed(2)} ft</div>
                  <div>Height: {inchToFt(tempDimensions.heightInch).toFixed(2)} ft</div>
                  <div className="font-semibold mt-1">
                    Area: {(inchToFt(tempDimensions.widthInch) * inchToFt(tempDimensions.heightInch)).toFixed(2)} sq.ft
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDimensionModal(false)}>
                Cancel
              </Button>
              <Button onClick={addProductWithDimensions}>
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Customer Modal */}
        <CreateCustomerModal
          open={showCreateCustomer}
          onOpenChange={setShowCreateCustomer}
          onCustomerCreated={onCustomerCreated}
        />
      </div>
    </div>
  );
}
