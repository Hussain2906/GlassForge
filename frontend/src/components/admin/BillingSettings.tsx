'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { apiV1 } from '@/lib/api';
import { BillingSettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Database,
  Zap
} from 'lucide-react';

interface Organization {
  id: string;
  currentPlan: string;
  maxUsers: number;
}

interface BillingData {
  currentPlan: {
    name: string;
    price: number;
    interval: string;
    features: string[];
  };
  usage: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  limits: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  nextBilling: string;
  paymentMethod: {
    type: string;
    last4: string;
    expiry: string;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    downloadUrl: string;
  }>;
}

interface BillingSettingsProps {
  organization: Organization | null;
}

const plans = [
  {
    name: 'Free',
    price: 0,
    interval: 'month',
    users: 5,
    storage: 1, // GB
    apiCalls: 1000,
    features: [
      'Up to 5 users',
      '1GB storage',
      '1,000 API calls/month',
      'Basic support',
      'Standard templates'
    ]
  },
  {
    name: 'Professional',
    price: 29,
    interval: 'month',
    users: 25,
    storage: 10,
    apiCalls: 10000,
    features: [
      'Up to 25 users',
      '10GB storage',
      '10,000 API calls/month',
      'Priority support',
      'Advanced templates',
      'Custom branding',
      'Analytics dashboard'
    ]
  },
  {
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    users: 100,
    storage: 100,
    apiCalls: 100000,
    features: [
      'Up to 100 users',
      '100GB storage',
      '100,000 API calls/month',
      '24/7 support',
      'All templates',
      'Full customization',
      'Advanced analytics',
      'API access',
      'SSO integration'
    ]
  }
];

export default function BillingSettings({ organization }: BillingSettingsProps) {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const data = await apiV1.get('admin/billing').json() as BillingData;
      setBillingData(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    try {
      const { checkoutUrl } = await apiV1.post('admin/billing/upgrade', { json: { plan: planName } }).json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to initiate upgrade');
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await apiV1.get(`admin/billing/invoices/${invoiceId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return <BillingSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription and usage details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">{billingData?.currentPlan.name || organization?.currentPlan || 'Free'}</h3>
              <p className="text-muted-foreground">
                ${billingData?.currentPlan.price || 0}/{billingData?.currentPlan.interval || 'month'}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Active
            </Badge>
          </div>

          {billingData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {billingData.usage.users}/{billingData.limits.users}
                  </span>
                </div>
                <Progress 
                  value={(billingData.usage.users / billingData.limits.users) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Storage
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {billingData.usage.storage}GB/{billingData.limits.storage}GB
                  </span>
                </div>
                <Progress 
                  value={(billingData.usage.storage / billingData.limits.storage) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    API Calls
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {billingData.usage.apiCalls.toLocaleString()}/{billingData.limits.apiCalls.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={(billingData.usage.apiCalls / billingData.limits.apiCalls) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          )}

          {billingData?.nextBilling && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Next billing date: {new Date(billingData.nextBilling).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your organization's needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`border rounded-lg p-6 ${
                  plan.name === (organization?.currentPlan || 'Free') 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    ${plan.price}
                    <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.name === (organization?.currentPlan || 'Free') ? 'outline' : 'default'}
                  disabled={plan.name === (organization?.currentPlan || 'Free')}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {plan.name === (organization?.currentPlan || 'Free') ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      {billingData?.paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Manage your payment information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-8 w-8 text-gray-400" />
                <div>
                  <div className="font-medium">
                    **** **** **** {billingData.paymentMethod.last4}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires {billingData.paymentMethod.expiry}
                  </div>
                </div>
              </div>
              <Button variant="outline">Update</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingData?.invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadInvoice(invoice.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              )) || (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No billing history available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}