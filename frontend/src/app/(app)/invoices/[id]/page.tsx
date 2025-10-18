// src/app/(app)/invoices/[id]/page.tsx
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
  FileDown, IndianRupee, Calendar as CalendarIcon, Building2, FileText, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';

type InvoiceItem = {
  id: string;
  productName: string;
  thicknessMm?: string | number;
  lengthMm?: string | number;
  widthMm?: string | number;
  qty: number;
  unitPrice: string | number;
  processCost?: string | number;
  areaSqm?: string | number;
  lineTotal: string | number;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID' | string;
  date?: string | null;
  subtotal?: string | number | null;
  taxBreakdown?: { cgst?: number; sgst?: number; igst?: number } | null;
  total?: string | number | null;
  notes?: string | null;
  order?: {
    id: string;
    phone?: string | null;
    gstNumber?: string | null;
    items: InvoiceItem[];
  } | null;
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  UNPAID: 'destructive',
  PARTIAL: 'default',
  PAID: 'outline',
  CANCELLED: 'destructive',
};

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function Muted({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`text-sm text-muted-foreground ${className || ''}`} {...props}>{children}</span>;
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiV1.get(`invoices/${id}`).json<Invoice>(),
  });

  const updateStatus = async (newStatus: string) => {
    try {
      await apiV1.patch(`invoices/${id}/status`, { json: { paymentStatus: newStatus } }).json();
      toast.success(`Invoice ${newStatus.toLowerCase()}`);
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openPdf = async () => {
    try {
      const blob = await apiV1.get(`pdf/invoice/${id}`).blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('Unable to generate PDF');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Topbar />
        <div className="p-6 space-y-4">
          <div className="h-8 w-44 bg-muted rounded" />
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
              <CardTitle className="text-lg">Couldn’t load invoice</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const inv = data;
  const tax = inv.taxBreakdown ?? {};
  const items = inv.order?.items || [];
  const derivedSubtotal =
    inv.subtotal != null ? Number(inv.subtotal) :
      items.reduce((s, it) => s + Number(it.lineTotal ?? 0), 0);

  return (
    <div>
      <Topbar />

      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{inv.invoiceNo}</h1>
              {inv.paymentStatus && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Badge variant={STATUS_VARIANT[inv.paymentStatus] ?? 'outline'}>{inv.paymentStatus}</Badge>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => updateStatus('UNPAID')}>
                      Mark as Unpaid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus('PARTIAL')}>
                      Mark as Partial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus('PAID')}>
                      Mark as Paid
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <Muted className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {inv.date ? new Date(inv.date).toLocaleDateString() : 'No date'}
            </Muted>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" onClick={openPdf}>
              <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
            {/* Optional: add "Record Payment" flow later */}
            <Button onClick={() => toast.info('Payment flow coming soon')}>
              Record Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* LEFT: Items + Notes */}
          <div className="md:col-span-2 space-y-4 min-w-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
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
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No items found in this invoice
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((it) => {
                          const dims = [it.lengthMm, it.widthMm].filter(Boolean).join(' × ')
                            + (it.thicknessMm ? ` / ${it.thicknessMm}mm` : '');
                          return (
                            <TableRow key={it.id}>
                              <TableCell className="font-medium">{it.productName}</TableCell>
                              <TableCell>{dims || <span className="text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-right">{it.qty}</TableCell>
                              <TableCell className="text-right">{inr(it.unitPrice)}</TableCell>
                              <TableCell className="text-right">{inr(it.processCost ?? 0)}</TableCell>
                              <TableCell className="text-right">{Number(it.areaSqm ?? 0).toFixed(3)}</TableCell>
                              <TableCell className="text-right">{inr(it.lineTotal)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Notes */}
                {inv.notes && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Notes</div>
                      <div className="rounded-md border p-3 text-sm bg-muted/30">
                        {inv.notes}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Summary + Billing */}
          <div className="space-y-4 min-w-0">
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
                  <div className="font-medium">{inr(derivedSubtotal)}</div>
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
                  <div className="font-semibold">{inr(inv.total ?? (derivedSubtotal + (tax.cgst ?? 0) + (tax.sgst ?? 0) + (tax.igst ?? 0)))}</div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Billing / Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Muted>Phone</Muted>
                  <div className="text-sm">{inv.order?.phone || '-'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Muted>GSTIN</Muted>
                  <div className="text-sm">{inv.order?.gstNumber || '-'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              {/* responsive grid so buttons never overflow */}
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={openPdf}>
                  <FileDown className="h-4 w-4 mr-2" /> Download PDF
                </Button>
                <Button className="w-full" onClick={() => toast.info('Payment flow coming soon')}>
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
