'use client';

import { useQuery } from '@tanstack/react-query';
import { apiV1 } from '@/lib/api';
import Topbar from '@/components/Topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, FileText, Package, Users, TrendingUp, TrendingDown,
  IndianRupee, Clock, CheckCircle, AlertCircle, XCircle,
  BarChart3, Calendar, ArrowRight, Target, Zap, Activity,
  DollarSign, ShoppingCart, UserCheck, Percent, Eye
} from 'lucide-react';
import Link from 'next/link';

type DashboardAnalytics = {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalQuotes: number;
    quotesGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    totalCustomers: number;
    customersGrowth: number;
  };
  quotes: {
    total: number;
    draft: number;
    finalized: number;
    cancelled: number;
    thisMonth: number;
    lastMonth: number;
    conversionRate: number;
    avgValue: number;
    totalValue: number;
  };
  orders: {
    total: number;
    new: number;
    confirmed: number;
    inProduction: number;
    ready: number;
    delivered: number;
    thisMonth: number;
    lastMonth: number;
    avgValue: number;
    totalValue: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    lastYear: number;
    pending: number;
    paid: number;
    overdue: number;
    growth: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    thisMonth: number;
    lastMonth: number;
    topCustomers: Array<{
      id: string;
      name: string;
      totalValue: number;
      orderCount: number;
    }>;
  };
  products: {
    total: number;
    topProducts: Array<{
      id: string;
      name: string;
      salesCount: number;
      revenue: number;
    }>;
  };
  recentActivity: Array<{
    id: string;
    type: 'quote' | 'order' | 'invoice' | 'customer';
    title: string;
    amount?: number;
    date: string;
    status: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    quotes: number;
    orders: number;
    revenue: number;
  }>;
};

function inr(n: number | undefined | null) {
  const num = Number(n ?? 0);
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatGrowth(growth: number) {
  const isPositive = growth >= 0;
  return (
    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(growth).toFixed(1)}%
    </div>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => apiV1.get('dashboard/analytics').json<DashboardAnalytics>(),
    staleTime: 30_000,
  });

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <Topbar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting}! Business Analytics
            </h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your glass business performance
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/quotes/new">
                <Plus className="h-4 w-4 mr-2" />
                New Quote
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {inr(analytics?.overview.totalRevenue || 0).replace('₹ ', '₹')}
                  </div>
                  {formatGrowth(analytics?.overview.revenueGrowth || 0)}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.overview.totalQuotes || 0}</div>
                  {formatGrowth(analytics?.overview.quotesGrowth || 0)}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.overview.totalOrders || 0}</div>
                  {formatGrowth(analytics?.overview.ordersGrowth || 0)}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.overview.totalCustomers || 0}</div>
                  {formatGrowth(analytics?.overview.customersGrowth || 0)}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quotes Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quotes Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-semibold">{inr(analytics?.quotes.totalValue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Value</span>
                    <span className="font-semibold">{inr(analytics?.quotes.avgValue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{(analytics?.quotes.conversionRate || 0).toFixed(1)}%</span>
                      <Progress value={analytics?.quotes.conversionRate || 0} className="w-16 h-2" />
                    </div>
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Finalized</span>
                      </div>
                      <span className="font-medium">{analytics?.quotes.finalized || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Draft</span>
                      </div>
                      <span className="font-medium">{analytics?.quotes.draft || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Cancelled</span>
                      </div>
                      <span className="font-medium">{analytics?.quotes.cancelled || 0}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Orders Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Orders Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-semibold">{inr(analytics?.orders.totalValue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Value</span>
                    <span className="font-semibold">{inr(analytics?.orders.avgValue || 0)}</span>
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-sm">Delivered</span>
                      </div>
                      <span className="font-medium">{analytics?.orders.delivered || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className="text-sm">In Production</span>
                      </div>
                      <span className="font-medium">{analytics?.orders.inProduction || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm">Ready</span>
                      </div>
                      <span className="font-medium">{analytics?.orders.ready || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        <span className="text-sm">New</span>
                      </div>
                      <span className="font-medium">{analytics?.orders.new || 0}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Revenue Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-semibold">{inr(analytics?.revenue.thisMonth || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Month</span>
                    <span className="font-semibold">{inr(analytics?.revenue.lastMonth || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Year</span>
                    <span className="font-semibold">{inr(analytics?.revenue.thisYear || 0)}</span>
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-sm">Paid</span>
                      </div>
                      <span className="font-medium text-green-600">{inr(analytics?.revenue.paid || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span className="text-sm">Pending</span>
                      </div>
                      <span className="font-medium text-orange-600">{inr(analytics?.revenue.pending || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-sm">Overdue</span>
                      </div>
                      <span className="font-medium text-red-600">{inr(analytics?.revenue.overdue || 0)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : analytics?.customers.topCustomers && analytics.customers.topCustomers.length > 0 ? (
                <div className="space-y-4">
                  {analytics.customers.topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.orderCount} orders
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {inr(customer.totalValue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No customer data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentActivity.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {activity.type === 'quote' && <FileText className="h-4 w-4" />}
                        {activity.type === 'order' && <Package className="h-4 w-4" />}
                        {activity.type === 'invoice' && <IndianRupee className="h-4 w-4" />}
                        {activity.type === 'customer' && <Users className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                      {activity.amount && (
                        <div className="text-xs font-medium">
                          {inr(activity.amount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild className="justify-start">
                <Link href="/quotes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quote
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/customers">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Customers
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/products">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}