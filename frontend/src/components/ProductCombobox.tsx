'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { Product } from '@/lib/types';

export default function ProductCombobox({
  products,
  value,
  onChange,
  className
}: {
  products: Product[];
  value?: string;                 // productId
  onChange: (product: Product | null) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = products.find(p => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between w-full', className)}
        >
          {selected ? (
            <span className="truncate text-left">
              <span className="font-medium">{selected.name}</span>
              {selected.thicknessMm ? <span className="text-gray-500"> · {selected.thicknessMm}mm</span> : null}
            </span>
          ) : (
            'Select product…'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px]">
        <Command>
          <CommandInput placeholder="Search products…" />
          <CommandEmpty>No product found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {products.map((p) => (
              <CommandItem
                key={p.id}
                value={p.name}
                onSelect={() => {
                  onChange(p);
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', p.id === value ? 'opacity-100' : 'opacity-0')} />
                <div className="flex w-full items-center justify-between">
                  <div className="truncate">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {(p.thicknessMm ?? '') && `${p.thicknessMm}mm`} {(p.unitPrice ?? 0) ? `• ₹${p.unitPrice}/m²` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">#{p.id.slice(-4)}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
