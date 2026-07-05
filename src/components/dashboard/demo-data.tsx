"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { seedSampleData, clearWorkspace } from "@/lib/db/seed";
import { toast } from "sonner";

/**
 * Opt-in demo-data controls. Nothing is seeded automatically — the user chooses
 * to load a sample dataset (useful for hosted previews) or reset to empty.
 */
export function LoadDemoButton({
  variant = "gradient",
  className,
}: {
  variant?: "gradient" | "clay" | "outline";
  className?: string;
}) {
  const { orgId, account } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const load = () => {
    if (!orgId || !account) return;
    setLoading(true);
    // defer so the spinner paints before the synchronous seed work
    setTimeout(() => {
      seedSampleData(orgId, { id: account.id, name: account.name });
      toast.success("Sample dataset loaded", {
        description: "Explore the dashboard, ledger and analytics with live data.",
      });
      setLoading(false);
      router.refresh();
    }, 50);
  };

  return (
    <Button variant={variant} className={className} onClick={load} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
      Load demo data
    </Button>
  );
}

export function ResetWorkspaceButton() {
  const { orgId } = useAuth();
  const [open, setOpen] = React.useState(false);

  const reset = () => {
    if (orgId) clearWorkspace(orgId);
    toast.success("Workspace reset", { description: "All records were cleared." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)} className="text-destructive">
        <Trash2 className="h-4 w-4" /> Reset workspace
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset workspace?</DialogTitle>
          <DialogDescription>
            This permanently deletes all warehouses, fleet, customers, shipments, invoices,
            ledger blocks and logs in this workspace. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={reset}>
            <Trash2 className="h-4 w-4" /> Delete everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
