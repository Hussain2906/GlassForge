'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  gstNumber?: string | null;
};

type CustomerComboboxProps = {
  customers: Customer[];
  value?: string;
  onChange: (customer: Customer | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  className?: string;
};

export default function CustomerCombobox({
  customers,
  value,
  onChange,
  onCreateNew,
  placeholder = "Select customer...",
  className
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedCustomer = customers.find(c => c.id === value);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchValue.toLowerCase()) ||
    customer.gstNumber?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{selectedCustomer.name}</span>
              {selectedCustomer.phone && (
                <span className="text-muted-foreground text-sm">
                  • {selectedCustomer.phone}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search customers..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="py-6 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No customers found
              </p>
              {onCreateNew && (
                <Button
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                  className="mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Customer
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandGroup>
            {onCreateNew && (
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onCreateNew();
                }}
                className="border-b"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="font-medium">Create New Customer</span>
              </CommandItem>
            )}
            
            {filteredCustomers.map((customer) => (
              <CommandItem
                key={customer.id}
                onSelect={() => {
                  onChange(customer.id === value ? null : customer);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === customer.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.phone && `${customer.phone} • `}
                    {customer.gstNumber || 'No GST'}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}