import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  showActions?: boolean
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  showActions = true 
}: TableSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="rounded-md border overflow-x-auto">
          {/* Search/Filter Bar */}
          <div className="p-4 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
          
          {/* Table Header */}
          <div className={`grid grid-cols-${columns} gap-4 p-4 border-b bg-gray-50`}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={`grid grid-cols-${columns} gap-4 p-4 border-b hover:bg-gray-50/50`}>
              {Array.from({ length: columns - (showActions ? 1 : 0) }).map((_, j) => (
                <div key={j} className="flex items-center">
                  {j === 0 ? (
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-4 w-24" />
                  )}
                </div>
              ))}
              {showActions && (
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SimpleTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-4 gap-4 p-4 border-b bg-gray-50">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}