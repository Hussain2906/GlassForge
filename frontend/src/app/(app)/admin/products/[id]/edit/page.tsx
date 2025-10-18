'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import Topbar from '@/components/Topbar';
import Breadcrumb from '@/components/Breadcrumb';
import { apiV1 } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Save, Trash2, Package, IndianRupee 
} from 'lucide-react';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  thicknessMm: number | null;
  unitPrice: string | number;
  attributes?: any;
  notes?: string | null;
};

const schema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  thicknessMm: z
    .union([z.string(), z.number()])
    .optional()
    .transform(v => (v === '' || v === undefined ? undefined : Number(v)))
    .refine(v => v === undefined || (!Number.isNaN(v) && v >= 0 && v <= 100), '0–100 mm'),
  unitPrice: z.coerce.number().min(0, 'Price must be ≥ 0'),
});

type FormData = z.infer<typeof schema>;

function inr(n: string | number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const productId = params.id as string;

  // Fetch product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiV1.get(`admin/products/${productId}`).json<Product>(),
    enabled: !!productId,
  });

  // Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: product ? {
      name: product.name,
      thicknessMm: product.thicknessMm ?? undefined,
      unitPrice: Number(product.unitPrice),
    } : undefined,
  });

  // Handle form submission
  const onSubmit = async (formData: FormData) => {
    try {
      await apiV1.patch(`admin/products/${productId}`, { json: formData }).json();
      await qc.invalidateQueries({ queryKey: ['products'] });
      await qc.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch {
      toast.error('Failed to update product');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!product) return;

    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiV1.delete(`admin/products/${productId}`).json();
      await qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
      router.push('/admin/products');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  if (error) {
    return (
      <div>
        <Topbar />
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Product not found</h3>
                <p className="text-muted-foreground mb-4">
                  The product you're looking for doesn't exist or has been deleted.
                </p>
                <Button asChild>
                  <Link href="/admin/products">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Products
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar />
      
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Products', href: '/admin/products' },
              { label: isLoading ? 'Loading...' : product?.name || 'Edit Product' }
            ]} 
          />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? 'Loading...' : `Edit ${product?.name}`}
              </h1>
              <p className="text-muted-foreground">
                Update product details and pricing information
              </p>
            </div>
            
            <Button variant="outline" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          {product && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Clear Float Glass"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Thickness and Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thicknessMm">Thickness (mm)</Label>
                      <Input
                        id="thicknessMm"
                        placeholder="e.g., 8"
                        type="number"
                        step="0.1"
                        {...register('thicknessMm')}
                      />
                      {errors.thicknessMm && (
                        <p className="text-sm text-destructive">{errors.thicknessMm.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Unit Price (₹ per sq.ft)</Label>
                      <Input
                        id="unitPrice"
                        placeholder="e.g., 200.00"
                        type="number"
                        step="0.01"
                        {...register('unitPrice')}
                      />
                      {errors.unitPrice && (
                        <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Current Price Display */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Price:</span>
                      <span className="font-mono font-semibold">
                        {inr(product.unitPrice)}/sq.ft
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Product
                    </Button>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" asChild>
                        <Link href="/admin/products">Cancel</Link>
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}