// src/app/(app)/quotes/[id]/page.tsx
'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  FileDown, FileText, Package2, IndianRupee, Building2, Calendar as CalendarIcon,
  ArrowRight, RefreshCw, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';

type QuoteItem = {
  id: string;
  productName: string;
  thicknessMm?: string | number;
  lengthFt?: string | number;
  widthFt?: string | number;
  qty: number;
  unitPrice: string | number;
  processCost?: string | number;
  areaSqFt?: string | number;
  lineTotal: string | number;
  processes?: Array<{ priceRule: string; rate: number }>;
};

type Quote = {
  id: string;
  quoteNo: string;
  date?: string | null;
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED' | string;
  clientId?: string | null;
  contactPhone?: string | null;
  gstNumber?: string | null;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  notes?: string | null;
  customFields?: { taxBreakdown?: { cgst?: number; sgst?: number; igst?: number } } | null;
  items: QuoteItem[];
};

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Muted({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`text-sm text-muted-foreground ${className || ''}`} {...props}>{children}</span>;
}

export default function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  // Debug logging and redirect if invalid ID
  React.useEffect(() => {
    console.log('QuoteDetail - params:', params);
    console.log('QuoteDetail - id:', id);
    
    if (!id || id === 'undefined') {
      console.warn('Invalid quote ID, redirecting to quotes list');
      router.push('/quotes');
    }
  }, [params, id, router]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => {
      if (!id || id === 'undefined') {
        throw new Error('Invalid quote ID');
      }
      return apiV1.get(`quotes/${id}`).json<Quote>();
    },
    enabled: !!id && id !== 'undefined',
  });

  // Early return for invalid ID
  if (!id || id === 'undefined') {
    return (
      <div>
        <Topbar />
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Invalid Quote ID</h2>
            <p className="text-muted-foreground mb-4">The quote ID is missing or invalid.</p>
            <Button onClick={() => router.push('/quotes')}>Back to Quotes</Button>
          </div>
        </div>
      </div>
    );
  }

  const openPdf = async () => {
    try {
      // NOTE: pdf route lives under /api/v1/pdf/*
      const blob = await apiV1.get(`pdf/quote/${id}`).blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('Unable to generate PDF');
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await apiV1.patch(`quotes/${id}/status`, { json: { status: newStatus } }).json();
      toast.success(`Quote ${newStatus.toLowerCase()}`);
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this quote? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await apiV1.delete(`quotes/${id}`).json();
      toast.success('Quote deleted');
      router.push('/quotes');
    } catch {
      toast.error('Failed to delete quote');
    }
  };

  const makeOrder = async () => {
    const organizationId = localStorage.getItem('orgId')!;
    const ok = window.confirm('Create an order from this quote?');
    if (!ok) return;
    try {
      const order = await apiV1
        .post(`orders/from-quote/${id}`, { json: { organizationId } })
        .json<{ id: string }>();
      toast.success('Order created');
      router.push(`/orders/${order.id}`);
    } catch {
      toast.error('Failed to create order');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Topbar />
        <div className="p-6 space-y-4">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <Topbar />
        <div className="p-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Couldn’t load quote</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const q = data;
  const tax = q.customFields?.taxBreakdown ?? {};
  const dimsText = (it: QuoteItem) =>
    [it.lengthFt, it.widthFt].filter(Boolean).join(' × ') + ' ft' + (it.thicknessMm ? ` / ${it.thicknessMm}mm` : '');

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'secondary',
    FINALIZED: 'default',
    CANCELLED: 'destructive',
  };

  return (
    <div>
      <Topbar />

      {/* Header strip */}
      <div className="p-4 pb-2 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight break-words">{q.quoteNo}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Badge variant={statusColor[q.status] ?? 'outline'}>{q.status}</Badge>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => updateStatus('DRAFT')}>
                    Mark as Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('SENT')}>
                    Mark as Sent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('FINALIZED')}>
                    Mark as Finalized
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('CANCELLED')} className="text-destructive">
                    Mark as Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Muted className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {q.date ? new Date(q.date).toLocaleDateString() : 'No date'}
            </Muted>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            {q.status === 'DRAFT' && (
              <>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href={`/quotes/${id}/edit`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => updateStatus('SENT')} className="w-full sm:w-auto">
                  Send to Customer
                </Button>
              </>
            )}
            {(q.status === 'DRAFT' || q.status === 'SENT') && (
              <Button onClick={makeOrder} className="w-full sm:w-auto">
                Convert to Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button variant="outline" onClick={openPdf} className="w-full sm:w-auto">
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
            {q.status === 'DRAFT' && (
              <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Left column: items + notes */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Line Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Dimensions</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Process</TableHead>
                        <TableHead className="text-right">Area (sq.ft)</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {q.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">{it.productName}</TableCell>
                          <TableCell>{dimsText(it)}</TableCell>
                          <TableCell className="text-right">{it.qty}</TableCell>
                          <TableCell className="text-right">{inr(it.unitPrice)}</TableCell>
                          <TableCell className="text-right">
                            {inr(it.processCost ?? 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(it.areaSqFt ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">{inr(it.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Processes list (optional, compact) */}
                {q.items.some((it) => (it.processes?.length ?? 0) > 0) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Processes</div>
                      <div className="rounded-md border p-3 bg-muted/40">
                        {q.items.map((it) =>
                          (it.processes ?? []).length ? (
                            <div key={it.id} className="text-sm mb-2">
                              <span className="font-medium">{it.productName}</span> —{' '}
                              {(it.processes ?? [])
                                .map((p) => `${p.priceRule} @ ${inr(p.rate)}`)
                                .join(', ')}
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {q.notes && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Notes</div>
                      <div className="rounded-md border p-3 text-sm bg-muted/30">
                        {q.notes}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: summary + customer */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Muted>Subtotal</Muted>
                  <div className="font-medium">{inr(q.subtotal)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>CGST</Muted>
                  <div>{inr(tax.cgst ?? 0)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>SGST</Muted>
                  <div>{inr(tax.sgst ?? 0)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>IGST</Muted>
                  <div>{inr(tax.igst ?? 0)}</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Total</div>
                  <div className="font-semibold">{inr(q.total)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Customer / Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Muted>GSTIN</Muted>
                  <div className="text-sm">{q.gstNumber || '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>Phone</Muted>
                  <div className="text-sm">{q.contactPhone || '-'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-2 w-full">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1"
                    onClick={openPdf}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button
                    className="w-full sm:flex-1"
                    onClick={makeOrder}
                  >
                    Convert to Order
                  </Button>
                </div>
              </CardContent>
            </Card>̵
          </div>
        </div>
      </div>
    </div>
  );
}
