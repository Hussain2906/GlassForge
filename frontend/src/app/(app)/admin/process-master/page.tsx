// src/app/(app)/admin/process-master/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiV1 } from '@/lib/api';
import type { ProcessMaster } from '@/lib/types';

import Topbar from '@/components/Topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Skeleton } from '@/components/ui/skeleton';
import { Plus, PencilLine, Trash2, RefreshCw, X } from 'lucide-react';

type CustomRate = {
  id: string;
  name: string;
  value: number | null;
};

type FormData = {
  processCode: string;
  name: string;
  pricingType: 'F' | 'A' | 'L';
  primaryRate?: number;
  remarks?: string;
};

const PRICING_TYPES = [
  { value: 'F', label: 'Fixed (Per Piece)', description: 'Charge per piece regardless of size' },
  { value: 'A', label: 'Area (Per Sq.Ft)', description: 'Charge based on total area' },
  { value: 'L', label: 'Length (Per Ft)', description: 'Charge based on perimeter length' },
];

export default function ProcessMasterPage() {
  const qc = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessMaster | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedPricingType, setSelectedPricingType] = useState<'F' | 'A' | 'L'>('A');

  // Dynamic rates
  const [customRates, setCustomRates] = useState<CustomRate[]>([]);
  const [newRateName, setNewRateName] = useState('');
  const [newRateValue, setNewRateValue] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<FormData>();

  // Fetch process masters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['process-master'],
    queryFn: () => apiV1.get('admin/process-master').json<ProcessMaster[]>(),
    staleTime: 15_000,
  });

  // Create or update process
  const onSubmit = async (formData: FormData) => {
    try {
      // Map primary rate to the correct field based on pricing type
      const rateField = selectedPricingType === 'F' ? 'rateF' :
                       selectedPricingType === 'A' ? 'rateA' : 'rateL';
      
      const payload = {
        processCode: formData.processCode,
        name: formData.name,
        pricingType: selectedPricingType,
        [rateField]: formData.primaryRate || null,
        remarks: formData.remarks,
        // send dynamic rates only
        customRates: customRates.map(r => ({ name: r.name, value: r.value })),
      };

      if (editingProcess) {
        await apiV1.put(`admin/process-master/${editingProcess.id}`, { json: payload }).json();
        toast.success('Process updated successfully');
      } else {
        await apiV1.post('admin/process-master', { json: payload }).json();
        toast.success('Process created successfully');
      }

      reset();
      setShowCreateDialog(false);
      setEditingProcess(null);
      setSelectedPricingType('A');
      setCustomRates([]);
      setNewRateName('');
      setNewRateValue('');
      await qc.invalidateQueries({ queryKey: ['process-master'] });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save process';
      toast.error(message);
    }
  };

  // Delete process
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await apiV1.delete(`admin/process-master/${deleteId}`).json();
      toast.success('Process deleted successfully');
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['process-master'] });
    } catch {
      toast.error('Failed to delete process');
    }
  };

  // Open edit dialog
  const handleEdit = (process: ProcessMaster) => {
    setEditingProcess(process);
    setSelectedPricingType(process.pricingType);
    
    // Get the primary rate based on pricing type
    const primaryRate = process.pricingType === 'F' ? process.rateF :
                       process.pricingType === 'A' ? process.rateA :
                       process.rateL;
    
    reset({
      processCode: process.processCode,
      name: process.name,
      pricingType: process.pricingType,
      primaryRate: primaryRate || undefined,
      remarks: process.remarks || '',
    });

    // If backend later returns dynamic rates, hydrate here
    setCustomRates([]);
    setNewRateName('');
    setNewRateValue('');
    setShowCreateDialog(true);
  };

  // Close dialog and reset
  const handleCloseDialog = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setEditingProcess(null);
      setSelectedPricingType('A');
      setCustomRates([]);
      setNewRateName('');
      setNewRateValue('');
      reset();
    }
  };

  // Add custom rate
  const handleAddCustomRate = () => {
    if (!newRateName.trim()) {
      toast.error('Please enter a rate name');
      return;
    }

    const rateValue = newRateValue ? parseFloat(newRateValue) : null;

    setCustomRates(prev => [
      ...prev,
      { id: `custom_${Date.now()}`, name: newRateName.trim(), value: rateValue },
    ]);

    setNewRateName('');
    setNewRateValue('');
  };

  // Remove custom rate
  const handleRemoveCustomRate = (id: string) => {
    setCustomRates(prev => prev.filter(rate => rate.id !== id));
  };

  // Update custom rate value
  const handleUpdateCustomRate = (id: string, value: string) => {
    setCustomRates(prev =>
      prev.map(rate =>
        rate.id === id ? { ...rate, value: value ? parseFloat(value) : null } : rate
      )
    );
  };

  // Primary rate for table stays based on backend fields, may be null
  const getPrimaryRate = (process: ProcessMaster): number | null => {
    switch (process.pricingType) {
      case 'F': return process.rateF ?? null;
      case 'A': return process.rateA ?? null;
      case 'L': return process.rateL ?? null;
      default: return null;
    }
  };

  return (
    <div>
      <Topbar />
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Process Master</h1>
            <p className="text-sm text-muted-foreground">
              Manage glass processing operations and their pricing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProcess ? 'Edit Process' : 'Add New Process'}
                  </DialogTitle>
                  <DialogDescription>
                    Define a glass processing operation with its pricing structure
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="processCode">Process Code *</Label>
                      <Input
                        id="processCode"
                        {...register('processCode', { required: true })}
                        placeholder="e.g., BP, TMP, EDG"
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Short unique code</p>
                    </div>
                    <div>
                      <Label htmlFor="name">Process Name *</Label>
                      <Input
                        id="name"
                        {...register('name', { required: true })}
                        placeholder="e.g., Back Painted"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pricingType">Pricing Type *</Label>
                    <Select
                      value={selectedPricingType ?? undefined}
                      onValueChange={(value) => {
                        setSelectedPricingType(value as 'F' | 'A' | 'L');
                        setValue('pricingType', value as 'F' | 'A' | 'L');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pricing type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Primary Rate */}
                  <div>
                    <Label htmlFor="primaryRate">
                      Primary Rate (₹) *
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedPricingType === 'F' ? 'Per Piece' :
                         selectedPricingType === 'A' ? 'Per Sq.Ft' :
                         'Per Ft'}
                      </Badge>
                    </Label>
                    <Input
                      id="primaryRate"
                      type="number"
                      step="0.01"
                      {...register('primaryRate', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the main rate for this process based on the pricing type
                    </p>
                  </div>

                  {/* Dynamic Rates Only */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Rates</Label>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>

                    {/* Inline Add */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor="newRateName" className="text-xs">Rate Name</Label>
                        <Input
                          id="newRateName"
                          value={newRateName}
                          onChange={(e) => setNewRateName(e.target.value)}
                          placeholder="e.g., Premium, Discount"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="newRateValue" className="text-xs">Rate Value</Label>
                        <Input
                          id="newRateValue"
                          type="number"
                          step="0.01"
                          value={newRateValue}
                          onChange={(e) => setNewRateValue(e.target.value)}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddCustomRate}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {/* Display Dynamic Rates */}
                    {customRates.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {customRates.map((rate) => (
                          <div key={rate.id} className="flex gap-2 items-center p-2 bg-muted rounded-md">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Name</Label>
                              <p className="text-sm font-medium">{rate.name}</p>
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Value</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={
                                  rate.value !== undefined && rate.value !== null
                                    ? String(rate.value)
                                    : ''
                                }
                                onChange={(e) => handleUpdateCustomRate(rate.id, e.target.value)}
                                placeholder="0.00"
                                className="text-sm h-8"
                              />
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveCustomRate(rate.id)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea id="remarks" {...register('remarks')} placeholder="Additional notes about this process" rows={3} />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => handleCloseDialog(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingProcess ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Process List</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : `${data?.length || 0} process${data?.length === 1 ? '' : 'es'}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Code</TableHead>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Primary Rate</TableHead>
                    <TableHead className="w-[300px]">Remarks</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && (!data || data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No processes found. Click "Add Process" to create one.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && data?.map((process) => {
                    const primaryRate = getPrimaryRate(process);
                    const pricingType = PRICING_TYPES.find((t) => t.value === process.pricingType);
                    const typeLabel = pricingType?.label || process.pricingType;
                    const rateDisplay =
                      primaryRate !== undefined && primaryRate !== null ? `₹${primaryRate}` : '—';
                    return (
                      <TableRow key={process.id}>
                        <TableCell className="font-mono font-medium">{process.processCode}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {process.name}
                            {!process.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{typeLabel}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{rateDisplay}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {process.remarks || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(process)} title="Edit">
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(process.id)} title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <AlertDialog
          open={Boolean(deleteId)}
          onOpenChange={(open) => {
            if (!open) setDeleteId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Process?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the process.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

  );
}
