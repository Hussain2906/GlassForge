'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown, Package, Wrench, Percent, Users, Building2,
  BarChart3, FileText, ShoppingCart, Receipt, Upload,
  Settings, LogOut, User, Bell, Search, Plus, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileNav from './MobileNav';

type Org = { id: string; name: string; role: 'ADMIN' | 'STAFF' | 'VIEWER' };

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

const adminItems = [
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/glass-rates', label: 'Glass Rates', icon: Package },
  { href: '/admin/process-master', label: 'Process Master', icon: Wrench },
  { href: '/admin/processes', label: 'Processes (Old)', icon: Wrench },
  { href: '/admin/taxes', label: 'Tax Rates', icon: Percent },
  { href: '/admin/users', label: 'Users & Roles', icon: Users },
  { href: '/admin/settings', label: 'Organization Settings', icon: Settings },
];

export default function Topbar() {
  const pathname = usePathname();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<{ displayName: string; email: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('auth/me').json<{
          orgs: Org[];
          defaultOrgId?: string;
          user: { displayName: string; email: string };
        }>();
        setOrgs(me.orgs);
        setUser(me.user);
        const current = localStorage.getItem('orgId') || me.defaultOrgId || me.orgs[0]?.id;
        if (current) {
          localStorage.setItem('orgId', current);
          setOrgId(current);
        }
      } catch {
        // not logged in yet
      }
    })();
  }, []);

  const onSwitch = async (v: string) => {
    setOrgId(v);
    localStorage.setItem('orgId', v);
    try {
      const r = await api.post('auth/switch-org', { json: { orgId: v } }).json<{ token: string }>();
      localStorage.setItem('token', r.token);
    } catch { }
    location.reload();
  };

  const currentOrg = orgs.find(org => org.id === orgId);
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
      case 'STAFF': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="flex h-16 items-center px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6 mr-8">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 hover:scale-105">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-600/20">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Glass ERP
            </span>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <MobileNav currentOrg={currentOrg} />

        {/* Main Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Admin Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 h-auto font-medium",
                  pathname?.startsWith('/admin')
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Settings className="h-4 w-4" />
                Admin
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Administration
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/uploads" className="flex items-center gap-3">
                  <Upload className="h-4 w-4" />
                  <span>File Uploads</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search quotes, orders, customers..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search Button for Mobile */}
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Search className="h-4 w-4" />
          </Button>
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse ring-2 ring-red-500/20"></span>
          </Button>

          {/* Organization Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 max-w-48">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium truncate">
                    {currentOrg?.name || 'Select Organization'}
                  </span>
                  {currentOrg && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs h-4 px-1", getRoleColor(currentOrg.role))}
                    >
                      {currentOrg.role}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orgs.map(org => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => onSwitch(org.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.role.toLowerCase()} access
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getRoleColor(org.role))}
                  >
                    {org.role}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {user?.displayName || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/organization/profile">
                  <Building2 className="h-4 w-4 mr-2" />
                  Organization Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { localStorage.clear(); location.href = '/login'; }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}