'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Key, Clock, AlertTriangle } from 'lucide-react';
import { apiV1 } from '@/lib/api';

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
    sessionTimeout: 30,
    ipWhitelist: '',
    auditLogging: true,
    loginNotifications: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordPolicyChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      passwordPolicy: { ...prev.passwordPolicy, [key]: value }
    }));
  };

  const saveSettings = async () => {
    try {
      await apiV1.put('admin/security', { json: settings }).json();
      toast.success('Security settings updated successfully');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authentication & Access
          </CardTitle>
          <CardDescription>
            Configure authentication and access control settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all organization members
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
            />
          </div>

          <div className="space-y-4">
            <Label>Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="space-y-4">
            <Label>IP Whitelist</Label>
            <Input
              placeholder="192.168.1.0/24, 10.0.0.0/8 (comma separated)"
              value={settings.ipWhitelist}
              onChange={(e) => handleSettingChange('ipWhitelist', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to allow access from any IP address
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Set password requirements for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Minimum Password Length</Label>
            <Input
              type="number"
              min="6"
              max="32"
              value={settings.passwordPolicy.minLength}
              onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Require Uppercase Letters</Label>
              <Switch
                checked={settings.passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireUppercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Numbers</Label>
              <Switch
                checked={settings.passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Special Characters</Label>
              <Switch
                checked={settings.passwordPolicy.requireSymbols}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireSymbols', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Monitoring & Notifications
          </CardTitle>
          <CardDescription>
            Configure security monitoring and alert preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log all user actions and system events
              </p>
            </div>
            <Switch
              checked={settings.auditLogging}
              onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for new logins
              </p>
            </div>
            <Switch
              checked={settings.loginNotifications}
              onCheckedChange={(checked) => handleSettingChange('loginNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Security Status
          </CardTitle>
          <CardDescription>
            Current security configuration overview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">2FA Status</span>
              <Badge variant={settings.twoFactorAuth ? 'default' : 'destructive'}>
                {settings.twoFactorAuth ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Password Policy</span>
              <Badge variant="default">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Audit Logging</span>
              <Badge variant={settings.auditLogging ? 'default' : 'destructive'}>
                {settings.auditLogging ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">IP Restrictions</span>
              <Badge variant={settings.ipWhitelist ? 'default' : 'secondary'}>
                {settings.ipWhitelist ? 'Active' : 'None'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings}>
          Save Security Settings
        </Button>
      </div>
    </div>
  );
}