'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiV1 } from '@/lib/api';


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

interface GeneralSettingsProps {
  organization: Organization | null;
  onUpdate: (data: Partial<Organization>) => void;
}

export default function GeneralSettings({ organization, onUpdate }: GeneralSettingsProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    address: organization?.address || '',
    city: organization?.city || '',
    state: organization?.state || '',
    zipCode: organization?.zipCode || '',
    country: organization?.country || '',
    maxUsers: organization?.maxUsers || 5,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onUpdate(formData);
    } catch (error) {
      toast.error('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Update your organization's basic information and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Maximum Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxUsers}
                  onChange={(e) => handleInputChange('maxUsers', parseInt(e.target.value))}
                  placeholder="Enter maximum users"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>

            <div className="flex justify-end">
              <LoadingButton 
                type="submit" 
                loading={saving}
                loadingText="Saving..."
              >
                Save Changes
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Statistics</CardTitle>
          <CardDescription>
            Overview of your organization's current status and usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{organization?.maxUsers || 0}</div>
              <div className="text-sm text-muted-foreground">User Limit</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{organization?.currentPlan || 'Free'}</div>
              <div className="text-sm text-muted-foreground">Current Plan</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {organization?.createdAt ? new Date(organization.createdAt).getFullYear() : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Member Since</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}