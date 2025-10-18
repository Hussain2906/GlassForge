// src/app/(app)/admin/glass-rates/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiV1 } from '@/lib/api';
import type { GlassRate } from '@/lib/types';

import Topbar from '@/components/Topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Plus, PencilLine, Trash2, RefreshCw } from 'lucide-react';

type FormData = {
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
  notes?: string;
};

export default function GlassRatesPage() {
  const qc = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<GlassRate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  // Fetch glass rates
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['glass-rates'],
    queryFn: () => apiV1.get('admin/glass-rates').json<GlassRate[]>(),
    staleTime: 15_000,
  });

  // Create or update glass rate
  const onSubmit = async (formData: FormData) => {
    try {
      if (editingRate) {
        await apiV1.put(`admin/glass-rates/${editingRate.id}`, { json: formData }).json();
        toast.success('Glass rate updated successfully');
      } else {
        await apiV1.post('admin/glass-rates', { json: formData }).json();
        toast.success('Glass rate created successfully');
      }
      
      reset();
      setShowCreateDialog(false);
      setEditingRate(null);
      await qc.invalidateQueries({ queryKey: ['glass-rates'] });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save glass rate';
      toast.error(message);
    }
  };

  // Delete glass rate
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await apiV1.delete(`admin/glass-rates/${deleteId}`).json();
      toast.success('Glass rate deleted successfully');
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['glass-rates'] });
    } catch {
      toast.error('Failed to delete glass rate');
    }
  };

  // Open edit dialog
  const handleEdit = (rate: GlassRate) => {
    setEditingRate(rate);
    reset({
      glassType: rate.glassType,
      rate_3_5mm: rate.rate_3_5mm,
      rate_4mm: rate.rate_4mm,
      rate_5mm: rate.rate_5mm,
      rate_6mm: rate.rate_6mm,
      rate_8mm: rate.rate_8mm,
      rate_10mm: rate.rate_10mm,
      rate_12mm: rate.rate_12mm,
      rate_19mm: rate.rate_19mm,
      rate_dgu: rate.rate_dgu,
      notes: rate.notes || '',
    });
    setShowCreateDialog(true);
  };

  // Close dialog and reset
  const handleCloseDialog = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setEditingRate(null);
      reset();
    }
  };

  return (
    <div>
      <Topbar />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Glass Rates</h1>
            <p className="text-sm text-muted-foreground">
              Manage glass pricing by type and thickness
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
                  Add Glass Rate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRate ? 'Edit Glass Rate' : 'Add New Glass Rate'}
                  </DialogTitle>
                  <DialogDescription>
                    Set pricing for different glass thicknesses. Leave blank for unavailable sizes.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Glass Type */}
                  <div>
                    <Label htmlFor="glassType">Glass Type *</Label>
                    <Input
                      id="glassType"
                      {...register('glassType', { required: true })}
                      placeholder="e.g., Clear Float, Tinted, Laminated"
                    />
                  </div>

                  {/* Standard Thickness Rates */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Standard Thickness Rates (₹/sqft)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="rate_3_5mm" className="text-sm">3.5mm</Label>
                        <Input
                          id="rate_3_5mm"
                          type="number"
                          step="0.01"
                          {...register('rate_3_5mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_4mm" className="text-sm">4mm</Label>
                        <Input
                          id="rate_4mm"
                          type="number"
                          step="0.01"
                          {...register('rate_4mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_5mm" className="text-sm">5mm</Label>
                        <Input
                          id="rate_5mm"
                          type="number"
                          step="0.01"
                          {...register('rate_5mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_6mm" className="text-sm">6mm</Label>
                        <Input
                          id="rate_6mm"
                          type="number"
                          step="0.01"
                          {...register('rate_6mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_8mm" className="text-sm">8mm</Label>
                        <Input
                          id="rate_8mm"
                          type="number"
                          step="0.01"
                          {...register('rate_8mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_10mm" className="text-sm">10mm</Label>
                        <Input
                          id="rate_10mm"
                          type="number"
                          step="0.01"
                          {...register('rate_10mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_12mm" className="text-sm">12mm</Label>
                        <Input
                          id="rate_12mm"
                          type="number"
                          step="0.01"
                          {...register('rate_12mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_19mm" className="text-sm">19mm</Label>
                        <Input
                          id="rate_19mm"
                          type="number"
                          step="0.01"
                          {...register('rate_19mm', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rate_dgu" className="text-sm">DGU</Label>
                        <Input
                          id="rate_dgu"
                          type="number"
                          step="0.01"
                          {...register('rate_dgu', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Additional information about this glass type"
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => handleCloseDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingRate ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Glass Rate List</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : `${data?.length || 0} glass type${data?.length === 1 ? '' : 's'}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Glass Type</TableHead>
                    <TableHead className="text-right">3.5mm</TableHead>
                    <TableHead className="text-right">4mm</TableHead>
                    <TableHead className="text-right">5mm</TableHead>
                    <TableHead className="text-right">6mm</TableHead>
                    <TableHead className="text-right">8mm</TableHead>
                    <TableHead className="text-right">10mm</TableHead>
                    <TableHead className="text-right">12mm</TableHead>
                    <TableHead className="text-right">19mm</TableHead>
                    <TableHead className="text-right">DGU</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* Loading skeleton */}
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j} className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {!isLoading && (!data || data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={11}>
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No glass rates found. Click "Add Glass Rate" to create one.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Rows */}
                  {!isLoading && data?.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {rate.glassType}
                          {!rate.isActive && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_3_5mm ? `₹${rate.rate_3_5mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_4mm ? `₹${rate.rate_4mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_5mm ? `₹${rate.rate_5mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_6mm ? `₹${rate.rate_6mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_8mm ? `₹${rate.rate_8mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_10mm ? `₹${rate.rate_10mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_12mm ? `₹${rate.rate_12mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_19mm ? `₹${rate.rate_19mm}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.rate_dgu ? `₹${rate.rate_dgu}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rate)}
                            title="Edit"
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(rate.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Glass Rate?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the glass rate.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
