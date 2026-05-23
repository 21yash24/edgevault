"use client";
import { Bell, Search, Plus, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <header className="h-16 border-b border-border-subtle/50 bg-bg-base/60 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-green transition-colors" />
          <input
            type="text"
            placeholder="Search trades, symbols..."
            className="w-full glass bg-transparent border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green focus:shadow-[0_0_20px_rgba(0,255,178,0.15)] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded border border-border-subtle backdrop-blur-md">⌘K</kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/journal/new"
          className="flex items-center gap-2 bg-accent-green/10 hover:bg-accent-green/20 text-accent-green px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-[0_0_15px_rgba(0,255,178,0.1)] hover:shadow-[0_0_30px_rgba(0,255,178,0.25)] border border-accent-green/20"
        >
          <Plus size={16} />
          <span className="hidden sm:inline font-bold tracking-wide">LOG TRADE</span>
        </Link>

        {mounted && (
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl glass hover:border-accent-violet hover:shadow-[0_0_15px_rgba(123,97,255,0.2)] text-text-secondary hover:text-text-primary transition-all"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl glass hover:border-accent-coral hover:shadow-[0_0_15px_rgba(255,45,85,0.2)] text-text-secondary hover:text-text-primary transition-all">
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-coral rounded-full flex items-center justify-center text-[9px] font-bold text-white">3</span>
        </button>

        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-green to-accent-violet flex items-center justify-center text-sm font-bold cursor-pointer">
          Y
        </div>
      </div>
    </header>
  );
}
