'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, Home, FileText, ShoppingCart, Receipt, Users, 
  Package, Wrench, Percent, Settings, Upload, Plus, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/customers', label: 'Customers', icon: Users },
];

const adminItems = [
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/glass-rates', label: 'Glass Rates', icon: Package },
  { href: '/admin/process-master', label: 'Process Master', icon: Wrench },
  { href: '/admin/processes', label: 'Processes (Old)', icon: Wrench },
  { href: '/admin/taxes', label: 'Tax Rates', icon: Percent },
  { href: '/admin/users', label: 'Users & Roles', icon: Users },
  { href: '/uploads', label: 'File Uploads', icon: Upload },
];

type MobileNavProps = {
  currentOrg?: { name: string; role: string };
};

export default function MobileNav({ currentOrg }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
      case 'STAFF': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Navigation</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          {currentOrg && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{currentOrg.name}</div>
                <div className="text-xs text-muted-foreground">Current Organization</div>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getRoleColor(currentOrg.role))}
              >
                {currentOrg.role}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <div className="px-6 pb-6">
          {/* Quick Action */}
          <Button asChild className="w-full mb-4">
            <Link href="/quotes/new" onClick={() => setOpen(false)}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Link>
          </Button>

          {/* Main Navigation */}
          <div className="space-y-1 mb-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Main Menu
            </div>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Admin Navigation */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Administration
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}