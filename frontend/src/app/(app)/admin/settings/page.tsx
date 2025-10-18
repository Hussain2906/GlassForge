'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { apiV1 } from '@/lib/api';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Shield, 
  Bell, 
  Palette,
  Database,
  Key,
  Webhook,
  Settings,
  BarChart3,
  FileText,
  Activity
} from 'lucide-react';
import GeneralSettings from '@/components/admin/GeneralSettings';
import UsersManagement from '@/components/admin/UsersManagement';
import BillingSettings from '@/components/admin/BillingSettings';
import SecuritySettings from '@/components/admin/SecuritySettings';
import {
  NotificationSettings,
  BrandingSettings,
  DataManagement,
  ApiKeysManagement,
  WebhooksManagement,
  WorkflowsManagement,
  AnalyticsSettings,
  AuditLogs
} from '@/components/admin';
import Topbar from '@/components/Topbar';
import { 
  GeneralSettingsSkeleton,
  UsersManagementSkeleton,
  BillingSettingsSkeleton,
  SecuritySettingsSkeleton
} from '@/components/skeletons/SettingsSkeleton';
import { PageLoader } from '@/components/ui/loading-spinner';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  maxUsers: number;
  currentPlan: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

export default function AdminSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchOrganizationData();
    fetchUsers();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const data = await apiV1.get('admin/organization').json() as Organization;
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiV1.get('admin/users?format=settings').json() as User[];
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const updateOrganization = async (updatedData: Partial<Organization>) => {
    try {
      const updated = await apiV1.put('admin/organization', { json: updatedData }).json() as Organization;
      setOrganization(updated);
      toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    }
  };

  const renderTabContent = () => {
    if (loading) {
      switch (activeTab) {
        case 'general':
          return <GeneralSettingsSkeleton />;
        case 'users':
          return <UsersManagementSkeleton />;
        case 'billing':
          return <BillingSettingsSkeleton />;
        case 'security':
          return <SecuritySettingsSkeleton />;
        default:
          return <PageLoader />;
      }
    }

    switch (activeTab) {
      case 'general':
        return <GeneralSettings organization={organization} onUpdate={updateOrganization} />;
      case 'users':
        return <UsersManagement users={users} organization={organization} onRefresh={fetchUsers} />;
      case 'billing':
        return <BillingSettings organization={organization} />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'branding':
        return <BrandingSettings />;
      case 'data':
        return <DataManagement />;
      case 'api':
        return <ApiKeysManagement />;
      case 'webhooks':
        return <WebhooksManagement />;
      case 'workflows':
        return <WorkflowsManagement />;
      case 'analytics':
        return <AnalyticsSettings />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <PageLoader />;
    }
  };

  return (
    <div>
      <Topbar />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings, users, and preferences
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {organization?.currentPlan || 'Free Plan'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {renderTabContent()}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}