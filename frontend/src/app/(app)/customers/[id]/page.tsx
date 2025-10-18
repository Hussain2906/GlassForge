'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import Topbar from '@/components/Topbar';
import Breadcrumb from '@/components/Breadcrumb';
import { apiV1 } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { 
  ArrowLeft, PencilLine, Users, Phone, MapPin, FileText,
  Package, IndianRupee, Calendar, Building
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
  quotes?: Array<{
    id: string;
    quoteNo: string;
    date: string | null;
    status: string;
    total: number;
  }>;
  orders?: Array<{
    id: string;
    orderNo: string;
    orderDate: string | null;
    status: string;
  }>;
};

function inr(n: number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => apiV1.get(`customers/${customerId}`).json<Customer>(),
    enabled: !!customerId,
  });

  if (error) {
    return (
      <div>
        <Topbar />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Customers', href: '/customers' },
              { label: isLoading ? 'Loading...' : customer?.name || 'Customer Details' }
            ]} 
          />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? 'Loading...' : customer?.name}
              </h1>
              <p className="text-muted-foreground">
                Customer details and transaction history
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/customers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              {customer && (
                <Button asChild>
                  <Link href={`/customers/${customer.id}/edit`}>
                    <PencilLine className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Customer Details */}
          {customer && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="flex items-center gap-2">
                          {customer.phone ? (
                            <>
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.phone}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">GST Number</div>
                        <div className="flex items-center gap-2">
                          {customer.gstNumber ? (
                            <>
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono">{customer.gstNumber}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {customer.billingAddress && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Billing Address</div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            {customer.billingAddress.street && (
                              <div>{customer.billingAddress.street}</div>
                            )}
                            <div>
                              {customer.billingAddress.city}
                              {customer.billingAddress.state && `, ${customer.billingAddress.state}`}
                              {customer.billingAddress.pincode && ` - ${customer.billingAddress.pincode}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Quotes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Quotes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.quotes && customer.quotes.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quote No</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customer.quotes.map((quote) => (
                              <TableRow key={quote.id}>
                                <TableCell>
                                  <Link 
                                    href={`/quotes/${quote.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {quote.quoteNo}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  {quote.date ? new Date(quote.date).toLocaleDateString() : '—'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={quote.status === 'FINALIZED' ? 'default' : 'secondary'}>
                                    {quote.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {inr(quote.total)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No quotes found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.orders && customer.orders.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order No</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customer.orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell>
                                  <Link 
                                    href={`/orders/${order.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {order.orderNo}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {order.status.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No orders found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Total Quotes</span>
                      </div>
                      <span className="font-semibold">{customer._count?.quotes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Total Orders</span>
                      </div>
                      <span className="font-semibold">{customer._count?.orders || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild className="w-full justify-start">
                      <Link href={`/quotes/new?customer=${customer.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Create Quote
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/customers/${customer.id}/edit`}>
                        <PencilLine className="h-4 w-4 mr-2" />
                        Edit Customer
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}