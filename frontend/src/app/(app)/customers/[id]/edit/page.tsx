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
  ArrowLeft, Save, Trash2, Users
} from 'lucide-react';
import Link from 'next/link';

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  gstNumber?: string | null;
  billingAddress?: any;
  shippingAddress?: any;
  customFields?: any;
};

const schema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const customerId = params.id as string;

  // Fetch customer data
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => apiV1.get(`customers/${customerId}`).json<Customer>(),
    enabled: !!customerId,
  });

  // Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: customer ? {
      name: customer.name,
      phone: customer.phone || '',
      gstNumber: customer.gstNumber || '',
      billingAddress: {
        street: customer.billingAddress?.street || '',
        city: customer.billingAddress?.city || '',
        state: customer.billingAddress?.state || '',
        pincode: customer.billingAddress?.pincode || '',
      },
    } : undefined,
  });

  // Handle form submission
  const onSubmit = async (formData: FormData) => {
    try {
      await apiV1.patch(`customers/${customerId}`, { json: formData }).json();
      await qc.invalidateQueries({ queryKey: ['customers'] });
      await qc.invalidateQueries({ queryKey: ['customer', customerId] });
      toast.success('Customer updated successfully');
      router.push(`/customers/${customerId}`);
    } catch {
      toast.error('Failed to update customer');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!customer) return;

    const confirmed = window.confirm(
      `Delete "${customer.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiV1.delete(`customers/${customerId}`).json();
      await qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
      router.push('/customers');
    } catch {
      toast.error('Failed to delete customer');
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
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Customer not found</h3>
                <p className="text-muted-foreground mb-4">
                  The customer you're looking for doesn't exist or has been deleted.
                </p>
                <Button asChild>
                  <Link href="/customers">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Customers
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
              { label: 'Customers', href: '/customers' },
              { label: customer?.name || 'Loading...', href: `/customers/${customerId}` },
              { label: 'Edit' }
            ]} 
          />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? 'Loading...' : `Edit ${customer?.name}`}
              </h1>
              <p className="text-muted-foreground">
                Update customer details and contact information
              </p>
            </div>
            
            <Button variant="outline" asChild>
              <Link href={`/customers/${customerId}`}>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Customer Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., John Doe"
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="e.g., +91 9876543210"
                        {...register('phone')}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gstNumber">GST Number</Label>
                      <Input
                        id="gstNumber"
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        {...register('gstNumber')}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Billing Address */}
                  <div>
                    <Label className="text-base font-medium">Billing Address</Label>
                    <div className="grid gap-4 md:grid-cols-2 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          placeholder="Street address"
                          {...register('billingAddress.street')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          {...register('billingAddress.city')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="State"
                          {...register('billingAddress.state')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="Pincode"
                          {...register('billingAddress.pincode')}
                        />
                      </div>
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
                      Delete Customer
                    </Button>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" asChild>
                        <Link href={`/customers/${customerId}`}>Cancel</Link>
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