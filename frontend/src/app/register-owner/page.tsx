'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2, User, Mail, Lock, Phone, MapPin,
  FileText, Briefcase,
  ArrowRight, ArrowLeft, Check
} from 'lucide-react';
import Link from 'next/link';

const personalSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const organizationSchema = z.object({
  // Basic Information
  name: z.string().min(2, 'Organization name is required'),
  companyType: z.string().optional(),
  industry: z.string().optional(),
  foundedYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  employeeCount: z.string().optional(),
  annualRevenue: z.string().optional(),

  // Contact Information
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),

  // Address
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India'),
    pincode: z.string().optional(),
  }).optional(),

  // Business Registration
  registrationNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  cinNumber: z.string().optional(),

  // Business Details
  description: z.string().optional(),
  specializations: z.array(z.string()).optional(),

  // Operational
  timeZone: z.string().default('Asia/Kolkata'),
  currency: z.string().default('INR'),
});

type PersonalData = z.infer<typeof personalSchema>;
type OrganizationData = z.infer<typeof organizationSchema>;

const steps = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Organization Details', icon: Building2 },
  { id: 3, title: 'Business Information', icon: Briefcase },
  { id: 4, title: 'Review & Complete', icon: Check },
];

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

const employeeCounts = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
];

const revenueRanges = [
  'Under ₹10 Lakhs',
  '₹10 Lakhs - ₹1 Crore',
  '₹1 Crore - ₹10 Crores',
  '₹10 Crores - ₹100 Crores',
  'Above ₹100 Crores',
];

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personalForm = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
  });

  const orgForm = useForm<OrganizationData>({
    resolver: zodResolver(organizationSchema),
  });

  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);

  const onPersonalSubmit = (data: PersonalData) => {
    setPersonalData(data);
    setCurrentStep(2);
  };

  const onBasicOrgSubmit = (data: OrganizationData) => {
    setOrganizationData(data);
    setCurrentStep(3);
  };

  const onBusinessInfoSubmit = (data: OrganizationData) => {
    setOrganizationData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const onFinalSubmit = async () => {
    if (!personalData || !organizationData) return;

    setIsSubmitting(true);
    try {
      const registrationData = {
        user: personalData,
        organization: organizationData,
      };

      const response = await api.post('auth/register-owner', { json: registrationData }).json<{
        token: string;
        user: any;
        organization: any;
      }>();

      localStorage.setItem('token', response.token);
      localStorage.setItem('orgId', response.organization.id);

      toast.success('Registration successful! Welcome to Glass ERP');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle ky HTTPError
      let message = 'Registration failed. Please try again.';

      if (error.response) {
        try {
          const errorData = await error.response.json();
          message = errorData.error || errorData.message || message;
        } catch (e) {
          // If JSON parsing fails, use status text
          message = error.response.statusText || message;
        }
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : isCompleted
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:block">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 1: Personal Details
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {renderStepIndicator()}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <p className="text-muted-foreground">
                Let's start with your personal information
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      placeholder="Enter your full name"
                      className="pl-9"
                      {...personalForm.register('displayName')}
                    />
                  </div>
                  {personalForm.formState.errors.displayName && (
                    <p className="text-sm text-destructive">
                      {personalForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-9"
                      {...personalForm.register('email')}
                    />
                  </div>
                  {personalForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {personalForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      className="pl-9"
                      {...personalForm.register('password')}
                    />
                  </div>
                  {personalForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {personalForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-9"
                      {...personalForm.register('confirmPassword')}
                    />
                  </div>
                  {personalForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {personalForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/login">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Link>
                  </Button>
                  <Button type="submit">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Basic Organization Details
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {renderStepIndicator()}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Organization Details</CardTitle>
              <p className="text-muted-foreground">
                Tell us about your business to customize your experience
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={orgForm.handleSubmit(onBasicOrgSubmit)} className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., ABC Glass Industries"
                        {...orgForm.register('name')}
                      />
                      {orgForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {orgForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Company Type</Label>
                      <Select onValueChange={(value) => orgForm.setValue('companyType', value)}>
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
                      <Select onValueChange={(value) => orgForm.setValue('industry', value)}>
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
                        placeholder="e.g., 2020"
                        min="1900"
                        max={new Date().getFullYear()}
                        {...orgForm.register('foundedYear')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Employee Count</Label>
                      <Select onValueChange={(value) => orgForm.setValue('employeeCount', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee count" />
                        </SelectTrigger>
                        <SelectContent>
                          {employeeCounts.map((count) => (
                            <SelectItem key={count} value={count}>
                              {count}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Annual Revenue</Label>
                      <Select onValueChange={(value) => orgForm.setValue('annualRevenue', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select revenue range" />
                        </SelectTrigger>
                        <SelectContent>
                          {revenueRanges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        {...orgForm.register('email')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+91 9876543210"
                        {...orgForm.register('phone')}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Website</Label>
                      <Input
                        placeholder="https://www.company.com"
                        {...orgForm.register('website')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Business Address
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Street Address</Label>
                      <Input
                        placeholder="Street address"
                        {...orgForm.register('address.street')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        placeholder="City"
                        {...orgForm.register('address.city')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        placeholder="State"
                        {...orgForm.register('address.state')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        placeholder="Pincode"
                        {...orgForm.register('address.pincode')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        defaultValue="India"
                        {...orgForm.register('address.country')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Registration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Business Registration (Optional)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        {...orgForm.register('gstNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>PAN Number</Label>
                      <Input
                        placeholder="e.g., ABCDE1234F"
                        {...orgForm.register('panNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input
                        placeholder="Company registration number"
                        {...orgForm.register('registrationNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CIN Number</Label>
                      <Input
                        placeholder="Corporate Identification Number"
                        {...orgForm.register('cinNumber')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Description</h3>
                  <div className="space-y-2">
                    <Label>About Your Business</Label>
                    <Textarea
                      placeholder="Tell us about your business, what you do, your specializations..."
                      rows={4}
                      {...orgForm.register('description')}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: Business Information
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {renderStepIndicator()}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Business Information</CardTitle>
              <p className="text-muted-foreground">
                Additional business details and registration information
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={orgForm.handleSubmit(onBusinessInfoSubmit)} className="space-y-8">
                {/* Business Registration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Business Registration
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        {...orgForm.register('gstNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>PAN Number</Label>
                      <Input
                        placeholder="e.g., ABCDE1234F"
                        {...orgForm.register('panNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input
                        placeholder="Company registration number"
                        {...orgForm.register('registrationNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CIN Number</Label>
                      <Input
                        placeholder="Corporate Identification Number"
                        {...orgForm.register('cinNumber')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Description</h3>
                  <div className="space-y-2">
                    <Label>About Your Business</Label>
                    <Textarea
                      placeholder="Tell us about your business, what you do, your specializations..."
                      rows={4}
                      {...orgForm.register('description')}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 4: Review & Complete
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {renderStepIndicator()}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Review & Complete</CardTitle>
            <p className="text-muted-foreground">
              Please review your information before completing registration
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information Review */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Name:</strong> {personalData?.displayName}</p>
                <p><strong>Email:</strong> {personalData?.email}</p>
              </div>
            </div>

            {/* Organization Information Review */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Organization Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Organization Name:</strong> {organizationData?.name}</p>
                {organizationData?.companyType && <p><strong>Company Type:</strong> {organizationData.companyType}</p>}
                {organizationData?.industry && <p><strong>Industry:</strong> {organizationData.industry}</p>}
                {organizationData?.email && <p><strong>Business Email:</strong> {organizationData.email}</p>}
                {organizationData?.phone && <p><strong>Phone:</strong> {organizationData.phone}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={onFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}