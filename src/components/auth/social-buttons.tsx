"use client";

import { Github, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SocialProvider {
  id: string;
  label: string;
  icon: typeof Github;
}

const PROVIDERS: SocialProvider[] = [
  { id: "google", label: "Google", icon: Mail },
  { id: "github", label: "GitHub", icon: Github },
  { id: "microsoft", label: "Microsoft", icon: Building2 },
];

export function SocialButtons() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              onClick={() => toast.info("Social sign-in is a demo")}
              aria-label={`Continue with ${provider.label}`}
              className="h-11"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{provider.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
