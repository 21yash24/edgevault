"use client";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "violet" | "static";
  glow?: boolean;
  noPadding?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow, noPadding, children, ...props }, ref) => {
    const base = variant === "violet" ? "glass-violet" : variant === "static" ? "glass-static" : "glass";
    return (
      <motion.div
        ref={ref}
        className={cn(base, !noPadding && "p-5", glow && "glow-green", className)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
