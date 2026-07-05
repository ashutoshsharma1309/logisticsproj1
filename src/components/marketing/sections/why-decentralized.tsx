import { Boxes, Check, Fingerprint, Link2, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HashBadge } from "@/components/shared/hash-badge";
import { FadeIn } from "@/components/shared/motion";

interface Block {
  index: number;
  hash: string;
  previousHash: string;
  verifier: string;
  integrity: string;
}

const BLOCKS: Block[] = [
  {
    index: 4821,
    hash: "9f2a4c7e1b6d8035af41c9e27b53d0a6e8f1247c9b0a3e5d7f621948cbe0d3a5",
    previousHash: "3c0e7a12d9f4b586e1078c2a4d6b9f30e5178a2c4b6d8e0f19273a5c6d8b0e4f",
    verifier: "node://eu-central-2",
    integrity: "99.98%",
  },
  {
    index: 4820,
    hash: "3c0e7a12d9f4b586e1078c2a4d6b9f30e5178a2c4b6d8e0f19273a5c6d8b0e4f",
    previousHash: "7b1d5f9028ace46f13a5c7e9b02d4f68150a3c5e7f9b1d3a5c7e9012b4d6f8a0",
    verifier: "node://us-east-1",
    integrity: "99.94%",
  },
  {
    index: 4819,
    hash: "7b1d5f9028ace46f13a5c7e9b02d4f68150a3c5e7f9b1d3a5c7e9012b4d6f8a0",
    previousHash: "0a2c4e6d8f0b1d3a5c7e9f10a2c4e6d8b0f13a5c7e9d1f3b5a7c9e02468acef1",
    verifier: "node://ap-south-1",
    integrity: "99.91%",
  },
];

const COMPARISON = [
  { label: "Single point of tampering", centralized: false, chainroute: true },
  { label: "Cryptographic event integrity", centralized: false, chainroute: true },
  { label: "Independent multi-node verification", centralized: false, chainroute: true },
  { label: "Full replayable audit history", centralized: false, chainroute: true },
];

export function WhyDecentralized() {
  return (
    <section id="benefits" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left: copy */}
        <FadeIn>
          <Badge variant="secondary" className="mb-4">
            <Link2 className="h-3.5 w-3.5" /> Blockchain Simulation Mode
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Why decentralized <span className="text-gradient">simulation</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Every shipment event — a scan, a hand-off, a status change — becomes an immutable
            ledger entry. Each block carries its own hash, a reference to the previous block, a
            signature, the verifying node and an integrity score, so the entire history is
            replayable and tamper-evident.
          </p>
          <p className="mt-4 text-pretty text-base text-muted-foreground">
            This is a{" "}
            <span className="font-semibold text-foreground">Blockchain Simulation Mode</span> — a
            deterministic model of a distributed ledger that demonstrates the trust guarantees of
            decentralization. It is <span className="font-semibold text-foreground">not</span> a
            real blockchain, requires no tokens or gas fees, and runs entirely inside the app.
          </p>

          <ul className="mt-8 space-y-3">
            {COMPARISON.map((row) => (
              <li key={row.label} className="flex items-center gap-4 text-sm">
                <span className="flex w-28 shrink-0 items-center gap-1.5 text-muted-foreground">
                  <X className="h-4 w-4 text-destructive" /> Centralized
                </span>
                <span className="flex flex-1 items-center gap-1.5 font-medium">
                  <Check className="h-4 w-4 text-success" /> {row.label}
                </span>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Right: stacked blocks */}
        <FadeIn delay={0.1} className="relative">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-mesh opacity-60 blur-2xl" />
          <div className="space-y-4">
            {BLOCKS.map((block, i) => (
              <div
                key={block.index}
                className="clay-lg p-5"
                style={{ marginLeft: `${i * 12}px` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary shadow-clay-inset">
                      <Boxes className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">Block</p>
                      <p className="font-mono text-sm font-semibold">#{block.index}</p>
                    </div>
                  </div>
                  <Badge variant="success">
                    <ShieldCheck className="h-3.5 w-3.5" /> {block.integrity}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <HashBadge value={block.hash} label="hash" className="w-full justify-between" />
                  <HashBadge
                    value={block.previousHash}
                    label="prev"
                    copyable={false}
                    className="w-full justify-between opacity-70"
                  />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Fingerprint className="h-3.5 w-3.5 text-secondary" />
                  <span className="font-mono">{block.verifier}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
