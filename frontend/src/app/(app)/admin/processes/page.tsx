// src/app/(app)/admin/processes/page.tsx
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// AlertDialog replaced with simple confirm dialog
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Wrench, Search, RefreshCw, PencilLine, Trash2, IndianRupee, Ruler, LineChart
} from 'lucide-react';

type Proc = {
  id: string;
  name: string;
  priceRule: 'PER_AREA' | 'PER_EDGE' | 'FLAT';
  rate: number;
  unit?: string | null;
};

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  priceRule: z.enum(['PER_AREA', 'PER_EDGE', 'FLAT']),
  rate: z.coerce.number().min(0, 'Rate must be ≥ 0'),
  unit: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProcessesAdmin() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['processes'],
    queryFn: () => apiV1.get('admin/processes').json<Proc[]>(),
    staleTime: 15_000,
  });

  // Search
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
      r.priceRule.toLowerCase().includes(qDebounced) ||
      String(r.rate).includes(qDebounced) ||
      (r.unit ?? '').toLowerCase().includes(qDebounced)
    );
  }, [data, qDebounced]);

  // Create form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceRule: 'PER_AREA' }
  });

  const onSubmit = async (f: FormData) => {
    try {
      await apiV1.post('admin/processes', { json: f }).json();
      reset({ name: '', priceRule: 'PER_AREA', rate: 0, unit: '' });
      await qc.invalidateQueries({ queryKey: ['processes'] });
      toast.success('Process added');
    } catch {
      toast.error('Could not add process');
    }
  };

  // Optional: Edit (works if PATCH /admin/processes/:id exists)
  async function editProc(p: Proc) {
    const name = prompt('Edit name', p.name) ?? p.name;
    const rule = (prompt('Edit priceRule (PER_AREA / PER_EDGE / FLAT)', p.priceRule) ?? p.priceRule).toUpperCase() as Proc['priceRule'];
    const rateStr = prompt('Edit rate', String(p.rate)) ?? String(p.rate);
    const unit = prompt('Edit unit (optional)', p.unit ?? '') ?? (p.unit ?? '');
    const rate = Number(rateStr);

    if (!name || Number.isNaN(rate) || !['PER_AREA', 'PER_EDGE', 'FLAT'].includes(rule)) return;

    try {
      await apiV1.patch(`admin/processes/${p.id}`, { json: { name, priceRule: rule, rate, unit } }).json();
      await qc.invalidateQueries({ queryKey: ['processes'] });
      toast.success('Process updated');
    } catch {
      toast.error('Edit not available (add PATCH /admin/processes/:id in backend)');
    }
  }

  // Optional: Delete (works if DELETE /admin/processes/:id exists)
  async function deleteProc(id: string) {
    try {
      await apiV1.delete(`admin/processes/${id}`).json();
      await qc.invalidateQueries({ queryKey: ['processes'] });
      toast.success('Process deleted');
    } catch {
      toast.error('Delete not available (add DELETE /admin/processes/:id in backend)');
    }
  }

  // Helper label for rule
  function ruleBadge(rule: Proc['priceRule']) {
    switch (rule) {
      case 'PER_AREA':
        return (
          <Badge variant="outline" className="gap-1">
            <LineChart className="h-3.5 w-3.5" />
            PER_AREA
          </Badge>
        );
      case 'PER_EDGE':
        return (
          <Badge variant="outline" className="gap-1">
            <Ruler className="h-3.5 w-3.5" />
            PER_EDGE
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <IndianRupee className="h-3.5 w-3.5" />
            FLAT
          </Badge>
        );
    }
  }

  return (
    <div>
      <Topbar />

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Processes</h1>
            <p className="text-sm text-muted-foreground">
              Define fabrication processes and pricing rules used in automated costing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search name, rule, unit or rate"
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
              <Wrench className="h-5 w-5" />
              Add Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-5 space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g., Edge Polishing" {...register('name')} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>Price Rule</Label>
                <Select
                  value={watch('priceRule')}
                  onValueChange={(v: Proc['priceRule']) => setValue('priceRule', v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_AREA">PER_AREA (₹ per m²)</SelectItem>
                    <SelectItem value="PER_EDGE">PER_EDGE (₹ per m)</SelectItem>
                    <SelectItem value="FLAT">FLAT (₹ flat)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priceRule && <p className="text-xs text-red-600">{errors.priceRule.message}</p>}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Rate</Label>
                <Input placeholder="e.g., 150" type="number" step="0.01" {...register('rate')} />
                {errors.rate && <p className="text-xs text-red-600">{errors.rate.message}</p>}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Unit (optional)</Label>
                <Input placeholder="m² / m / pcs" {...register('unit')} />
              </div>

              <div className="md:col-span-12 flex items-end">
                <Button className="w-full md:w-auto" disabled={isSubmitting}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Add Process
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isLoading ? 'Loading…' : `${filtered.length} process${filtered.length === 1 ? '' : 'es'}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {isLoading && Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))}

                  {/* Empty */}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No processes found. Add your first process above.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Rows */}
                  {!isLoading && filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{ruleBadge(p.priceRule)}</TableCell>
                      <TableCell>{p.unit || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right">
                        {inr(p.rate)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => editProc(p)}>
                            <PencilLine className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (window.confirm(`Delete process "${p.name}"? This action cannot be undone.`)) {
                                deleteProc(p.id);
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

            {!isLoading && filtered.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  Showing {filtered.length} process{filtered.length === 1 ? '' : 'es'}.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
