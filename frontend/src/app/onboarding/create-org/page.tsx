'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({ name: z.string().min(2, 'Business name required') });
type FormData = z.infer<typeof schema>;

export default function CreateOrgPage() {
  const { register, handleSubmit, formState: { isSubmitting, errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('auth/orgs', { json: data })
        .json<{ token: string; defaultOrgId: string }>();
      localStorage.setItem('token', res.token);
      localStorage.setItem('orgId', res.defaultOrgId);
      toast.success('Business created!');
      location.href = '/quotes';
    } catch {
      toast.error('Could not create business');
    }
  };

  return (
    <div className="grid place-items-center min-h-dvh p-6">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Name your business</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input placeholder="Business name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            <Button className="w-full" disabled={isSubmitting}>Create business</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
