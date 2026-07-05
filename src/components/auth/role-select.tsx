"use client";

import { ShieldCheck, ClipboardList, Warehouse, Truck, User, Check } from "lucide-react";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface RoleOption {
  value: UserRole;
  label: string;
  hint: string;
  icon: typeof ShieldCheck;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: "admin", label: "Admin", hint: "Full control", icon: ShieldCheck },
  { value: "manager", label: "Manager", hint: "Operations", icon: ClipboardList },
  { value: "warehouse", label: "Warehouse Staff", hint: "Inventory", icon: Warehouse },
  { value: "driver", label: "Driver", hint: "Fleet & routes", icon: Truck },
  { value: "customer", label: "Customer", hint: "Track orders", icon: User },
];

interface RoleSelectProps {
  value: UserRole | undefined;
  onChange: (value: UserRole) => void;
}

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Select your role">
      {ROLE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative flex flex-col items-start gap-2 rounded-2xl bg-card p-3.5 text-left shadow-clay-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "shadow-clay ring-2 ring-primary",
            )}
          >
            {selected && (
              <span className="absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            )}
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-xl transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col">
              <span
                className={cn(
                  "text-sm font-semibold leading-tight",
                  selected ? "text-foreground" : "text-foreground/90",
                )}
              >
                {option.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{option.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
