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
  children?: React.ReactNode;
}

export function StatCard({ title, value, format, icon: Icon, subtitle, trend, delay = 0, children }: StatCardProps) {
  const trendColor = trend === "up" ? "text-accent-green" : trend === "down" ? "text-accent-coral" : "text-text-secondary";
  const iconBg = trend === "up" ? "bg-accent-green/10 text-accent-green" : trend === "down" ? "bg-accent-coral/10 text-accent-coral" : "bg-accent-violet/10 text-accent-violet";

  return (
    <GlassCard
      className="flex flex-col justify-between relative overflow-hidden group min-h-[130px] p-5 border border-border-subtle hover:border-accent-violet/30 transition-all duration-300 stat-card"
    >
      {/* Glow orb */}
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none",
        trend === "up" ? "bg-accent-green" : trend === "down" ? "bg-accent-coral" : "bg-accent-violet"
      )} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-text-muted select-none">{title}</span>
          <div className="flex items-baseline gap-2">
            <NumberTicker
              value={value}
              format={format}
              className={cn("text-2xl font-black font-[family-name:var(--font-syne)] tracking-tight", trendColor)}
            />
          </div>
        </div>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border border-border-subtle transition-transform duration-500 group-hover:scale-105", iconBg)}>
          <Icon size={14} className="stroke-[2.5]" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-3">
        {subtitle && (
          <span className="text-[10px] text-text-muted font-bold select-none">{subtitle}</span>
        )}
        {children && (
          <div className="flex-shrink-0 relative">
            {children}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

