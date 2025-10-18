'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingSpinner, PageLoader } from '@/components/ui/loading-spinner';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { 
  GeneralSettingsSkeleton,
  UsersManagementSkeleton,
  BillingSettingsSkeleton 
} from '@/components/skeletons/SettingsSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useLoading } from '@/hooks/useLoading';

// Example data and columns for DataTable
const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
];

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
];

export default function LoadingExamples() {
  const [showSkeletons, setShowSkeletons] = useState(false);
  const { loading, withLoading } = useLoading();

  const simulateAsyncAction = () => withLoading(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loading Components Examples</h1>
        <div className="space-x-2">
          <Button 
            variant="outline"
            onClick={() => setShowSkeletons(!showSkeletons)}
          >
            Toggle Skeletons
          </Button>
          <LoadingButton 
            loading={loading}
            loadingText="Processing..."
            onClick={simulateAsyncAction}
          >
            Test Async Action
          </LoadingButton>
        </div>
      </div>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="text-sm mt-2">Small</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="text-sm mt-2">Medium</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm mt-2">Large</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <LoadingButton loading={false}>Normal Button</LoadingButton>
            <LoadingButton loading={true} loadingText="Saving...">Save</LoadingButton>
            <LoadingButton loading={true} variant="outline">Loading Outline</LoadingButton>
            <LoadingButton loading={true} variant="destructive" loadingText="Deleting...">
              Delete
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {/* Data Table with Loading */}
      <DataTable
        title="Sample Data Table"
        description="Example of DataTable with loading states"
        data={sampleData}
        columns={columns}
        loading={showSkeletons}
        searchable
        searchPlaceholder="Search users..."
        onRefresh={() => console.log('Refreshing...')}
        actions={
          <Button size="sm">Add User</Button>
        }
        emptyState={
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No users found</p>
            <Button className="mt-4">Add First User</Button>
          </div>
        }
      />

      {/* Skeleton Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings Skeletons</CardTitle>
          </CardHeader>
          <CardContent>
            {showSkeletons ? (
              <div className="space-y-6">
                <div className="text-sm font-medium mb-2">General Settings:</div>
                <GeneralSettingsSkeleton />
              </div>
            ) : (
              <p className="text-muted-foreground">Toggle skeletons to see loading states</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table & Form Skeletons</CardTitle>
          </CardHeader>
          <CardContent>
            {showSkeletons ? (
              <div className="space-y-6">
                <div className="text-sm font-medium mb-2">Table Skeleton:</div>
                <TableSkeleton rows={3} />
                <div className="text-sm font-medium mb-2 mt-6">Form Skeleton:</div>
                <FormSkeleton />
              </div>
            ) : (
              <p className="text-muted-foreground">Toggle skeletons to see loading states</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Skeleton</CardTitle>
        </CardHeader>
        <CardContent>
          {showSkeletons ? (
            <DashboardSkeleton />
          ) : (
            <p className="text-muted-foreground">Toggle skeletons to see dashboard loading state</p>
          )}
        </CardContent>
      </Card>

      {/* Page Loader Example */}
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Page Loader</CardTitle>
          </CardHeader>
          <CardContent>
            <PageLoader />
          </CardContent>
        </Card>
      )}
    </div>
  );
}