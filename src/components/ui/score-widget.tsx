import { motion } from "framer-motion";
import { GlassCard } from "./glass-card";
import { Trophy, TrendingUp, Target, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreWidgetProps {
  score: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
}

export function ScoreWidget({ score, winRate, profitFactor, maxDrawdown }: ScoreWidgetProps) {
  // Determine Grade
  let grade = "F";
  let gradeColor = "text-accent-coral";
  let description = "Needs immediate review of risk management.";
  
  if (score >= 90) { grade = "A+"; gradeColor = "text-accent-green"; description = "Elite performance. Keep your edge sharp."; }
  else if (score >= 80) { grade = "A"; gradeColor = "text-accent-green"; description = "Excellent execution and consistency."; }
  else if (score >= 70) { grade = "B"; gradeColor = "text-accent-violet"; description = "Good performance, minor leaks to plug."; }
  else if (score >= 60) { grade = "C"; gradeColor = "text-accent-blue"; description = "Average. Focus on cutting losers quicker."; }
  else if (score >= 50) { grade = "D"; gradeColor = "text-accent-coral"; description = "Below average. Risk parameters might be too loose."; }

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <GlassCard className="p-6 relative overflow-hidden group flex flex-col justify-between border border-border-subtle hover:border-accent-violet/30 transition-all col-span-1 sm:col-span-2 lg:col-span-1 min-h-[320px]">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between z-10">
        <h3 className="text-sm font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-accent-violet" />
          EdgeVault Score
        </h3>
        <div className="text-[10px] font-black uppercase tracking-widest bg-bg-secondary px-2 py-1 rounded text-text-muted">
          Last 30 Days
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 my-4 relative z-10">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="72" cy="72" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-bg-secondary/50 dark:text-white/[0.02]" />
            {/* Progress Circle */}
            <circle
              cx="72"
              cy="72"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn("transition-all duration-1500 ease-out", gradeColor)}
              style={{ filter: `drop-shadow(0 0 8px currentColor)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-black tracking-tighter", gradeColor)}>{score}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Score</span>
          </div>
        </div>
        <div className="text-center mt-2 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className={cn("px-2 py-0.5 rounded text-xs font-black", gradeColor, `bg-current/10`)}>Grade {grade}</span>
          </div>
          <p className="text-xs text-text-secondary max-w-[200px] leading-relaxed mx-auto">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border-subtle/50 pt-4 z-10">
        <div className="text-center">
          <Target size={14} className="mx-auto mb-1 text-accent-blue opacity-70" />
          <div className="text-[10px] text-text-muted font-bold uppercase">Win %</div>
          <div className="text-xs font-black text-text-primary font-[family-name:var(--font-space-mono)]">{winRate}%</div>
        </div>
        <div className="text-center border-l border-r border-border-subtle/50">
          <TrendingUp size={14} className="mx-auto mb-1 text-accent-green opacity-70" />
          <div className="text-[10px] text-text-muted font-bold uppercase">Profit F.</div>
          <div className="text-xs font-black text-text-primary font-[family-name:var(--font-space-mono)]">{profitFactor}</div>
        </div>
        <div className="text-center">
          <ShieldAlert size={14} className="mx-auto mb-1 text-accent-coral opacity-70" />
          <div className="text-[10px] text-text-muted font-bold uppercase">Max DD</div>
          <div className="text-xs font-black text-text-primary font-[family-name:var(--font-space-mono)]">{maxDrawdown}%</div>
        </div>
      </div>
    </GlassCard>
  );
}
