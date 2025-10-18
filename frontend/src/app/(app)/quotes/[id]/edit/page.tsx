'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiV1 } from '@/lib/api';
import { toast } from 'sonner';
import Topbar from '@/components/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditQuote() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => apiV1.get(`quotes/${id}`).json<any>()
  });

  if (isLoading) {
    return (
      <div>
        <Topbar />
        <div className="p-6">Loading...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div>
        <Topbar />
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <p>Quote not found</p>
              <Button asChild className="mt-4">
                <Link href="/quotes">Back to Quotes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (quote.status !== 'DRAFT') {
    return (
      <div>
        <Topbar />
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <p>Only DRAFT quotes can be edited</p>
              <Button asChild className="mt-4">
                <Link href={`/quotes/${id}`}>Back to Quote</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/quotes/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Quote</h1>
            <p className="text-sm text-muted-foreground">Quote: {quote.quoteNo}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">
              Quote editing functionality is under development.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              For now, please delete this quote and create a new one with the correct information.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/quotes/${id}`}>Back to Quote</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/quotes/new">Create New Quote</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
