"use client";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Base shimmer helper
// ─────────────────────────────────────────────
function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("rounded-lg overflow-hidden relative", className)}
      style={{
        background:
          "linear-gradient(90deg, var(--shimmer-1) 25%, var(--shimmer-2) 50%, var(--shimmer-1) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite linear",
        ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// SkeletonBox — generic shimmer box
// ─────────────────────────────────────────────
export function SkeletonBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <Shimmer className={cn("w-full h-4", className)} style={style as any} />;
}

// ─────────────────────────────────────────────
// SkeletonText — one or more shimmer text lines
// ─────────────────────────────────────────────
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className="h-3 rounded"
          style={{
            width: i === lines - 1 && lines > 1 ? "65%" : "100%",
            background:
              "linear-gradient(90deg, var(--shimmer-1) 25%, var(--shimmer-2) 50%, var(--shimmer-1) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite linear",
            animationDelay: `${i * 0.1}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SkeletonCard — full GlassCard-shaped shimmer
// ─────────────────────────────────────────────
export function SkeletonCard({
  className,
  height = 160,
  children,
}: {
  className?: string;
  height?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl border border-border-subtle p-5 space-y-4 overflow-hidden",
        className
      )}
      style={{ minHeight: height }}
    >
      {children ?? (
        <>
          <div className="flex items-center justify-between">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="h-8 w-8 rounded-xl" />
          </div>
          <Shimmer className="h-8 w-40" />
          <Shimmer className="h-3 w-24" />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SkeletonStatCard — mimics StatCard layout
// ─────────────────────────────────────────────
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl border border-border-subtle p-5 flex flex-col justify-between min-h-[130px] overflow-hidden relative",
        className
      )}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Shimmer className="h-2.5 w-24 rounded" />
          <Shimmer className="h-7 w-32 rounded" />
        </div>
        <Shimmer className="h-8 w-8 rounded-xl flex-shrink-0" />
      </div>
      {/* Bottom: subtitle */}
      <div className="mt-3">
        <Shimmer className="h-2.5 w-20 rounded" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SkeletonTradeRow — mimics TradeCard row
// ─────────────────────────────────────────────
export function SkeletonTradeRow({
  className,
  index = 0,
}: {
  className?: string;
  index?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card px-4 py-3 overflow-hidden",
        className
      )}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Accent bar */}
      <Shimmer className="w-1 self-stretch rounded-full flex-shrink-0" style={{ minHeight: 44 } as React.CSSProperties} />
      {/* Checkbox placeholder */}
      <Shimmer className="h-4 w-4 rounded-md flex-shrink-0" />
      {/* Symbol block */}
      <div className="w-28 space-y-1.5 flex-shrink-0">
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-2.5 w-20 rounded" />
      </div>
      {/* PnL block */}
      <div className="w-28 space-y-1.5 flex-shrink-0">
        <Shimmer className="h-6 w-20 rounded" />
        <Shimmer className="h-2.5 w-10 rounded" />
      </div>
      {/* Tags */}
      <div className="flex-1 hidden md:flex gap-2">
        <Shimmer className="h-4 w-16 rounded-lg" />
        <Shimmer className="h-4 w-20 rounded-lg" />
        <Shimmer className="h-4 w-14 rounded-lg" />
      </div>
      {/* Metrics */}
      <div className="hidden lg:flex gap-4">
        <div className="w-12 space-y-1">
          <Shimmer className="h-2 w-8 rounded" />
          <Shimmer className="h-3 w-10 rounded" />
        </div>
        <div className="w-12 space-y-1">
          <Shimmer className="h-2 w-8 rounded" />
          <Shimmer className="h-3 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SkeletonChart — shimmer for a chart area
// ─────────────────────────────────────────────
export function SkeletonChart({
  className,
  height = 200,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Chart title row */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-32 rounded" />
        <div className="flex gap-1">
          {["1W", "1M", "3M", "ALL"].map((_, i) => (
            <Shimmer key={i} className="h-6 w-8 rounded-md" />
          ))}
        </div>
      </div>
      {/* Chart body */}
      <div
        className="w-full rounded-xl overflow-hidden relative"
        style={{
          height,
          background:
            "linear-gradient(90deg, var(--shimmer-1) 25%, var(--shimmer-2) 50%, var(--shimmer-1) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2.5s infinite linear",
        }}
      >
        {/* Faux y-axis lines */}
        {[0.2, 0.45, 0.7, 0.9].map((pct, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-white/[0.03]"
            style={{ top: `${pct * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
