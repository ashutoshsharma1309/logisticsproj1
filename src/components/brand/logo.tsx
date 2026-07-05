import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, href = "/", showText = true, size = "md" }: LogoProps) {
  const dim = size === "sm" ? 30 : size === "lg" ? 44 : 36;
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative grid place-items-center rounded-xl bg-gradient-to-br from-primary via-accent to-secondary shadow-clay-sm"
        style={{ width: dim, height: dim }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="text-white"
          style={{ width: dim * 0.6, height: dim * 0.6 }}
        >
          <path
            d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            className="opacity-90"
          />
          <path
            d="M3 6.5 12 11l9-4.5M12 11v11"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            className="opacity-70"
          />
          <circle cx="12" cy="11" r="1.6" fill="currentColor" />
        </svg>
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-tight",
              size === "lg" ? "text-xl" : "text-[17px]",
            )}
          >
            ChainRoute<span className="text-primary"> AI</span>
          </span>
          {size !== "sm" && (
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Logistics Intelligence
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </Link>
    );
  }
  return content;
}
