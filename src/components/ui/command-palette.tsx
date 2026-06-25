"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTradeStore } from "@/stores";
import { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, LayoutDashboard, BookOpen, BarChart2, Zap, Bot } from "lucide-react";

type CommandItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  shortcut?: string;
  section: "Navigate" | "Quick Actions" | "Trades";
  action: () => void;
};

function formatTradeResult(trade: Trade): string {
  const sign = trade.netPnl >= 0 ? "+" : "";
  return `${trade.direction.toUpperCase()} ${sign}$${Math.abs(trade.netPnl).toFixed(0)}`;
}

function formatTradeDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { trades } = useTradeStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const routeMap: Record<string, string> = {
    "nav-dashboard": "/dashboard",
    "nav-journal": "/journal",
    "nav-analytics": "/analytics",
    "action-new-trade": "/journal/new",
    "action-ai-coach": "/ai-coach",
  };

  const staticDefs = useMemo(() => [
    { id: "nav-dashboard", icon: <LayoutDashboard size={14} />, label: "Dashboard", subtitle: "Command center overview", shortcut: "⌘1", section: "Navigate" as const },
    { id: "nav-journal", icon: <BookOpen size={14} />, label: "Journal", subtitle: "All executions & reviews", shortcut: "⌘2", section: "Navigate" as const },
    { id: "nav-analytics", icon: <BarChart2 size={14} />, label: "Analytics", subtitle: "Deep performance insights", shortcut: "⌘3", section: "Navigate" as const },
    { id: "action-new-trade", icon: <Zap size={14} />, label: "Log New Trade", subtitle: "Record a new execution", shortcut: "⌘N", section: "Quick Actions" as const },
    { id: "action-ai-coach", icon: <Bot size={14} />, label: "Ask AI Coach", subtitle: "Get personalized coaching", shortcut: "⌘A", section: "Quick Actions" as const },
  ], []);

  const allItems: CommandItem[] = useMemo(() => {
    const q = query.toLowerCase().trim();

    const statics: CommandItem[] = staticDefs
      .filter(item => !q || item.label.toLowerCase().includes(q) || (item.subtitle?.toLowerCase().includes(q) ?? false))
      .map(item => ({
        ...item,
        action: () => { router.push(routeMap[item.id] ?? "/dashboard"); onClose(); },
      }));

    const filtered = q
      ? trades.filter(t =>
          t.symbol.toLowerCase().includes(q) ||
          t.direction.toLowerCase().includes(q) ||
          formatTradeDate(t.entryDate).toLowerCase().includes(q)
        )
      : trades.slice(0, 5);

    const tradeItems: CommandItem[] = filtered.slice(0, 8).map(t => ({
      id: `trade-${t.id}`,
      icon: (
        <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-md", t.direction === "long" ? "bg-accent-green/15 text-accent-green" : "bg-accent-coral/15 text-accent-coral")}>
          {t.direction.toUpperCase()}
        </span>
      ),
      label: `${t.symbol}  ${formatTradeResult(t)}`,
      subtitle: formatTradeDate(t.entryDate),
      section: "Trades" as const,
      action: () => { router.push("/journal"); onClose(); },
    }));

    return [...statics, ...tradeItems];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, staticDefs, trades]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); allItems[activeIndex]?.action(); }
    else if (e.key === "Escape") { onClose(); }
  }, [allItems, activeIndex, onClose]);

  const sections = useMemo(() => {
    const order: CommandItem["section"][] = ["Navigate", "Quick Actions", "Trades"];
    const map = new Map<CommandItem["section"], CommandItem[]>();
    for (const item of allItems) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    }
    return order.filter(s => map.has(s)).map(s => ({ section: s, items: map.get(s)! }));
  }, [allItems]);

  let flatIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="cmd-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div key="cmd-card" initial={{ opacity: 0, scale: 0.96, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9001] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <div className="w-full max-w-xl rounded-2xl overflow-hidden pointer-events-auto"
              style={{ background: "rgba(8,12,26,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(91,63,232,0.12)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)" }}>

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Search size={15} className="text-text-muted flex-shrink-0" />
                <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Search trades, symbols, commands..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                <kbd className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}>
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2">
                {allItems.length === 0 ? (
                  <div className="py-10 text-center text-text-muted text-xs">No results for &ldquo;{query}&rdquo;</div>
                ) : (
                  sections.map(({ section, items }) => (
                    <div key={section}>
                      <div className="px-4 pt-3 pb-1 text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                        {section.toUpperCase()}
                      </div>
                      {items.map(item => {
                        flatIdx += 1;
                        const idx = flatIdx;
                        const isActive = idx === activeIndex;
                        return (
                          <motion.button key={item.id} data-idx={idx} onClick={item.action} onMouseEnter={() => setActiveIndex(idx)} whileTap={{ scale: 0.985 }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-100 text-left"
                            style={{ background: isActive ? "rgba(91,63,232,0.14)" : "transparent", borderLeft: isActive ? "2px solid rgba(91,63,232,0.7)" : "2px solid transparent" }}>
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{ background: isActive ? "rgba(91,63,232,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: isActive ? "var(--accent-violet)" : "var(--text-muted)" }}>
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className={cn("text-xs font-bold truncate transition-colors", isActive ? "text-text-primary" : "text-text-secondary")}>{item.label}</div>
                              {item.subtitle && <div className="text-[10px] text-text-muted truncate mt-0.5">{item.subtitle}</div>}
                            </div>
                            {item.shortcut ? (
                              <kbd className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: isActive ? "var(--accent-violet)" : "var(--text-muted)" }}>
                                {item.shortcut}
                              </kbd>
                            ) : (
                              <ChevronRight size={12} className={cn("flex-shrink-0 transition-all duration-100", isActive ? "text-accent-violet translate-x-0.5" : "text-text-muted/30")} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {[["↑↓", "navigate"], ["↵", "select"], ["esc", "close"]].map(([key, label]) => (
                  <span key={key} className="text-[9px] text-text-muted flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CommandPaletteToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(prev => !prev); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-text-primary transition-all duration-150"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Search size={11} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="text-[8px] font-black">⌘K</kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
