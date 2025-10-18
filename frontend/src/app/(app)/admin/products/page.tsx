'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Search, RefreshCw, MoreHorizontal, PencilLine, Trash2,
  Package, Download, Upload,
  BarChart3, Settings, Archive, Copy
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  thicknessMm: number | null;
  unitPrice: string | number;
  attributes?: Record<string, unknown>;
  notes?: string | null;
};

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductsAdmin() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiV1.get('admin/products').json<Product[]>(),
    staleTime: 15_000,
  });

  // UI State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Search and filters
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [thicknessFilter, setThicknessFilter] = useState<'all' | 'thin' | 'medium' | 'thick'>('all');

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Filtering logic
  const filtered = useMemo(() => {
    let rows = data ?? [];

    // Text search
    if (qDebounced) {
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(qDebounced) ||
        String(r.thicknessMm ?? '').includes(qDebounced) ||
        String(r.unitPrice).includes(qDebounced)
      );
    }

    // Price filter
    if (priceFilter !== 'all') {
      rows = rows.filter(r => {
        const price = Number(r.unitPrice);
        switch (priceFilter) {
          case 'low': return price < 200;
          case 'medium': return price >= 200 && price < 500;
          case 'high': return price >= 500;
          default: return true;
        }
      });
    }

    // Thickness filter
    if (thicknessFilter !== 'all') {
      rows = rows.filter(r => {
        const thickness = r.thicknessMm;
        if (!thickness) return thicknessFilter === 'thin';
        switch (thicknessFilter) {
          case 'thin': return thickness < 6;
          case 'medium': return thickness >= 6 && thickness < 12;
          case 'thick': return thickness >= 12;
          default: return true;
        }
      });
    }

    return rows;
  }, [data, qDebounced, priceFilter, thicknessFilter]);

  // Statistics
  const stats = useMemo(() => {
    const products = data ?? [];
    const totalProducts = products.length;
    const avgPrice = products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.unitPrice), 0) / products.length
      : 0;
    const totalValue = products.reduce((sum, p) => sum + Number(p.unitPrice), 0);

    return { totalProducts, avgPrice, totalValue };
  }, [data]);



  // Bulk actions
  const handleSelectAll = () => {
    if (selectedProducts.length === filtered.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filtered.map(p => p.id));
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter((pid: string) => pid !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedProducts.length} selected products? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedProducts.map(id => apiV1.delete(`admin/products/${id}`).json())
      );
      setSelectedProducts([]);
      await qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${selectedProducts.length} products deleted successfully`);
    } catch {
      toast.error('Failed to delete some products');
    }
  };

  // Individual delete
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete "${name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiV1.delete(`admin/products/${id}`).json();
      await qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div>
      <Topbar />

      <div className="p-6 space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your glass product catalog with pricing and specifications
            </p>

            {/* Quick Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Total Products:</span>
                <span className="font-semibold ml-1">{stats.totalProducts}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Avg Price:</span>
                <span className="font-semibold ml-1">{inr(stats.avgPrice)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-semibold ml-1">{inr(stats.totalValue)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="h-4 w-4 mr-2" />
                New Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search products..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <Select value={priceFilter} onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">Low (&lt;₹200)</SelectItem>
                    <SelectItem value="medium">Medium (₹200-500)</SelectItem>
                    <SelectItem value="high">High (&gt;₹500)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={thicknessFilter} onValueChange={(v) => setThicknessFilter(v as typeof thicknessFilter)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Thickness</SelectItem>
                    <SelectItem value="thin">Thin (&lt;6mm)</SelectItem>
                    <SelectItem value="medium">Medium (6-12mm)</SelectItem>
                    <SelectItem value="thick">Thick (&gt;12mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {selectedProducts.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedProducts.length} selected
                    </span>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Products Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                {isLoading ? 'Loading...' : `${filtered.length} Products`}
                {filtered.length !== (data?.length ?? 0) && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (filtered from {data?.length ?? 0})
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filtered.length && filtered.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="w-[40%]">Product Name</TableHead>
                    <TableHead>Thickness</TableHead>
                    <TableHead className="text-right">Unit Price (per sq.ft)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {isLoading && Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="py-12 text-center">
                          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No products found</h3>
                          <p className="text-muted-foreground mb-4">
                            {q || priceFilter !== 'all' || thicknessFilter !== 'all'
                              ? 'Try adjusting your search or filters'
                              : 'Get started by creating your first product'
                            }
                          </p>
                          {!q && priceFilter === 'all' && thicknessFilter === 'all' && (
                            <Button asChild>
                              <Link href="/admin/products/new">
                                <Plus className="h-4 w-4 mr-2" />
                                New Product
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Product rows */}
                  {!isLoading && filtered.map((product) => (
                    <TableRow
                      key={product.id}
                      className={`hover:bg-muted/50 ${selectedProducts.includes(product.id) ? 'bg-muted/30' : ''}`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.notes && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {product.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.thicknessMm != null ? (
                          <Badge variant="outline" className="font-mono">
                            {product.thicknessMm}mm
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inr(product.unitPrice)}/sq.ft
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <PencilLine className="h-4 w-4" />
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product.id}/edit`}>
                                  <PencilLine className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(product.id, product.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer with pagination info */}
            {!isLoading && filtered.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Showing {filtered.length} of {data?.length ?? 0} products
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedProducts.length > 0 && (
                      <span>{selectedProducts.length} selected</span>
                    )}
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