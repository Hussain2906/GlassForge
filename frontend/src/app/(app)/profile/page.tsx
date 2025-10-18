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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Bell, 
  Smartphone,
  Calendar,
  MapPin
} from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  location?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await api.get('auth/me').json<any>();
      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        phone: userData.phone,
        location: userData.location,
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLogin: userData.lastLogin,
      };
      
      setUser(userProfile);
      profileForm.reset({
        displayName: userProfile.displayName,
        email: userProfile.email,
        phone: userProfile.phone || '',
        location: userProfile.location || '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileData) => {
    setSavingProfile(true);
    try {
      await api.put('auth/profile', { json: data }).json();
      setUser(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error?.response?.json?.()?.error || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    setChangingPassword(true);
    try {
      await api.put('auth/change-password', { 
        json: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }
      }).json();
      passwordForm.reset();
      toast.success('Password changed successfully');
    } catch (error: any) {
      const message = error?.response?.json?.()?.error || 'Failed to change password';
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Topbar />
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Overview */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl">
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{user?.displayName}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(user?.createdAt || '').toLocaleDateString()}</span>
              </div>
              {user?.lastLogin && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
                </div>
              )}
              {user?.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Enter your full name"
                        {...profileForm.register('displayName')}
                      />
                      {profileForm.formState.errors.displayName && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...profileForm.register('email')}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="Enter your phone number"
                        {...profileForm.register('phone')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Enter your location"
                        {...profileForm.register('location')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <LoadingButton 
                      type="submit" 
                      loading={savingProfile}
                      loadingText="Saving..."
                    >
                      Save Changes
                    </LoadingButton>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      {...passwordForm.register('currentPassword')}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        {...passwordForm.register('newPassword')}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        {...passwordForm.register('confirmPassword')}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <LoadingButton 
                      type="submit" 
                      loading={changingPassword}
                      loadingText="Changing..."
                    >
                      Change Password
                    </LoadingButton>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Export</p>
                      <p className="text-sm text-muted-foreground">
                        Download a copy of your account data
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}