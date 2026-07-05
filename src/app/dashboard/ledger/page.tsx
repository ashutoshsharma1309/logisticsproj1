"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Blocks,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Fingerprint,
  Gauge,
  Layers,
  Link2,
  MapPin,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { HashBadge } from "@/components/shared/hash-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCollection } from "@/hooks/use-collection";
import { verifyChain } from "@/lib/ledger/mint";
import { STATUS_META, integrityVariant } from "@/config/status";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import type { LedgerBlock } from "@/lib/db/types";

const PAGE_SIZE = 8;
const ALL = "__all__";

/** Colored integrity bar fill keyed off the block's integrity score. */
function integrityBarColor(score: number): string {
  if (score >= 99) return "bg-success";
  if (score >= 97) return "bg-secondary";
  return "bg-warning";
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint: string;
  accent: string;
}

function StatCard({ icon: Icon, label, value, hint, accent }: StatCardProps) {
  return (
    <Card className="clay-interactive overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-clay-sm",
            accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="truncate text-2xl font-bold tabular-nums">{value}</div>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function LedgerExplorer() {
  const searchParams = useSearchParams();
  const { items } = useCollection("ledger");

  // Present newest-first regardless of store order.
  const ledger = React.useMemo(
    () => [...items].sort((a, b) => b.blockIndex - a.blockIndex),
    [items],
  );

  const [query, setQuery] = React.useState(() => searchParams.get("q") ?? "");
  const [verifier, setVerifier] = React.useState<string>(ALL);
  const [status, setStatus] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<LedgerBlock | null>(null);

  // Keep search in sync if the URL query changes (e.g. arriving from a link).
  React.useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const verifiers = React.useMemo(
    () => Array.from(new Set(ledger.map((b) => b.verifier))).sort(),
    [ledger],
  );

  const statuses = React.useMemo(
    () => Array.from(new Set(ledger.map((b) => b.status))),
    [ledger],
  );

  const integrity = React.useMemo(() => verifyChain(items), [items]);

  const latest = React.useMemo(
    () => ledger.reduce((max, b) => Math.max(max, b.blockIndex), 0),
    [ledger],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ledger.filter((b) => {
      if (verifier !== ALL && b.verifier !== verifier) return false;
      if (status !== ALL && b.status !== status) return false;
      if (!q) return true;
      return (
        b.hash.toLowerCase().includes(q) ||
        b.previousHash.toLowerCase().includes(q) ||
        b.shipmentRef.toLowerCase().includes(q) ||
        b.verifier.toLowerCase().includes(q) ||
        String(b.blockIndex).includes(q)
      );
    });
  }, [ledger, query, verifier, status]);

  // Reset to first page whenever the active filter set changes.
  React.useEffect(() => {
    setPage(0);
  }, [query, verifier, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );

  const runVerify = React.useCallback(() => {
    const result = verifyChain(items);
    if (result.valid) {
      toast.success("Chain verified", {
        description: `All ${formatNumber(items.length)} blocks are cryptographically linked.`,
      });
    } else {
      toast.error("Chain integrity broken", {
        description: `Verification failed at block #${result.brokenAt}.`,
      });
    }
  }, [items]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ledger Explorer"
        description="Browse the immutable, chained ledger of shipment checkpoints. Every block is minted from your own shipment events and cryptographically linked to its predecessor — a fully decentralized simulation of a supply-chain blockchain."
      >
        <Badge variant="accent" className="gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Blockchain Simulation Mode
        </Badge>
      </PageHeader>

      {ledger.length === 0 ? (
        <EmptyState
          icon={Blocks}
          title="No ledger blocks yet"
          description="Blocks are minted automatically as your shipments are created and progress. Create a shipment to begin the chain."
          action={
            <Button asChild variant="gradient">
              <Link href="/dashboard/shipments?new=1">Create a shipment</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Blocks}
              label="Total Blocks"
              value={formatNumber(ledger.length)}
              hint="Confirmed ledger entries"
              accent="bg-primary/15 text-primary"
            />
            <StatCard
              icon={integrity.valid ? ShieldCheck : ShieldOff}
              label="Chain Integrity"
              value={
                integrity.valid ? (
                  <Badge variant="success" className="text-sm">
                    Valid ✓
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-sm">
                    Broken at #{integrity.brokenAt}
                  </Badge>
                )
              }
              hint="Recomputed over stored hashes"
              accent={
                integrity.valid
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }
            />
            <StatCard
              icon={Users}
              label="Verifiers"
              value={formatNumber(verifiers.length)}
              hint="Distinct validator nodes"
              accent="bg-secondary/15 text-secondary"
            />
            <StatCard
              icon={Layers}
              label="Latest Block"
              value={`#${formatNumber(latest)}`}
              hint="Head of the chain"
              accent="bg-accent/15 text-accent"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by hash, prev-hash, shipment ref, verifier, or block #"
                  className="pl-10"
                  aria-label="Search the ledger"
                />
              </div>
              <div className="flex gap-3">
                <Select value={verifier} onValueChange={setVerifier}>
                  <SelectTrigger className="w-full min-w-[170px] md:w-[190px]">
                    <SelectValue placeholder="Verifier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All verifiers</SelectItem>
                    {verifiers.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full min-w-[150px] md:w-[170px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All statuses</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="clay" onClick={runVerify} className="shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                  Verify chain
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {formatNumber(filtered.length)}{" "}
              {filtered.length === 1 ? "block" : "blocks"} match
            </span>
            <span>
              Page {current + 1} of {pageCount}
            </span>
          </div>

          {/* Block list */}
          {visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No blocks found"
              description="No ledger entries match your filters. Try a different hash, shipment reference, or clear the verifier/status filters."
            />
          ) : (
            <div className="space-y-0">
              {visible.map((block, idx) => (
                <div key={block.id}>
                  <FadeIn delay={idx * 0.04} y={16}>
                    <button
                      type="button"
                      onClick={() => setSelected(block)}
                      className="w-full text-left"
                      aria-label={`Open block ${block.blockIndex}`}
                    >
                      <Card className="clay-interactive">
                        <CardContent className="p-5">
                          <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                            {/* Block index + status */}
                            <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
                              <div className="flex h-12 w-16 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 shadow-clay-inset">
                                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                                  Block
                                </span>
                                <span className="text-base font-bold tabular-nums text-primary">
                                  #{block.blockIndex}
                                </span>
                              </div>
                              <StatusBadge status={block.status} />
                            </div>

                            {/* Core fields */}
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="font-mono text-sm font-semibold">
                                  {block.shipmentRef}
                                </span>
                                <span className="text-xs font-medium text-foreground/70">
                                  {block.action}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Cpu className="h-3.5 w-3.5" />
                                  {block.node}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {block.location}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  {block.verifier}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(block.timestamp)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <HashBadge
                                  value={block.hash}
                                  label="HASH"
                                  copyable={false}
                                />
                                <HashBadge
                                  value={block.previousHash}
                                  label="PREV"
                                  copyable={false}
                                />
                                <HashBadge
                                  value={block.signature}
                                  label="SIG"
                                  lead={6}
                                  tail={6}
                                  copyable={false}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                <span>
                                  Nonce:{" "}
                                  <span className="font-mono text-foreground/80">
                                    {block.nonce}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Integrity */}
                            <div className="w-full space-y-1.5 lg:w-40">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Integrity
                                </span>
                                <Badge
                                  variant={integrityVariant(block.integrityScore)}
                                >
                                  {block.integrityScore}%
                                </Badge>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted shadow-clay-inset">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    integrityBarColor(block.integrityScore),
                                  )}
                                  style={{ width: `${block.integrityScore}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </FadeIn>

                  {/* Chain connector between consecutive blocks */}
                  {idx < visible.length - 1 && (
                    <div
                      className="flex flex-col items-center py-1 text-muted-foreground/60"
                      aria-hidden="true"
                    >
                      <Link2 className="h-3.5 w-3.5 rotate-90" />
                      <ChevronDown className="-mt-1 h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={current === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {current + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={current >= pageCount - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Block detail dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-clay-sm">
                    <Blocks className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      Block #{selected.blockIndex}
                      <StatusBadge status={selected.status} />
                    </DialogTitle>
                    <DialogDescription>
                      {selected.action} · {formatDateTime(selected.timestamp)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/40 p-4 shadow-clay-inset">
                  <DetailRow label="Shipment" value={selected.shipmentRef} />
                  <Separator className="my-1 opacity-60" />
                  <DetailRow label="Action" value={selected.action} />
                  <DetailRow label="Node" value={selected.node} />
                  <DetailRow label="Location" value={selected.location} />
                  <DetailRow label="Verifier" value={selected.verifier} />
                  <Separator className="my-1 opacity-60" />
                  <DetailRow
                    label="Integrity"
                    value={
                      <Badge variant={integrityVariant(selected.integrityScore)}>
                        {selected.integrityScore}%
                      </Badge>
                    }
                  />
                  <DetailRow label="Nonce" value={selected.nonce} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Fingerprint className="h-3.5 w-3.5" /> Cryptographic proof
                  </div>
                  <div className="flex flex-col gap-2">
                    <HashBadge
                      value={selected.hash}
                      label="HASH"
                      lead={64}
                      tail={0}
                      className="w-full justify-start break-all"
                    />
                    <HashBadge
                      value={selected.previousHash}
                      label="PREV"
                      lead={64}
                      tail={0}
                      className="w-full justify-start break-all"
                    />
                    <HashBadge
                      value={selected.signature}
                      label="SIG"
                      lead={64}
                      tail={0}
                      className="w-full justify-start break-all"
                    />
                  </div>
                </div>

                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Immutable simulated record — cross-signed by decentralized
                  validators. Not a real blockchain.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Gauge className="mr-2 h-4 w-4 animate-spin" />
          Loading ledger…
        </div>
      }
    >
      <LedgerExplorer />
    </React.Suspense>
  );
}
