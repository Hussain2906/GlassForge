// src/app/(app)/invoices/page.tsx
'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  FileDown, Search, RefreshCw, ChevronLeft, ChevronRight, ReceiptText, Plus, IndianRupee
} from 'lucide-react';

type Row = {
  id: string;
  invoiceNo: string;
  total: string | number;
  status?: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED' | string;
  date?: string | null;
  clientName?: string | null;
  balanceDue?: string | number | null;
};

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  UNPAID: 'destructive',
  PARTIAL: 'default',
  PAID: 'outline',
  CANCELLED: 'destructive',
};

export default function InvoicesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => apiV1.get('invoices?limit=50').json<Array<Row>>(),
    staleTime: 15_000,
  });

  // UI state
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // debounce search
  const [qDebounced, setQDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // collect statuses from data
  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach(r => r.status && s.add(r.status));
    return ['ALL', ...Array.from(s.values())];
  }, [data]);

  const filtered = useMemo(() => {
    let rows = (data ?? []);
    if (status !== 'ALL') rows = rows.filter(r => (r.status || '').toUpperCase() === status);
    if (qDebounced) {
      rows = rows.filter(r =>
        (r.invoiceNo ?? '').toLowerCase().includes(qDebounced) ||
        (r.clientName ?? '').toLowerCase().includes(qDebounced)
      );
    }
    return rows;
  }, [data, qDebounced, status]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [qDebounced, status]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // actions
  const openPdf = async (id: string) => {
    try {
      const blob = await apiV1.get(`pdf/invoice/${id}`).blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('Unable to generate PDF');
    }
  };

  return (
    <div>
      <Topbar />

      <div className="p-6">
        {/* Header + CTA */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground">
              Manage billing, track balances, and export PDFs.
            </p>
          </div>
          {/* If you don’t have /invoices/new yet, link to orders or quotes */}
          <Button asChild>
            <Link href="/orders">
              <Plus className="h-4 w-4 mr-2" />
              New from Order
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 w-full md:max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search by Invoice No or Customer"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(s => (
                    <Badge
                      key={s}
                      variant={s === status ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setStatus(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isLoading ? 'Loading…' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {isLoading && Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))}

                  {/* Empty */}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No invoices yet. Convert an{' '}
                          <Link href="/orders" className="underline">order</Link>{' '}
                          into an invoice to get started.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Rows */}
                  {!isLoading && paged.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${r.id}`} className="hover:underline">
                          {r.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {r.date ? new Date(r.date).toLocaleDateString() : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {r.status
                          ? <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{r.status}</Badge>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="truncate max-w-[240px]">
                        {r.clientName || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">{inr(r.total)}</TableCell>
                      <TableCell className="text-right">
                        {r.balanceDue == null ? <span className="text-muted-foreground">—</span> : inr(r.balanceDue)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/invoices/${r.id}`}>Open</Link>
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openPdf(r.id)} title="PDF">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="px-4 pb-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    <span>
                      Showing page <span className="font-medium text-foreground">{page}</span> of{' '}
                      <span className="font-medium text-foreground">{totalPages}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
