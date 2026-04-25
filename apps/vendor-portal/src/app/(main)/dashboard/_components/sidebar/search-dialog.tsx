"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

import { CalendarClock, Fingerprint, Gauge, ListOrdered, Menu, Search, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchItem {
  group: string;
  label: string;
  url: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

const searchItems: SearchItem[] = [
  { group: "Vendor Workspace", icon: ListOrdered, label: "Orders", url: "/dashboard/default" },
  { group: "Vendor Workspace", icon: Store, label: "Profile", url: "/dashboard/crm" },
  { group: "Vendor Workspace", icon: CalendarClock, label: "Availability", url: "/dashboard/finance" },
  { group: "Vendor Workspace", icon: Gauge, label: "Analytics", url: "/dashboard/analytics" },
  { group: "Vendor Workspace", icon: Menu, label: "Menu Management", url: "/dashboard/productivity" },
  { group: "Authentication", icon: Fingerprint, label: "Login v1", url: "/auth/v1/login" },
  { group: "Authentication", icon: Fingerprint, label: "Register v1", url: "/auth/v1/register" },
];

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const groups = [...new Set(searchItems.map((item) => item.group))];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="link"
        className="px-0! font-normal text-muted-foreground hover:no-underline"
      >
        <Search data-icon="inline-start" />
        Search
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search orders, menu, profile, and more..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {groups.map((group, index) => (
              <React.Fragment key={group}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {searchItems
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <CommandItem
                        disabled={item.disabled}
                        key={item.label}
                        onSelect={() => {
                          if (!item.disabled) {
                            router.push(item.url);
                            setOpen(false);
                          }
                        }}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.label}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
