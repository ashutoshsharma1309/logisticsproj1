import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Simulation", href: "/#simulation" },
      { label: "AI Engine", href: "/#ai" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Ledger Explorer", href: "/dashboard/ledger" },
      { label: "Analytics", href: "/dashboard/analytics" },
      { label: "Fleet", href: "/dashboard/fleet" },
      { label: "Warehouses", href: "/dashboard/warehouses" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#benefits" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/#faq" },
      { label: "Careers", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/contact" },
      { label: "Terms", href: "/contact" },
      { label: "Security", href: "/contact" },
      { label: "Status", href: "/contact" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Decentralized logistics intelligence with an immutable simulated ledger,
              predictive AI, and enterprise-grade visibility.
            </p>
            <div className="flex gap-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-card text-muted-foreground shadow-clay-sm transition-all hover:-translate-y-0.5 hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 ChainRoute AI. All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
            Blockchain Simulation Mode — not a live blockchain network
          </p>
        </div>
      </div>
    </footer>
  );
}
