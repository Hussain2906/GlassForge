'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiV1 } from '@/lib/api';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  gstNumber?: string | null;
  billingAddress?: any;
};

const schema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

type CreateCustomerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
};

export default function CreateCustomerModal({
  open,
  onOpenChange,
  onCustomerCreated
}: CreateCustomerModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (formData: FormData) => {
    try {
      const customer = await apiV1.post('customers', { json: formData }).json<Customer>();
      reset();
      onOpenChange(false);
      onCustomerCreated(customer);
      toast.success('Customer created successfully');
    } catch {
      toast.error('Failed to create customer');
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Customer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input placeholder="e.g., John Doe" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="e.g., +91 9876543210" {...register('phone')} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>GST Number</Label>
              <Input placeholder="e.g., 29ABCDE1234F1Z5" {...register('gstNumber')} />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-base font-medium">Billing Address (Optional)</Label>
            <div className="grid gap-4 md:grid-cols-2 mt-2">
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input placeholder="Street address" {...register('billingAddress.street')} />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" {...register('billingAddress.city')} />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="State" {...register('billingAddress.state')} />
              </div>

              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input placeholder="Pincode" {...register('billingAddress.pincode')} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}