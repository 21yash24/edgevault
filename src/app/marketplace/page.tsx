"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Store, Sparkles, Star, Tag, Import, ArrowUpDown, Check, 
  Search, ShieldCheck, DollarSign, Eye, ShoppingCart, SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlaybookStore } from "@/stores";

interface StrategyPlaybook {
  id: string;
  name: string;
  creator: string;
  avatarColor: string;
  rating: number;
  reviewsCount: number;
  winRate: number;
  profitFactor: number;
  price: number; // 0 for free
  tags: string[];
  description: string;
  isVerified: boolean;
}

const mockStrategies: StrategyPlaybook[] = [
  {
    id: "str-1",
    name: "ICT Silver Bullet Futures Masterclass",
    creator: "ViperTrades",
    avatarColor: "bg-accent-violet",
    rating: 4.92,
    reviewsCount: 148,
    winRate: 68.5,
    profitFactor: 3.24,
    price: 79,
    tags: ["Futures", "ICT", "NY AM", "FVG"],
    description: "The complete systematic guide to trading the daily 10 AM - 11 AM NY Silver Bullet liquidity sweeps on NQ and ES. Includes full confirmation checklist.",
    isVerified: true
  },
  {
    id: "str-2",
    name: "London Open Liquidity Raid",
    creator: "MacroAlchemist",
    avatarColor: "bg-accent-green",
    rating: 4.85,
    reviewsCount: 92,
    winRate: 64.2,
    profitFactor: 2.85,
    price: 49,
    tags: ["Forex", "Liquidity", "London", "EURUSD"],
    description: "Capture explosive expansion moves during the London session open. Designed specifically for EURUSD and GBPUSD pairs with strict 1:2 R:R limits.",
    isVerified: true
  },
  {
    id: "str-3",
    name: "SMT Divergence & Breaker Block Confluence",
    creator: "OrderFlowPro",
    avatarColor: "bg-accent-blue",
    rating: 4.96,
    reviewsCount: 204,
    winRate: 71.0,
    profitFactor: 3.52,
    price: 119,
    tags: ["Crypto", "SMT", "Breaker Block", "BTCUSD"],
    description: "Detect institutional manipulation in real-time. This strategy connects relative strength divergence across correlated assets to capture high R-multiple reversals.",
    isVerified: true
  },
  {
    id: "str-4",
    name: "Opening Range Breakout (ORB) System",
    creator: "DeltaTrader",
    avatarColor: "bg-yellow-500",
    rating: 4.68,
    reviewsCount: 115,
    winRate: 59.8,
    profitFactor: 2.10,
    price: 0, // Free
    tags: ["Stocks", "ORB", "NY Open", "SPY"],
    description: "A mechanical, high-probability execution model trading the initial 15-minute range breakout on highly liquid US Equities. Simple and repeatable.",
    isVerified: false
  },
  {
    id: "str-5",
    name: "HTF Liquidity Sweep & Displacement",
    creator: "EliteFunded",
    avatarColor: "bg-accent-coral",
    rating: 4.88,
    reviewsCount: 76,
    winRate: 66.0,
    profitFactor: 3.12,
    price: 89,
    tags: ["Futures", "Sweep", "Displacement", "NQ"],
    description: "High timeframe directional bias execution strategy. Perfect for passing prop firm evaluations where maximum drawdown protection is critical.",
    isVerified: true
  },
  {
    id: "str-6",
    name: "Asian Session Consolidation Fade",
    creator: "NightScalper",
    avatarColor: "bg-pink-500",
    rating: 4.54,
    reviewsCount: 63,
    winRate: 58.4,
    profitFactor: 1.95,
    price: 29,
    tags: ["Forex", "Range", "Asian", "AUDUSD"],
    description: "Exploit quiet ranges. Sell the extremes and buy the support during late Asian session range bounds. Low volatility, highly consistent.",
    isVerified: false
  },
  {
    id: "str-7",
    name: "Institutional Order Block Pullbacks",
    creator: "ICT_Disciple",
    avatarColor: "bg-indigo-500",
    rating: 4.79,
    reviewsCount: 108,
    winRate: 63.8,
    profitFactor: 2.64,
    price: 0, // Free
    tags: ["Forex", "Order Block", "London", "GBPUSD"],
    description: "Identify key mitigation blocks where institutional liquidity rested. Buy or sell deep pullbacks with tightly defined, high-leverage stop-losses.",
    isVerified: false
  },
  {
    id: "str-8",
    name: "Micro-Scalping Momentum Engine",
    creator: "TurboTick",
    avatarColor: "bg-teal-500",
    rating: 4.62,
    reviewsCount: 84,
    winRate: 57.2,
    profitFactor: 2.05,
    price: 39,
    tags: ["Futures", "Scalping", "Momentum", "MES"],
    description: "Designed for micro futures (MES/MNQ) traders. Captures 5-15 point quick momentum swings using dynamic VWAP and volume delta indicators.",
    isVerified: false
  }
];

