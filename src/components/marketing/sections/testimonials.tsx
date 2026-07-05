import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { initials } from "@/lib/utils";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Elena Vasquez",
    role: "VP Supply Chain, NordFreight",
    avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
    quote:
      "The immutable ledger settled a carrier dispute in minutes — we replayed the exact hand-off history and everyone agreed on the facts instantly.",
  },
  {
    name: "Marcus Chen",
    role: "Director of Ops, Aether Cargo",
    avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    quote:
      "ChainRoute's delay prediction flagged a Hamburg bottleneck a full day early. We rerouted, saved three SLAs and looked like heroes to our customers.",
  },
  {
    name: "Priya Nair",
    role: "Head of Logistics, Meridian Ship",
    avatar: "https://avatars.githubusercontent.com/u/810438?v=4",
    quote:
      "The simulator sold our board in one meeting. Watching blocks mint as shipments moved made decentralized trust feel real — not theoretical.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Loved by operators
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Trusted where the stakes are{" "}
            <span className="text-gradient">highest</span>
          </h2>
        </FadeIn>

        <StaggerGroup className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <Card className="clay-interactive flex h-full flex-col p-6">
                <div className="flex gap-0.5" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                <CardContent className="flex-1 p-0 pt-4">
                  <p className="text-pretty text-[15px] leading-relaxed text-foreground/90">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </CardContent>

                <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                  <Avatar>
                    <AvatarImage src={t.avatar} alt={t.name} />
                    <AvatarFallback>{initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
