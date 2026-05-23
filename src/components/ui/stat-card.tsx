"use client";
import { GlassCard } from "./glass-card";
import { NumberTicker } from "./number-ticker";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  format?: (v: number) => string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export function StatCard({ title, value, format, icon: Icon, subtitle, trend, delay = 0 }: StatCardProps) {
  const trendColor = trend === "up" ? "text-accent-green" : trend === "down" ? "text-accent-coral" : "text-text-secondary";
  const iconBg = trend === "up" ? "bg-accent-green/10 text-accent-green" : trend === "down" ? "bg-accent-coral/10 text-accent-coral" : "bg-accent-violet/10 text-accent-violet";

  return (
    <GlassCard
      className="flex flex-col gap-3 relative overflow-hidden group"
      transition={{ duration: 0.4, delay }}
    >
      {/* Glow orb */}
      <div className={cn(
        "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500",
        trend === "up" ? "bg-accent-green" : trend === "down" ? "bg-accent-coral" : "bg-accent-violet"
      )} />

      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-secondary">{title}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon size={16} />
        </div>
      </div>

      <NumberTicker
        value={value}
        format={format}
        className={cn("text-2xl font-bold", trendColor)}
      />

      {subtitle && (
        <span className="text-xs text-text-muted">{subtitle}</span>
      )}
    </GlassCard>
  );
}
