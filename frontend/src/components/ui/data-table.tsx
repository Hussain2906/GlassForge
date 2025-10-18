'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  onRefresh,
  actions,
  emptyState,
  className
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        {columns.map((column, j) => (
          <TableCell key={j} className={column.className}>
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
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  const renderEmptyState = () => {
    if (emptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length}>
            {emptyState}
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow>
        <TableCell colSpan={columns.length}>
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className={className}>
      {(title || description || searchable || actions || onRefresh) && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <CardTitle className="text-base">
                  {loading ? 'Loading...' : title}
                </CardTitle>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {actions}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {searchable && (
          <div className="p-4 border-b bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        
        <div className="rounded-md border-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && renderSkeletonRows()}
              
              {!loading && data.length === 0 && renderEmptyState()}
              
              {!loading && data.map((item, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  {columns.map((column, j) => (
                    <TableCell key={j} className={column.className}>
                      {column.render 
                        ? column.render(item)
                        : String(item[column.key] || '')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}