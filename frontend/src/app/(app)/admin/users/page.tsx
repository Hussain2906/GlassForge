'use client';

import Topbar from '@/components/Topbar';
import { apiV1 } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus, RefreshCw, Users, Shield, Mail, Calendar
} from 'lucide-react';

type OrganizationUser = {
  id: string;
  role: 'ADMIN' | 'STAFF' | 'VIEWER';
  permissions?: any;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']).default('STAFF'),
});

type FormData = z.infer<typeof schema>;

export default function UsersManagementPage() {
  const qc = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['organization-users'],
    queryFn: () => apiV1.get('admin/users').json<OrganizationUser[]>(),
    staleTime: 15_000,
  });

  const [showCreateForm, setShowCreateForm] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedRole = watch('role');

  const onSubmit = async (formData: FormData) => {
    try {
      await apiV1.post('admin/users', { json: formData }).json();
      reset();
      setShowCreateForm(false);
      await qc.invalidateQueries({ queryKey: ['organization-users'] });
      toast.success('User invited successfully');
    } catch (error: any) {
      const message = error?.response?.json?.()?.error || 'Failed to invite user';
      toast.error(message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiV1.patch(`admin/users/${userId}`, { 
        json: { role: newRole } 
      }).json();
      await qc.invalidateQueries({ queryKey: ['organization-users'] });
      toast.success('User role updated successfully');
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `Remove ${userEmail} from this organization? They will lose access immediately.`
    );

    if (!confirmed) return;

    try {
      await apiV1.delete(`admin/users/${userId}`).json();
      await qc.invalidateQueries({ queryKey: ['organization-users'] });
      toast.success('User removed successfully');
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'STAFF': return 'secondary';
      case 'VIEWER': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Full access to all features and settings';
      case 'STAFF': return 'Can create and manage quotes, orders, and customers';
      case 'VIEWER': return 'Read-only access to view data';
      default: return '';
    }
  };

  return (
    <div>
      <Topbar />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
            <p className="text-muted-foreground">
              Manage team members and their access permissions
            </p>
            <div className="text-sm text-muted-foreground mt-2">
              User Limit: {users?.length || 0}/2 users
              {users && users.length >= 2 && (
                <span className="text-orange-600 ml-2">
                  • Maximum user limit reached
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              disabled={users && users.length >= 2}
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">ADMIN</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to all features, settings, and user management
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">STAFF</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can create and manage quotes, orders, customers, and products
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">VIEWER</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Read-only access to view data and reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invite User Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input 
                      type="email" 
                      placeholder="user@example.com" 
                      {...register('email')} 
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Display Name *</Label>
                    <Input 
                      placeholder="John Doe" 
                      {...register('displayName')} 
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Role *</Label>
                    <Select 
                      value={selectedRole} 
                      onValueChange={(value) => setValue('role', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin - Full Access</SelectItem>
                        <SelectItem value="STAFF">Staff - Standard Access</SelectItem>
                        <SelectItem value="VIEWER">Viewer - Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedRole && (
                      <p className="text-sm text-muted-foreground">
                        {getRoleDescription(selectedRole)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    <Mail className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending Invite...' : 'Send Invite'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                {isLoading ? 'Loading...' : `${users?.length || 0} Team Members`}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {!isLoading && (!users || users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="py-12 text-center">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No team members</h3>
                          <p className="text-muted-foreground mb-4">
                            Start by inviting your first team member
                          </p>
                          <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Invite User
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* User rows */}
                  {!isLoading && users && users.map((orgUser) => (
                    <TableRow key={orgUser.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {orgUser.user?.displayName || orgUser.user?.email || 'Unknown User'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {orgUser.user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={orgUser.role}
                          onValueChange={(value) => handleRoleChange(orgUser.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {getRoleDescription(orgUser.role)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(orgUser.id, orgUser.user?.email || 'unknown')}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}