'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import {
  Plus, Search, RefreshCw, MoreHorizontal, PencilLine, Trash2,
  Users, Phone, MapPin, FileText, Eye, Building
} from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  gstNumber?: string | null;
  billingAddress?: any;
  shippingAddress?: any;
  customFields?: any;
  _count?: {
    quotes: number;
    orders: number;
  };
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

export default function CustomersPage() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiV1.get('customers').json<Customer[]>(),
    staleTime: 15_000,
  });

  // UI State
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filtered = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.gstNumber?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Add form
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (formData: FormData) => {
    try {
      await apiV1.post('customers', { json: formData }).json();
      reset();
      setShowCreateForm(false);
      await qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    } catch {
      toast.error('Failed to create customer');
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedCustomers.length === filtered.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filtered.map(c => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev =>
      prev.includes(id)
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedCustomers.length} selected customers? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedCustomers.map(id => apiV1.delete(`customers/${id}`).json())
      );
      setSelectedCustomers([]);
      await qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`${selectedCustomers.length} customers deleted successfully`);
    } catch {
      toast.error('Failed to delete some customers');
    }
  };

  // Individual delete
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete "${name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiV1.delete(`customers/${id}`).json();
      await qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div>
      <Topbar />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer database and contact information
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                {selectedCustomers.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedCustomers.length} selected
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
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Import CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input placeholder="e.g., John Doe" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="e.g., +91 9876543210" {...register('phone')} />
                  </div>

                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input placeholder="e.g., 29ABCDE1234F1Z5" {...register('gstNumber')} />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Billing Address</Label>
                  <div className="grid gap-4 md:grid-cols-2 mt-2">
                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input placeholder="Street address" {...register('billingAddress.street')} />
                    </div>

                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input placeholder="City" {...register('billingAddress.city')} />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input placeholder="State" {...register('billingAddress.state')} />
                    </div>

                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input placeholder="Pincode" {...register('billingAddress.pincode')} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <Users className="h-4 w-4 mr-2" />
                    Create Customer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Customers Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                {isLoading ? 'Loading...' : `${filtered.length} Customers`}
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
                        checked={selectedCustomers.length === filtered.length && filtered.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="w-[30%]">Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {isLoading && Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="py-12 text-center">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery
                              ? 'Try adjusting your search query'
                              : 'Get started by adding your first customer'
                            }
                          </p>
                          {!searchQuery && (
                            <Button onClick={() => setShowCreateForm(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Customer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Customer rows */}
                  {!isLoading && filtered.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className={`hover:bg-muted/50 ${selectedCustomers.includes(customer.id) ? 'bg-muted/30' : ''}`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            {customer.gstNumber && (
                              <div className="text-sm text-muted-foreground">
                                GST: {customer.gstNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.gstNumber || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {customer.billingAddress?.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {customer.billingAddress.city}
                              {customer.billingAddress.state && `, ${customer.billingAddress.state}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {customer._count?.quotes || 0} quotes, {customer._count?.orders || 0} orders
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/customers/${customer.id}`}>
                              <Eye className="h-4 w-4" />
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
                                <Link href={`/customers/${customer.id}/edit`}>
                                  <PencilLine className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/quotes/new?customer=${customer.id}`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Create Quote
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(customer.id, customer.name)}
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

            {/* Footer */}
            {!isLoading && filtered.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-3 flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Showing {filtered.length} of {data?.length ?? 0} customers
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedCustomers.length > 0 && (
                      <span>{selectedCustomers.length} selected</span>
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