// src/app/(app)/orders/[id]/page.tsx
'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  FileDown, FileText, IndianRupee, Package, Building2, Calendar as CalendarIcon,
  ArrowRight, Truck, Factory, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';

type OrderItem = {
  id: string;
  productName: string;
  thicknessMm?: string | number;
  lengthFt?: string | number;
  widthFt?: string | number;
  lengthMm?: string | number;
  widthMm?: string | number;
  qty: number;
  unitPrice: string | number;
  processCost?: string | number;
  areaSqFt?: string | number;
  areaSqm?: string | number;
  lineTotal: string | number;
  processes?: Array<{ priceRule: string; rate: number }>;
};

type Order = {
  id: string;
  orderNo: string;
  status: 'NEW' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | string;
  orderDate?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  advanceAmount?: string | number | null;
  balanceAmount?: string | number | null;
  subtotal?: string | number | null;
  tax?: string | number | null;
  total?: string | number | null;
  notes?: string | null;
  customFields?: {
    taxBreakdown?: { cgst?: number; sgst?: number; igst?: number };
    enableGST?: boolean;
    discountPercent?: number;
    discountAmount?: number;
  } | null;
  items: OrderItem[];
};

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function Muted({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`text-sm text-muted-foreground ${className || ''}`} {...props}>{children}</span>;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  NEW: 'secondary',
  CONFIRMED: 'default',
  IN_PRODUCTION: 'default',
  READY: 'default',
  DELIVERED: 'outline',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiV1.get(`orders/${id}`).json<Order>(),
  });

  const openPdf = async () => {
    try {
      const blob = await apiV1.get(`pdf/order/${id}`).blob(); // /api/v1/pdf/order/:id
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('Unable to generate PDF');
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await apiV1.patch(`orders/${id}/status`, { json: { status: newStatus } }).json();
      toast.success(`Order ${newStatus.toLowerCase()}`);
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const makeInvoice = async () => {
    try {
      const organizationId = localStorage.getItem('orgId')!;
      const inv = await apiV1
        .post(`invoices/from-order/${id}`, { json: { organizationId } })
        .json<{ id: string }>();
      toast.success('Invoice created');
      router.push(`/invoices/${inv.id}`);
    } catch {
      toast.error('Invoice endpoint not available yet.');
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
              <CardTitle className="text-lg">Couldn’t load order</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const o = data;
  const tax = o.customFields?.taxBreakdown ?? {};
  const dimsText = (it: OrderItem) => {
    const dims = [it.lengthFt, it.widthFt].filter(Boolean);
    if (dims.length === 0) return it.thicknessMm ? `${it.thicknessMm}mm` : '';
    return dims.map(d => Number(d).toFixed(2)).join(' × ') + ' ft' + (it.thicknessMm ? ` / ${it.thicknessMm}mm` : '');
  };

  // Calculate pricing breakdown
  const itemsSubtotal = o.items?.reduce((s, it) => s + Number(it.lineTotal ?? 0), 0) || 0;
  const discountPercent = Number(o.customFields?.discountPercent ?? 0);
  const discountAmount = Number(o.customFields?.discountAmount ?? 0);
  const afterDiscount = itemsSubtotal - discountAmount;
  const enableGST = o.customFields?.enableGST ?? false;
  const taxAmount = Number(o.customFields?.taxBreakdown?.cgst ?? 0) +
    Number(o.customFields?.taxBreakdown?.sgst ?? 0) +
    Number(o.customFields?.taxBreakdown?.igst ?? 0);
  const finalTotal = afterDiscount + (enableGST ? taxAmount : 0);

  return (
    <div>
      <Topbar />

      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{o.orderNo}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Badge variant={STATUS_VARIANT[o.status] ?? 'outline'}>{o.status}</Badge>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => updateStatus('NEW')}>
                    Mark as New
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('CONFIRMED')}>
                    Mark as Confirmed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('IN_PRODUCTION')}>
                    Mark as In Production
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('READY')}>
                    Mark as Ready
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus('DELIVERED')}>
                    Mark as Delivered
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Muted className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'No date'}
            </Muted>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openPdf}>
              <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button onClick={makeInvoice}>
              Make Invoice <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* LEFT: Items + Notes + Production */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items
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
                        <TableHead className="text-right">Area (m²)</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {o.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">{it.productName}</TableCell>
                          <TableCell>{dimsText(it)}</TableCell>
                          <TableCell className="text-right">{it.qty}</TableCell>
                          <TableCell className="text-right">{inr(it.unitPrice)}</TableCell>
                          <TableCell className="text-right">{inr(it.processCost ?? 0)}</TableCell>
                          <TableCell className="text-right">{Number(it.areaSqm ?? 0).toFixed(3)}</TableCell>
                          <TableCell className="text-right">{inr(it.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Processes (compact) */}
                {o.items.some((it) => (it.processes?.length ?? 0) > 0) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Processes</div>
                      <div className="rounded-md border p-3 bg-muted/40">
                        {o.items.map((it) =>
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
                {o.notes && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Notes</div>
                      <div className="rounded-md border p-3 text-sm bg-muted/30">
                        {o.notes}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Production (placeholder you can wire to your workflow fields) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Production
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <Muted>Stage</Muted>
                  <div className="font-medium">
                    {o.status === 'IN_PRODUCTION' ? 'In Progress' : o.status}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>Dispatch</Muted>
                  <div className="flex items-center gap-1 font-medium">
                    <Truck className="h-4 w-4" /> {o.status === 'READY' || o.status === 'DELIVERED' ? 'Scheduled/Done' : 'Pending'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Summary + Customer */}
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
                  <div className="font-medium">{inr(itemsSubtotal)}</div>
                </div>

                {/* Show discount if present */}
                {discountAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-green-600">
                      <Muted className="text-green-600">
                        Discount {discountPercent > 0 ? `(${discountPercent}%)` : ''}
                      </Muted>
                      <div>-{inr(discountAmount)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Muted>After Discount</Muted>
                      <div className="font-medium">{inr(afterDiscount)}</div>
                    </div>
                  </>
                )}

                {/* Show tax breakdown only if GST is enabled */}
                {enableGST && taxAmount > 0 && (
                  <>
                    <Separator />
                    {(tax.cgst ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <Muted>CGST (9%)</Muted>
                        <div>{inr(tax.cgst ?? 0)}</div>
                      </div>
                    )}
                    {(tax.sgst ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <Muted>SGST (9%)</Muted>
                        <div>{inr(tax.sgst ?? 0)}</div>
                      </div>
                    )}
                    {(tax.igst ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <Muted>IGST (18%)</Muted>
                        <div>{inr(tax.igst ?? 0)}</div>
                      </div>
                    )}
                  </>
                )}

                <Separator />
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Total</div>
                  <div className="font-semibold">{inr(finalTotal)}</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Muted>Advance</Muted>
                  <div>{inr(o.advanceAmount ?? 0)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>Balance</Muted>
                  <div className="font-medium">{inr(o.balanceAmount ?? 0)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Muted>Name</Muted>
                  <div className="text-sm font-medium">{o.clientName || '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>Phone</Muted>
                  <div className="text-sm">{o.phone || '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>GSTIN</Muted>
                  <div className="text-sm">{o.gstNumber || '-'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:flex-1" onClick={openPdf}>
                  <FileText className="h-4 w-4 mr-2" /> Download PDF
                </Button>
                <Button className="w-full sm:flex-1" onClick={makeInvoice}>
                  Make Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
