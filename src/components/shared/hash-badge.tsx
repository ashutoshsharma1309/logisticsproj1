"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn, truncateHash } from "@/lib/utils";
import { toast } from "sonner";

interface HashBadgeProps {
  value: string;
  label?: string;
  className?: string;
  lead?: number;
  tail?: number;
  copyable?: boolean;
}

export function HashBadge({
  value,
  label,
  className,
  lead = 8,
  tail = 6,
  copyable = true,
}: HashBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Hash copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Unable to copy");
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground shadow-clay-inset",
        className,
      )}
    >
      {label && <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>}
      <span className="text-foreground/80">{truncateHash(value, lead, tail)}</span>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          aria-label="Copy hash"
          className="rounded p-0.5 transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </span>
  );
}