export default function MarketplacePage() {
  const { addPlaybook } = usePlaybookStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "futures" | "forex" | "crypto" | "premium" | "free">("all");
  const [sortOption, setSortOption] = useState<"rating" | "winRate" | "reviews" | "price-asc" | "price-desc">("rating");
  const [importedId, setImportedId] = useState<string | null>(null);

  const handleImportPlaybook = (strategy: StrategyPlaybook) => {
    // Add to local playbook store
    addPlaybook({
      name: strategy.name,
      description: strategy.description,
      entryRules: [
        `Confirm ${strategy.tags.join(" and ")} context`,
        `Confirm win expectancy at ${strategy.winRate}%`
      ],
      exitRules: [
        `Target profit factor of ${strategy.profitFactor}`
      ],
      idealConditions: ["Trending", "News-driven"],
      targetRR: 2,
      maxRiskPercent: 1,
      bestSessions: ["NY AM", "London"],
      linkedTradeIds: []
    });

    setImportedId(strategy.id);
    setTimeout(() => {
      setImportedId(null);
    }, 2500);
  };

  const filteredAndSortedStrategies = useMemo(() => {
    return mockStrategies
      .filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!matchesSearch) return false;

        if (activeFilter === "futures") return s.tags.includes("Futures");
        if (activeFilter === "forex") return s.tags.includes("Forex");
        if (activeFilter === "crypto") return s.tags.includes("Crypto");
        if (activeFilter === "premium") return s.price > 0;
        if (activeFilter === "free") return s.price === 0;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "rating") return b.rating - a.rating;
        if (sortOption === "winRate") return b.winRate - a.winRate;
        if (sortOption === "reviews") return b.reviewsCount - a.reviewsCount;
        if (sortOption === "price-asc") return a.price - b.price;
        if (sortOption === "price-desc") return b.price - a.price;
        return 0;
      });
  }, [searchTerm, activeFilter, sortOption]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle/50 bg-gradient-to-r from-bg-card via-accent-violet/5 to-accent-blue/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold text-accent-violet bg-accent-violet/10 border border-accent-violet/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Strategy Marketplace
            </span>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl text-text-primary mt-2 flex items-center gap-2">
              Playbook Store <Store size={28} className="text-accent-violet" />
            </h1>
            <p className="text-sm text-text-muted mt-2 max-w-2xl">
              Equip your trading arsenal with battle-tested strategies from verified edge creators. Download free scripts or purchase premium execution models to import directly into your Playbook module.
            </p>
          </div>

          <GlassCard className="p-4 border-accent-violet/20 flex flex-col items-center justify-center text-center flex-shrink-0 md:w-48">
            <Sparkles size={20} className="text-accent-violet animate-pulse mb-1" />
            <span className="text-[10px] text-text-muted uppercase font-bold">Import Expectancy</span>
            <span className="text-sm font-semibold text-text-primary mt-1">Instant Playbook Integration</span>
          </GlassCard>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-bg-card/20 p-4 rounded-xl border border-border-subtle/50">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search playbooks, creators, tags (ICT, Scalping, EURUSD...)"
            className="w-full bg-white/[0.02] border border-border-subtle hover:border-border-subtle/80 focus:border-accent-violet/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-violet/30 transition-all"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "All" },
              { id: "futures", label: "Futures" },
              { id: "forex", label: "Forex" },
              { id: "crypto", label: "Crypto" },
              { id: "free", label: "Free" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95",
                  activeFilter === f.id
                    ? "bg-accent-violet/10 text-accent-violet border-accent-violet/30"
                    : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.03]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Select */}
          <div className="relative flex items-center gap-2 bg-white/[0.02] border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-all">
            <ArrowUpDown size={12} className="text-text-muted" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="rating">Top Rated</option>
              <option value="winRate">Highest Win Rate</option>
              <option value="reviews">Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

        </div>

      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredAndSortedStrategies.map((strategy) => {
            const isImported = importedId === strategy.id;
            const isFree = strategy.price === 0;

            return (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="h-full flex flex-col justify-between border-border-subtle/80 hover:border-accent-violet/30 hover:shadow-[0_0_20px_rgba(123,97,255,0.05)] transition-all duration-300 relative overflow-hidden group">
                  
                  {/* Decorative Gradient Background overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/[0.02] rounded-full blur-2xl pointer-events-none group-hover:bg-accent-violet/[0.05] transition-all duration-300" />
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    
                    {/* Card Header (Creator & Price) */}
                    <div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0", strategy.avatarColor)}>
                            {strategy.creator[0]}
                          </div>
                          <span className="text-[11px] font-semibold text-text-muted truncate">@{strategy.creator}</span>
                          {strategy.isVerified && (
                            <ShieldCheck size={12} className="text-accent-violet flex-shrink-0" />
                          )}
                        </div>

                        <span className={cn(
                          "text-xs font-bold font-[family-name:var(--font-space-mono)] px-2 py-0.5 rounded-md border",
                          isFree 
                            ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                            : "bg-accent-violet/10 text-accent-violet border-accent-violet/20"
                        )}>
                          {isFree ? "FREE" : `$${strategy.price}`}
                        </span>
                      </div>

                      {/* Strategy Title */}
                      <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary mt-3 line-clamp-2 min-h-[40px] group-hover:text-accent-violet transition-colors">
                        {strategy.name}
                      </h3>

                      {/* Ratings */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex gap-0.5 text-yellow-500">
                          <Star size={10} className="fill-yellow-500" />
                          <Star size={10} className="fill-yellow-500" />
                          <Star size={10} className="fill-yellow-500" />
                          <Star size={10} className="fill-yellow-500" />
                          <Star size={10} className="fill-yellow-500" />
                        </div>
                        <span className="text-[10px] font-bold text-text-primary ml-1">{strategy.rating.toFixed(2)}</span>
                        <span className="text-[9px] text-text-muted">({strategy.reviewsCount})</span>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-text-muted mt-3 line-clamp-3 leading-relaxed">
                        {strategy.description}
                      </p>
                    </div>

                    {/* Stats Box */}
                    <div className="grid grid-cols-2 gap-3 mt-4 bg-white/[0.01] border border-border-subtle/50 p-2.5 rounded-lg text-center">
                      <div>
                        <span className="text-[8px] text-text-muted uppercase font-bold block">Win Rate</span>
                        <span className="text-xs font-bold text-accent-green font-[family-name:var(--font-space-mono)] mt-0.5 block">
                          {strategy.winRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-muted uppercase font-bold block">Profit Factor</span>
                        <span className="text-xs font-bold text-text-secondary font-[family-name:var(--font-space-mono)] mt-0.5 block">
                          {strategy.profitFactor.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-4">
                      {strategy.tags.map((tag) => (
                        <span key={tag} className="text-[8px] font-semibold bg-white/[0.04] text-text-secondary border border-border-subtle/40 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Buy / Import Playbook Button */}
                  <div className="p-4 border-t border-border-subtle/30 bg-bg-card/10 flex items-center justify-between gap-3">
                    
                    <button 
                      className="flex items-center justify-center gap-1.5 w-1/3 py-2 bg-white/[0.01] hover:bg-white/[0.03] active:bg-white/[0.05] border border-border-subtle rounded-xl text-[10px] font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95"
                      title="Inspect Playbook details"
                    >
                      <Eye size={12} /> View
                    </button>

                    <button
                      onClick={() => handleImportPlaybook(strategy)}
                      disabled={isImported}
                      className={cn(
                        "flex items-center justify-center gap-1.5 w-2/3 py-2 rounded-xl text-[10px] font-bold shadow-lg transition-all active:scale-95",
                        isImported
                          ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                          : isFree
                            ? "bg-gradient-to-r from-accent-green/80 to-accent-blue/80 hover:from-accent-green hover:to-accent-blue text-white hover:shadow-[0_0_15px_rgba(0,255,178,0.3)]"
                            : "bg-gradient-to-r from-accent-violet to-accent-blue text-white hover:shadow-[0_0_15px_rgba(123,97,255,0.4)]"
                      )}
                    >
                      {isImported ? (
                        <>
                          <Check size={12} /> Imported
                        </>
                      ) : (
                        <>
                          <Import size={12} /> {isFree ? "Import Free" : `Buy $${strategy.price}`}
                        </>
                      )}
                    </button>

                  </div>

                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAndSortedStrategies.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <Tag size={32} className="mx-auto opacity-15 mb-3" />
          <p className="text-sm font-semibold">No strategies found</p>
          <p className="text-xs mt-1">Try refining your search text or filters.</p>
        </div>
      )}

    </div>
  );
}
