'use client';

import Topbar from '@/components/Topbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiV1 } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { GlassRate, ProcessMaster } from '@/lib/types';
import { toast } from 'sonner';
import { X, ArrowLeft, Save } from 'lucide-react';
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

// Calculation functions
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function inchToFt(inch: number, roundingStepInch = 3) {
  const ft = inch / 12;
  const step = roundingStepInch / 12;
  return Math.ceil(ft / step) * step;
}

type ProcessItem = {
  id: string;
  processCode: string;
  processName: string;
  pricingType: 'F' | 'A' | 'L';
  rate: number;
};

export default function NewProduct() {
  const router = useRouter();

  const [glassRates, setGlassRates] = useState<GlassRate[]>([]);
  const [processMasters, setProcessMasters] = useState<ProcessMaster[]>([]);
  const [loading, setLoading] = useState(true);

  // Product state
  const [productName, setProductName] = useState('');
  const [glassType, setGlassType] = useState('');
  const [thicknessMm, setThicknessMm] = useState<number>(8);
  const [widthInch, setWidthInch] = useState<number>(0);
  const [heightInch, setHeightInch] = useState<number>(0);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [notes, setNotes] = useState('');

  // Modal state
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [tempDimensions, setTempDimensions] = useState({ widthInch: 12, heightInch: 24 });

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const [glassRatesList, processMastersList] = await Promise.all([
          apiV1.get('admin/glass-rates').json<GlassRate[]>(),
          apiV1.get('admin/process-master').json<ProcessMaster[]>(),
        ]);
        setGlassRates(glassRatesList.filter(g => g.isActive));
        setProcessMasters(processMastersList.filter(p => p.isActive));
      } catch {
        setGlassRates([]);
        setProcessMasters([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Get glass rate for selected glass type and thickness
  const getGlassRate = (): number => {
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

  // Get available thicknesses for a glass type
  const getAvailableThicknesses = (glassTypeName?: string): number[] => {
    const typeToCheck = glassTypeName || glassType;
    const rate = glassRates.find(r => r.glassType === typeToCheck);
    if (!rate) return [];
    
    const thicknesses: number[] = [];
    const thicknessKeys = ['rate_3_5mm', 'rate_4mm', 'rate_5mm', 'rate_6mm', 'rate_8mm', 'rate_10mm', 'rate_12mm', 'rate_19mm'];
    const thicknessValues = [3.5, 4, 5, 6, 8, 10, 12, 19];
    
    thicknessKeys.forEach((key, idx) => {
      const rateValue = rate[key as keyof GlassRate];
      if (rateValue !== null && rateValue !== undefined) {
        if (typeof rateValue === 'number' && rateValue > 0) {
          thicknesses.push(thicknessValues[idx]);
        } else if (typeof rateValue === 'string') {
          const numValue = parseFloat(rateValue);
          if (!isNaN(numValue) && numValue > 0) {
            thicknesses.push(thicknessValues[idx]);
          }
        }
      }
    });
    
    return thicknesses;
  };

  // Calculate dimensions and price
  const calculateProduct = () => {
    if (!glassType || widthInch === 0 || heightInch === 0) {
      return {
        widthFt: 0,
        heightFt: 0,
        sqFt: 0,
        glassRate: 0,
        baseGlassPrice: 0,
        totalProcessCost: 0,
        totalPrice: 0
      };
    }

    const widthFt = inchToFt(widthInch);
    const heightFt = inchToFt(heightInch);
    const sqFt = widthFt * heightFt;
    const glassRate = getGlassRate();
    const baseGlassPrice = glassRate * sqFt;

    // Calculate process costs
    let totalProcessCost = 0;
    const totalLength = (widthFt + heightFt) * 2;

    processes.forEach(proc => {
      if (proc.pricingType === 'F') {
        totalProcessCost += proc.rate;
      } else if (proc.pricingType === 'A') {
        totalProcessCost += proc.rate * sqFt;
      } else if (proc.pricingType === 'L') {
        totalProcessCost += proc.rate * totalLength;
      }
    });

    const totalPrice = baseGlassPrice + totalProcessCost;

    return {
      widthFt: round2(widthFt),
      heightFt: round2(heightFt),
      sqFt: round2(sqFt),
      glassRate,
      baseGlassPrice: round2(baseGlassPrice),
      totalProcessCost: round2(totalProcessCost),
      totalPrice: round2(totalPrice)
    };
  };

  const calc = calculateProduct();

  // Handle glass type selection
  const handleGlassTypeSelect = (value: string) => {
    setGlassType(value);
    // Pass the value directly since state update is async
    const availableThicknesses = getAvailableThicknesses(value);
    if (availableThicknesses.length > 0) {
      setThicknessMm(availableThicknesses[0]);
    } else {
      setThicknessMm(8);
    }
    setShowDimensionModal(true);
  };

  // Add dimensions from modal
  const handleAddDimensions = () => {
    setWidthInch(tempDimensions.widthInch);
    setHeightInch(tempDimensions.heightInch);
    setShowDimensionModal(false);
    
    // Auto-generate product name if empty
    if (!productName) {
      setProductName(`${glassType} ${thicknessMm}mm - ${tempDimensions.widthInch}"×${tempDimensions.heightInch}"`);
    }
  };

  // Add process
  const addProcess = (processCode: string) => {
    const process = processMasters.find(p => p.processCode === processCode);
    if (!process) return;
    
    // Check if already added
    if (processes.find(p => p.processCode === processCode)) {
      toast.error('Process already added');
      return;
    }
    
    const primaryRate = process.pricingType === 'F' ? process.rateF :
                       process.pricingType === 'A' ? process.rateA :
                       process.rateL;
    
    const newProcess: ProcessItem = {
      id: `proc_${Date.now()}_${Math.random()}`,
      processCode: process.processCode,
      processName: process.name,
      pricingType: process.pricingType,
      rate: primaryRate || 0
    };
    
    setProcesses(prev => [...prev, newProcess]);
  };

  // Remove process
  const removeProcess = (processId: string) => {
    setProcesses(prev => prev.filter(p => p.id !== processId));
  };

  // Update process rate
  const updateProcessRate = (processId: string, newRate: number) => {
    setProcesses(prev =>
      prev.map(p => p.id === processId ? { ...p, rate: newRate } : p)
    );
  };

  // Save product
  const handleSave = async () => {
    if (!productName) {
      toast.error('Product name is required');
      return;
    }

    if (!glassType) {
      toast.error('Please select a glass type');
      return;
    }

    if (widthInch === 0 || heightInch === 0) {
      toast.error('Please set dimensions');
      return;
    }

    try {
      const payload = {
        name: productName,
        thicknessMm,
        unitPrice: calc.totalPrice,
        attributes: {
          glassType,
          widthInch,
          heightInch,
          widthFt: calc.widthFt,
          heightFt: calc.heightFt,
          sqFt: calc.sqFt,
          glassRate: calc.glassRate,
          baseGlassPrice: calc.baseGlassPrice,
          processes: processes.map(p => ({
            processCode: p.processCode,
            processName: p.processName,
            pricingType: p.pricingType,
            rate: p.rate
          })),
          totalProcessCost: calc.totalProcessCost
        },
        notes
      };

      await apiV1.post('admin/products', { json: payload }).json();
      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (e) {
      let msg = 'Failed to create product';
      try { 
        const error = e as { response?: { json: () => Promise<{ error?: string }> } };
        if (error.response) {
          const data = await error.response.json();
          msg = data.error || msg;
        }
      } catch { 
        // Ignore parsing errors
      }
      toast.error(msg);
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

  const glassTypes = Array.from(new Set(glassRates.map(r => r.glassType)));
  const hasGlassSelected = glassType && widthInch > 0 && heightInch > 0;

  return (
    <div>
      <Topbar />
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create Product</h1>
              <p className="text-sm text-muted-foreground">
                Build a product with glass type, dimensions, and processes
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!hasGlassSelected}>
            <Save className="h-4 w-4 mr-2" />
            Save Product
          </Button>
        </div>

        {/* Product Name */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Clear Glass 8mm - 12×24"
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or specifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* Glass Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Glass Specification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Glass Type *</Label>
                <Select value={glassType} onValueChange={handleGlassTypeSelect}>
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

              {glassType && (
                <div>
                  <Label>Thickness *</Label>
                  <Select
                    value={String(thicknessMm)}
                    onValueChange={(v) => {
                      setThicknessMm(parseFloat(v));
                      if (widthInch > 0 && heightInch > 0) {
                        // Recalculate with new thickness
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableThicknesses().map(t => (
                        <SelectItem key={t} value={String(t)}>{t}mm</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {hasGlassSelected && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dimensions</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempDimensions({ widthInch, heightInch });
                      setShowDimensionModal(true);
                    }}
                  >
                    Edit Dimensions
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Input:</span>
                    <div className="font-medium">{widthInch}" × {heightInch}"</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Calculated:</span>
                    <div className="font-medium">{calc.widthFt} ft × {calc.heightFt} ft</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>
                    <div className="font-medium">{calc.sqFt} sq.ft</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Glass Rate:</span>
                    <div className="font-medium">₹{calc.glassRate}/sq.ft</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processes */}
        {hasGlassSelected && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Processes</CardTitle>
                <Select value="" onValueChange={addProcess}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add process..." />
                  </SelectTrigger>
                  <SelectContent>
                    {processMasters.map(pm => (
                      <SelectItem key={pm.id} value={pm.processCode}>
                        {pm.name} ({pm.processCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {processes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No processes added yet</p>
                  <p className="text-sm">Select from the dropdown above to add processes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {processes.map((proc) => (
                    <div key={proc.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{proc.processName}</div>
                        <div className="text-xs text-muted-foreground">
                          {proc.pricingType === 'F' ? 'Fixed per piece' :
                           proc.pricingType === 'A' ? 'Per sq.ft' :
                           'Per ft (perimeter)'}
                        </div>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          value={proc.rate}
                          onChange={(e) => updateProcessRate(proc.id, parseFloat(e.target.value) || 0)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProcess(proc.id)}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Price Summary */}
        {hasGlassSelected && (
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Glass Price:</span>
                <span className="font-medium">₹{calc.baseGlassPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Process Charges:</span>
                <span className="font-medium">₹{calc.totalProcessCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total Unit Price:</span>
                <span className="text-xl font-bold">₹{calc.totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the price per unit. In quotes, multiply by quantity.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dimension Modal */}
        <Dialog open={showDimensionModal} onOpenChange={setShowDimensionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Glass Dimensions</DialogTitle>
              <DialogDescription>
                {glassType && (
                  <>
                    Glass Type: <strong>{glassType}</strong> | 
                    Thickness: <strong>{thicknessMm}mm</strong>
                    <br />
                    <span className="text-xs">Price: ₹{getGlassRate()}/sq.ft</span>
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
              <Button onClick={handleAddDimensions}>
                Set Dimensions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
