'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Min 6 characters'),
  displayName: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterUserPage() {
  const { register, handleSubmit, formState: { isSubmitting, errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('auth/register', { json: data })
        .json<{ token: string; defaultOrgId?: string }>();
      localStorage.setItem('token', res.token);
      if (res.defaultOrgId) localStorage.setItem('orgId', res.defaultOrgId);

      const orgId = localStorage.getItem('orgId');
      toast.success('Account created');
      location.href = orgId ? '/quotes' : '/onboarding/create-org';
    } catch {
      toast.error('Registration failed: Email may already be registered.');
    }
  };

  return (
    <div className="grid place-items-center min-h-dvh p-6">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Create account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input placeholder="Email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}

            <Input placeholder="Password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}

            <Input placeholder="Display name (optional)" {...register('displayName')} />
            <Button className="w-full" disabled={isSubmitting}>Register</Button>
          </form>

          <div className="mt-4 text-sm text-gray-600">
            Want to create business in one step?{' '}
            <Link className="underline" href="/register-owner">Register as Owner</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
