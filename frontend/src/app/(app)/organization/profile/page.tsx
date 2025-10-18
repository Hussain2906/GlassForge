'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Topbar from '@/components/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingButton } from '@/components/ui/loading-button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { apiV1 } from '@/lib/api';
import { 
  Building2, 
  Edit, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  FileText,
  Calendar,
  Users,
  Settings
} from 'lucide-react';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  companyType: z.string().optional(),
  industry: z.string().optional(),
  foundedYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  employeeCount: z.string().optional(),
  annualRevenue: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India'),
    pincode: z.string().optional(),
  }).optional(),
  registrationNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  cinNumber: z.string().optional(),
  description: z.string().optional(),
  timeZone: z.string().default('Asia/Kolkata'),
  currency: z.string().default('INR'),
});

type OrganizationData = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  slug: string;
  companyType?: string;
  industry?: string;
  foundedYear?: number;
  employeeCount?: string;
  annualRevenue?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: any;
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  description?: string;
  timeZone?: string;
  currency?: string;
  maxUsers: number;
  createdAt: string;
  currentPlan?: string;
}

const companyTypes = [
  'Private Limited Company',
  'Public Limited Company',
  'Partnership Firm',
  'Limited Liability Partnership (LLP)',
  'Sole Proprietorship',
  'One Person Company (OPC)',
  'Other',
];

const industries = [
  'Glass Manufacturing',
  'Construction & Building Materials',
  'Automotive Glass',
  'Architectural Glass',
  'Interior Design',
  'Furniture & Fixtures',
  'Solar & Renewable Energy',
  'Other',
];

export default function OrganizationProfilePage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationSchema),
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const data = await apiV1.get('admin/organization').json<Organization>();
      setOrganization(data);
      
      // Populate form with current data
      form.reset({
        name: data.name,
        companyType: data.companyType || '',
        industry: data.industry || '',
        foundedYear: data.foundedYear,
        employeeCount: data.employeeCount || '',
        annualRevenue: data.annualRevenue || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || {
          street: '',
          city: '',
          state: '',
          country: 'India',
          pincode: '',
        },
        registrationNumber: data.registrationNumber || '',
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        cinNumber: data.cinNumber || '',
        description: data.description || '',
        timeZone: data.timeZone || 'Asia/Kolkata',
        currency: data.currency || 'INR',
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OrganizationData) => {
    setSaving(true);
    try {
      const updated = await apiV1.put('admin/organization', { json: data }).json<Organization>();
      setOrganization(updated);
      setEditDialogOpen(false);
      toast.success('Organization updated successfully');
    } catch (error: any) {
      const message = error?.response?.json?.()?.error || 'Failed to update organization';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Topbar />
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Profile</h1>
            <p className="text-muted-foreground">
              Manage your organization's information and settings
            </p>
          </div>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Organization Profile</DialogTitle>
                <DialogDescription>
                  Update your organization's information and details
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name *</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Company Type</Label>
                      <Select 
                        value={form.watch('companyType')} 
                        onValueChange={(value) => form.setValue('companyType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select 
                        value={form.watch('industry')} 
                        onValueChange={(value) => form.setValue('industry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Founded Year</Label>
                      <Input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        {...form.register('foundedYear')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input
                        type="email"
                        {...form.register('email')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input {...form.register('phone')} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Website</Label>
                      <Input {...form.register('website')} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Address</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Street Address</Label>
                      <Input {...form.register('address.street')} />
                    </div>

                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input {...form.register('address.city')} />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input {...form.register('address.state')} />
                    </div>

                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input {...form.register('address.pincode')} />
                    </div>

                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input {...form.register('address.country')} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Registration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Registration</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input {...form.register('gstNumber')} />
                    </div>

                    <div className="space-y-2">
                      <Label>PAN Number</Label>
                      <Input {...form.register('panNumber')} />
                    </div>

                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input {...form.register('registrationNumber')} />
                    </div>

                    <div className="space-y-2">
                      <Label>CIN Number</Label>
                      <Input {...form.register('cinNumber')} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Description</h3>
                  <div className="space-y-2">
                    <Label>About Your Business</Label>
                    <Textarea
                      rows={4}
                      {...form.register('description')}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <LoadingButton 
                    type="submit" 
                    loading={saving}
                    loadingText="Saving..."
                  >
                    Save Changes
                  </LoadingButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organization Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Basic Info Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{organization?.name}</CardTitle>
                    <CardDescription>
                      {organization?.industry || 'Glass Business'} • {organization?.companyType || 'Company'}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline">
                  {organization?.currentPlan || 'Free Plan'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {organization?.description && (
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-muted-foreground">{organization.description}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {organization?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{organization.email}</span>
                  </div>
                )}

                {organization?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{organization.phone}</span>
                  </div>
                )}

                {organization?.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {organization.website}
                    </a>
                  </div>
                )}

                {organization?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[
                        organization.address.city,
                        organization.address.state,
                        organization.address.country
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">User Limit</span>
                </div>
                <span className="font-semibold">{organization?.maxUsers || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Founded</span>
                </div>
                <span className="font-semibold">
                  {organization?.foundedYear || 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Member Since</span>
                </div>
                <span className="font-semibold">
                  {new Date(organization?.createdAt || '').getFullYear()}
                </span>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" asChild>
                <a href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Organization Settings
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Business Registration Details */}
        {(organization?.gstNumber || organization?.panNumber || organization?.registrationNumber) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {organization?.gstNumber && (
                  <div>
                    <Label className="text-sm font-medium">GST Number</Label>
                    <p className="text-sm text-muted-foreground mt-1">{organization.gstNumber}</p>
                  </div>
                )}

                {organization?.panNumber && (
                  <div>
                    <Label className="text-sm font-medium">PAN Number</Label>
                    <p className="text-sm text-muted-foreground mt-1">{organization.panNumber}</p>
                  </div>
                )}

                {organization?.registrationNumber && (
                  <div>
                    <Label className="text-sm font-medium">Registration Number</Label>
                    <p className="text-sm text-muted-foreground mt-1">{organization.registrationNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}