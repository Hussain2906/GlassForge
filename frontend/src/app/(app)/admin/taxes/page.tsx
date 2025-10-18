// src/app/(app)/admin/taxes/page.tsx
'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// AlertDialog replaced with simple confirm dialog
import { toast } from 'sonner';
import { Percent, Shield, Plus, RefreshCw, Search, PencilLine, Trash2 } from 'lucide-react';

type Tax = { id: string; name: string; rate: number; scope: 'INTRA' | 'INTER' };

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rate: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%'),
  scope: z.enum(['INTRA', 'INTER'])
});
type FormData = z.infer<typeof schema>;

export default function TaxesAdmin() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => apiV1.get('admin/taxes').json<Tax[]>(),
    staleTime: 15_000,
  });

  // Search + filter
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (!qDebounced) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(qDebounced) ||
      r.scope.toLowerCase().includes(qDebounced) ||
      String(r.rate).includes(qDebounced)
    );
  }, [data, qDebounced]);

  // Add form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { scope: 'INTRA' } });

  const onSubmit = async (f: FormData) => {
    try {
      await apiV1.post('admin/taxes', { json: f }).json();
      reset({ name: '', rate: 0, scope: 'INTRA' });
      await qc.invalidateQueries({ queryKey: ['taxes'] });
      toast.success('Tax rate added');
    } catch (e) {
      toast.error('Could not add tax rate');
    }
  };

  // Inline edit support (optional; works if you add PATCH /admin/taxes/:id)
  async function editTax(row: Tax) {
    const name = prompt('Edit name', row.name) ?? row.name;
    const rateStr = prompt('Edit rate (%)', String(row.rate)) ?? String(row.rate);
    const rate = Number(rateStr);
    const scope = (prompt('Edit scope (INTRA/INTER)', row.scope) ?? row.scope).toUpperCase() as 'INTRA' | 'INTER';
    if (!name || Number.isNaN(rate) || (scope !== 'INTRA' && scope !== 'INTER')) return;

    try {
      await apiV1.patch(`admin/taxes/${row.id}`, { json: { name, rate, scope } }).json();
      await qc.invalidateQueries({ queryKey: ['taxes'] });
      toast.success('Tax updated');
    } catch {
      toast.error('Edit not available (add PATCH /admin/taxes/:id in backend)');
    }
  }

  // Delete support (optional; works if you add DELETE /admin/taxes/:id)
  async function deleteTax(id: string) {
    try {
      await apiV1.delete(`admin/taxes/${id}`).json();
      await qc.invalidateQueries({ queryKey: ['taxes'] });
      toast.success('Tax deleted');
    } catch {
      toast.error('Delete not available (add DELETE /admin/taxes/:id in backend)');
    }
  }

  return (
    <div>
      <Topbar />

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tax Rates</h1>
            <p className="text-sm text-muted-foreground">
              Configure CGST/SGST/IGST rules used in quotes, orders, and invoices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search name, scope or rate"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Create */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Tax Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-5 space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g., GST 18%" {...register('name')} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>Rate (%)</Label>
                <Input
                  placeholder="18"
                  type="number"
                  step="0.1"
                  {...register('rate', { valueAsNumber: true })}
                />
                {errors.rate && <p className="text-xs text-red-600">{errors.rate.message}</p>}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Scope</Label>
                <Select
                  value={watch('scope')}
                  onValueChange={(v: 'INTRA' | 'INTER') => setValue('scope', v as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTRA">INTRA (CGST+SGST)</SelectItem>
                    <SelectItem value="INTER">INTER (IGST)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.scope && <p className="text-xs text-red-600">{errors.scope.message}</p>}
              </div>

              <div className="md:col-span-2 flex items-end">
                <Button className="w-full" disabled={isSubmitting}>
                  <Percent className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isLoading ? 'Loading…' : `${filtered.length} rate${filtered.length === 1 ? '' : 's'}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="text-right pr-6">
                        <Skeleton className="h-8 w-28 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}

                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No tax rates found. Add your first tax above.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading && filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          {t.scope}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.rate}%</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => editTax(t)}>
                            <PencilLine className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (window.confirm(`Delete tax rate "${t.name}"? This action cannot be undone.`)) {
                                deleteTax(t.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            {!isLoading && filtered.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  Showing {filtered.length} tax rate{filtered.length === 1 ? '' : 's'}.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
