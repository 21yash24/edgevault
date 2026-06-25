"use client";
import { GlassCard } from "./glass-card";
import { NumberTicker } from "./number-ticker";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 20;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h,
  ]);
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="opacity-70"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Trend Badge ──────────────────────────────────────────────────────────────
function TrendBadge({ value, label }: { value: number; label: string }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-lg",
        isFlat
          ? "bg-text-muted/10 text-text-muted"
          : isUp
          ? "bg-accent-green/10 text-accent-green"
          : "bg-accent-coral/10 text-accent-coral"
      )}
    >
      {isFlat ? (
        <Minus size={8} className="stroke-[3]" />
      ) : isUp ? (
        <ArrowUpRight size={8} className="stroke-[3]" />
      ) : (
        <ArrowDownRight size={8} className="stroke-[3]" />
      )}
      {Math.abs(value).toFixed(1)}% {label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  format?: (v: number) => string;
  icon: LucideIcon;
  subtitle?: string;
  /** Legacy colour-only trend — kept for backward compatibility */
  trend?: "up" | "down" | "neutral";
  /** New rich trend object: shows "↑12% vs last week" below the value */
  trendData?: { value: number; label: string };
  /** Optional sparkline data array rendered as mini SVG chart */
  sparkline?: number[];
  delay?: number;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  format,
  icon: Icon,
  subtitle,
  trend,
  trendData,
  sparkline,
  delay = 0,
  children,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-accent-green"
      : trend === "down"
      ? "text-accent-coral"
      : "text-text-secondary";

  const iconBg =
    trend === "up"
      ? "bg-accent-green/10 text-accent-green"
      : trend === "down"
      ? "bg-accent-coral/10 text-accent-coral"
      : "bg-accent-violet/10 text-accent-violet";

  const glowColor =
    trend === "up"
      ? "bg-accent-green"
      : trend === "down"
      ? "bg-accent-coral"
      : "bg-accent-violet";

  const sparklineColor =
    trend === "up" ? "#00FFB2" : trend === "down" ? "#FF2D55" : "#7B61FF";

  const hoverBorderColor =
    trend === "up"
      ? "hover:border-accent-green/40 hover:shadow-[0_0_20px_rgba(0,255,178,0.08)]"
      : trend === "down"
      ? "hover:border-accent-coral/40 hover:shadow-[0_0_20px_rgba(255,45,85,0.08)]"
      : "hover:border-accent-violet/40 hover:shadow-[0_0_20px_rgba(123,97,255,0.08)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <GlassCard
        className={cn(
          "flex flex-col justify-between relative overflow-hidden group min-h-[130px] p-5 border border-border-subtle transition-all duration-300 stat-card h-full",
          hoverBorderColor
        )}
      >
        {/* Glow orb */}
        <div
          className={cn(
            "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none",
            glowColor
          )}
        />

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted select-none">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <NumberTicker
                value={value}
                format={format}
                className={cn(
                  "text-2xl font-black font-[family-name:var(--font-inter)] tracking-tight",
                  trendColor
                )}
              />
            </div>
            {/* Rich trend data badge */}
            {trendData !== undefined && (
              <div className="pt-0.5">
                <TrendBadge value={trendData.value} label={trendData.label} />
              </div>
            )}
          </div>
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border border-border-subtle transition-transform duration-500 group-hover:scale-105",
              iconBg
            )}
          >
            <Icon size={14} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 mt-3">
          <div className="flex-1 min-w-0">
            {subtitle && (
              <span className="text-[10px] text-text-muted font-bold select-none">
                {subtitle}
              </span>
            )}
            {children && (
              <div className="flex-shrink-0 relative mt-1">{children}</div>
            )}
          </div>

          {/* Sparkline pinned to bottom-right */}
          {sparkline && sparkline.length >= 2 && (
            <div className="flex-shrink-0 self-end opacity-80 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkline data={sparkline} color={sparklineColor} />
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
