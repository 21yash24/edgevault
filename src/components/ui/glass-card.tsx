"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "violet" | "static";
  glow?: boolean;
  noPadding?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow, noPadding, children, ...props }, ref) => {
    const base = variant === "violet" ? "glass-violet" : variant === "static" ? "glass-static" : "glass";
    return (
      <div
        ref={ref}
        className={cn(base, !noPadding && "p-5", glow && "glow-green", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
