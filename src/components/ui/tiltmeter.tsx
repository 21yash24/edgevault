import { motion } from "framer-motion";
import { useMemo } from "react";
import { GlassCard } from "./glass-card";
import { Activity, Flame, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function TiltmeterWidget({ recentLosses, avgHoldTimeDeviation, volumeSpike }: { recentLosses: number, avgHoldTimeDeviation: number, volumeSpike: boolean }) {
  // Calculate a fake "Tilt Score" (0-100) based on inputs
  const tiltScore = useMemo(() => {
    let score = 0;
    score += Math.min(recentLosses * 15, 50); // Up to 50 from losses
    score += Math.min(avgHoldTimeDeviation * 20, 30); // Up to 30 from holding too short/long
    if (volumeSpike) score += 20; // 20 from sudden size increase
    return Math.min(score, 100);
  }, [recentLosses, avgHoldTimeDeviation, volumeSpike]);

  const getTiltStatus = () => {
    if (tiltScore < 30) return { label: "Optimal", color: "text-accent-green", bg: "bg-accent-green" };
    if (tiltScore < 70) return { label: "Caution", color: "text-yellow-500", bg: "bg-yellow-500" };
    return { label: "Tilted", color: "text-accent-coral", bg: "bg-accent-coral" };
  };

  const status = getTiltStatus();

  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-inter)] font-bold text-base flex items-center gap-2">
          <Activity size={16} className={status.color} />
          Tiltmeter
        </h2>
        <span className={cn("text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-border-subtle", status.color, `bg-${status.color}/10`)}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-32 h-16 overflow-hidden flex items-end justify-center mb-2">
          {/* Gauge Background */}
          <div className="w-full h-full border-t-8 border-l-8 border-r-8 border-bg-card rounded-t-full absolute top-0" />
          
          {/* Gauge Fill */}
          <motion.div 
            className={cn("w-full h-full border-t-8 border-l-8 border-r-8 rounded-t-full absolute top-0 origin-bottom shadow-[0_0_15px_rgba(var(--color-accent-coral),0.5)]")}
            style={{ borderColor: status.color === "text-accent-green" ? "var(--color-accent-green)" : status.color === "text-yellow-500" ? "#eab308" : "var(--color-accent-coral)" }}
            initial={{ rotate: -90 }}
            animate={{ rotate: -90 + (tiltScore / 100) * 180 }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
          
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-2xl z-10">
            {tiltScore}<span className="text-[10px] text-text-muted">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="glass-static p-2 rounded-lg flex items-center gap-2">
          <Flame size={12} className={recentLosses > 2 ? "text-accent-coral" : "text-text-muted"} />
          <div>
            <div className="text-[9px] text-text-muted uppercase">Recent Losses</div>
            <div className="text-xs font-bold">{recentLosses}</div>
          </div>
        </div>
        <div className="glass-static p-2 rounded-lg flex items-center gap-2">
          <Zap size={12} className={volumeSpike ? "text-yellow-500" : "text-text-muted"} />
          <div>
            <div className="text-[9px] text-text-muted uppercase">Vol. Spike</div>
            <div className="text-xs font-bold">{volumeSpike ? "Yes" : "No"}</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
