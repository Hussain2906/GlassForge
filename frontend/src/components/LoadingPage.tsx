'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

type LoadingPageProps = {
  title?: string;
  description?: string;
  showTopbar?: boolean;
};

export default function LoadingPage({ 
  title = "Loading...", 
  description = "Please wait while we load your data",
  showTopbar = true 
}: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar Skeleton */}
      {showTopbar && (
        <div className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-6 mr-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-xl">Glass ERP</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </nav>

            <div className="flex items-center gap-3 ml-auto">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="fixed bottom-6 right-6">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <div className="text-sm">
                <div className="font-medium">{title}</div>
                <div className="text-muted-foreground text-xs">{description}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Specific loading components for different page types
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-10 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableLoading({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}