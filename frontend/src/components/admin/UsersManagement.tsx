'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Mail, MoreHorizontal, Shield, ShieldCheck } from 'lucide-react';
import { apiV1 } from '@/lib/api';


interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

interface Organization {
  id: string;
  maxUsers: number;
}

interface UsersManagementProps {
  users: User[];
  organization: Organization | null;
  onRefresh: () => void;
}

export default function UsersManagement({ users, organization, onRefresh }: UsersManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'USER',
    name: ''
  });
  const [inviting, setInviting] = useState(false);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (users.length >= (organization?.maxUsers || 5)) {
      toast.error('User limit reached. Upgrade your plan to add more users.');
      return;
    }

    setInviting(true);
    
    try {
      await apiV1.post('admin/users/invite', { json: inviteForm }).json();
      toast.success('User invitation sent successfully');
      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'USER', name: '' });
      onRefresh();
    } catch (error: any) {
      const message = error?.response?.json?.()?.message || 'Failed to send invitation';
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await apiV1.put(`admin/users/${userId}/role`, { json: { role: newRole } }).json();
      toast.success('User role updated successfully');
      onRefresh();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await apiV1.put(`admin/users/${userId}/deactivate`).json();
      toast.success('User deactivated successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4" />;
      case 'MANAGER':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'INACTIVE':
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your organization's users and their permissions.
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new team member to your organization.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={inviteForm.role} 
                      onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <LoadingButton 
                      type="submit" 
                      loading={inviting}
                      loadingText="Sending..."
                    >
                      Send Invitation
                    </LoadingButton>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {users.length} of {organization?.maxUsers || 5} users
            </div>
            <div className="w-full max-w-sm">
              <Input placeholder="Search users..." />
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role.toLowerCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell>
                    {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {user.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateUser(user.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}