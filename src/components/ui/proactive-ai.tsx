import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";
import { GlassCard } from "./glass-card";
import { useEffect, useState } from "react";

const insights = [
  {
    type: "warning",
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    message: "You are on a 3-trade losing streak. Consider taking a 15-minute break to avoid emotional tilt.",
  },
  {
    type: "danger",
    icon: TrendingDown,
    color: "text-accent-coral",
    bg: "bg-accent-coral/10",
    message: "Your win rate on Fridays after 2 PM is historically 22%. You have a live trade open. Manage risk strictly.",
  },
  {
    type: "insight",
    icon: Lightbulb,
    color: "text-accent-violet",
    bg: "bg-accent-violet/10",
    message: "Holding your winning 'Long NQ' trades 10% longer would have increased your P&L by $1,250 this month.",
  }
];

export function ProactiveAIWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cycle through insights for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const currentInsight = insights[currentIndex];
  const Icon = currentInsight.icon;

  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-sm flex items-center gap-2 text-accent-violet">
          <Sparkles size={14} className="animate-pulse" />
          Edge AI Insights
        </h2>
        <div className="flex gap-1">
          {insights.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? 'bg-accent-violet' : 'bg-border-subtle'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3 p-3 rounded-xl glass-static"
        >
          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${currentInsight.bg}`}>
            <Icon size={16} className={currentInsight.color} />
          </div>
          <p className="text-xs text-text-primary leading-relaxed">
            {currentInsight.message}
          </p>
        </motion.div>
      </AnimatePresence>
      
      <button className="w-full mt-3 text-[10px] text-text-muted hover:text-accent-violet uppercase tracking-widest font-bold transition-colors">
        Ask AI specific question →
      </button>
    </GlassCard>
  );
}
