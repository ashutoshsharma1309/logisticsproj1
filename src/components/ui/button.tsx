"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-clay-sm hover:-translate-y-0.5 hover:shadow-clay hover:brightness-105",
        secondary:
          "bg-secondary text-secondary-foreground shadow-clay-sm hover:-translate-y-0.5 hover:shadow-clay",
        destructive:
          "bg-destructive text-destructive-foreground shadow-clay-sm hover:-translate-y-0.5 hover:shadow-clay",
        outline:
          "border border-border bg-card/60 shadow-clay-sm hover:bg-muted hover:-translate-y-0.5",
        ghost: "hover:bg-muted hover:text-foreground",
        clay: "bg-card text-foreground shadow-clay hover:-translate-y-0.5 hover:shadow-clay-lg active:shadow-clay-sm",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-br from-primary via-accent to-secondary text-white shadow-clay-sm hover:-translate-y-0.5 hover:shadow-glow",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
