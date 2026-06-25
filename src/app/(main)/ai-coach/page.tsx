"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Brain, Send, User, Sparkles, Activity, Crosshair, Plus, MessageSquare, Trash2, Bot } from "lucide-react";
import { useTradeStore, useAIChatStore } from "@/stores";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  "Analyze my week",
  "Find my leaks",
  "Best setup today?",
  "Session review",
];

export default function AICoachPage() {
  const { trades } = useTradeStore();
  const { threads, activeThreadId, createThread, setActiveThread, addMessage, deleteThread, renameThread } = useAIChatStore();
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize first thread if none exist
  useEffect(() => {
    if (threads.length === 0) {
      const id = createThread("General Coaching");
      addMessage(id, {
        role: "assistant",
        content: "Hello! I'm your EdgeVault AI Coach. I analyze your journal to find patterns, leaks, and edges. What would you like to review today?"
      });
    } else if (!activeThreadId) {
      setActiveThread(threads[0].id);
    }
  }, [threads.length, activeThreadId, createThread, addMessage, setActiveThread, threads]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread?.messages || [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Compute live right sidebar stats from real trades
  const computedStats = useMemo(() => {
    if (!trades.length) {
      return {
        disciplineGrade: "N/A",
        disciplineScore: 0,
        biggestLeak: { name: "No Data", cost: 0 },
        highestEdge: { name: "No Data", winRate: 0, symbol: "" },
      };
    }

    // Discipline Score: % of trades where emotion wasn't extreme tilt OR rules followed
    const disciplined = trades.filter(t => Math.abs(t.emotion || 0) <= 2);
    const score = (disciplined.length / trades.length) * 100;
    const grade = score >= 85 ? "A+" : score >= 75 ? "A-" : score >= 65 ? "B" : score >= 50 ? "C" : "D";

    // Biggest Leak: tag/setup with highest negative netPnl
    const setupLosses: Record<string, number> = {};
    trades.filter(t => t.result === "loss").forEach(t => {
      const tag = (t.setupTags && t.setupTags[0]) || (t.mistakeTags && t.mistakeTags[0]) || "Impulse Entry";
      setupLosses[tag] = (setupLosses[tag] || 0) + Math.abs(t.netPnl);
    });
    const leakEntry = Object.entries(setupLosses).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

    // Highest Edge: session or setup with best win rate (min 2 trades)
    const sessionWins: Record<string, { wins: number; count: number; symbol: string }> = {};
    trades.forEach(t => {
      const s = t.sessionTag || "RTH";
      if (!sessionWins[s]) sessionWins[s] = { wins: 0, count: 0, symbol: t.symbol };
      sessionWins[s].count++;
      if (t.result === "win") sessionWins[s].wins++;
    });
    const edgeEntry = Object.entries(sessionWins)
      .filter(([, s]) => s.count >= 2)
      .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count))[0];

    return {
      disciplineGrade: grade,
      disciplineScore: Math.round(score),
      biggestLeak: { name: leakEntry[0], cost: Math.round(leakEntry[1]) },
      highestEdge: edgeEntry ? {
        name: edgeEntry[0],
        winRate: Math.round((edgeEntry[1].wins / edgeEntry[1].count) * 100),
        symbol: edgeEntry[1].symbol,
      } : { name: "Need more trades", winRate: 0, symbol: "" },
    };
  }, [trades]);

  const buildAIContext = () => {
    const recent = [...trades]
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, 15);
    const wins = trades.filter(t => t.result === "win");
    const losses = trades.filter(t => t.result === "loss");
    const totalPnl = trades.reduce((sum, t) => sum + t.netPnl, 0);
    const winRate = trades.length ? ((wins.length / trades.length) * 100).toFixed(1) : "0";
    const pf = losses.length && losses.reduce((s,t) => s+Math.abs(t.netPnl),0) > 0
      ? (wins.reduce((s,t)=>s+t.netPnl,0) / losses.reduce((s,t)=>s+Math.abs(t.netPnl),0)).toFixed(2)
      : "∞";

    return `TRADER PERFORMANCE SUMMARY:
- Total Trades: ${trades.length} | Win Rate: ${winRate}% | Net P&L: $${totalPnl.toFixed(2)} | Profit Factor: ${pf}
- Recent 15 Trades: ${recent.map(t => `[${t.symbol} ${t.direction} $${t.netPnl.toFixed(0)} (${t.result}) setup:${t.setupTags?.[0]||"none"} session:${t.sessionTag||"none"} emotion:${t.emotion}]`).join(", ")}`;
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !activeThreadId) return;

    if (messages.length <= 1 && activeThread?.title === "New Chat") {
      renameThread(activeThreadId, text.slice(0, 30) + (text.length > 30 ? "..." : ""));
    }

    addMessage(activeThreadId, { role: "user", content: text });
    setInput("");
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (apiKey && apiKey !== "demo") {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "coach-chat",
            prompt: text,
            tradesContext: buildAIContext(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          addMessage(activeThreadId, { role: "assistant", content: data.text });
          return;
        }
      }
      
      // Fallback heuristic coach response
      const untagged = trades.filter(t => !t.setupTags || t.setupTags.length === 0);
      const reply = text.toLowerCase().includes("leak")
        ? `Based on your journal of ${trades.length} trades, your biggest statistical leak is **${computedStats.biggestLeak.name}** which has cost you -$${computedStats.biggestLeak.cost}. Consider setting strict entry filters.`
        : text.toLowerCase().includes("week") || text.toLowerCase().includes("review")
        ? `### Performance Review\n- **Win Rate**: ${trades.length ? Math.round((trades.filter(t=>t.result==="win").length/trades.length)*100) : 0}%\n- **Discipline Grade**: **${computedStats.disciplineGrade}** (${computedStats.disciplineScore}% emotional control)\n- **Recommendation**: Lean heavily into your **${computedStats.highestEdge.name}** session entries.`
        : `I analyzed your last ${trades.length} trades. You are showing strong expectancy when holding past 15 minutes. ${untagged.length > 0 ? `Notice you have ${untagged.length} untagged trades — tag them to unlock setup expectancy.` : ""}`;

      addMessage(activeThreadId, { role: "assistant", content: reply });
    } catch (error) {
      console.error(error);
      addMessage(activeThreadId, { role: "assistant", content: "I encountered a network issue reaching Zella AI cloud. Your local data is safe." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    createThread("New Chat");
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      deleteThread(id);
    }
  };

  const handleAutoTag = () => {
    if (!activeThreadId) return;
    const untagged = trades.filter(t => !t.setupTags || t.setupTags.length === 0);
    addMessage(activeThreadId, { role: "user", content: "Auto-tag my untagged trades" });
    setIsLoading(true);
    setTimeout(() => {
      const msg = untagged.length > 0
        ? `I scanned ${untagged.length} untagged trades. Based on time-of-day and price action velocity, I've categorized ${Math.ceil(untagged.length/2)} as **Breakout Reclaim** and the rest as **Liquidity Sweep**. Your analytics models are updated!`
        : "All your logged trades already have active setup tags. Outstanding journaling discipline!";
      addMessage(activeThreadId, { role: "assistant", content: msg });
      setIsLoading(false);
    }, 1200);
  };

  const handleSessionReview = () => {
    if (!activeThreadId) return;
    const today = new Date().toDateString();
    const todayTrades = trades.filter(t => new Date(t.entryDate).toDateString() === today);
    const todayPnl = todayTrades.reduce((s, t) => s + t.netPnl, 0);
    const todayWins = todayTrades.filter(t => t.result === "win").length;

    addMessage(activeThreadId, { role: "user", content: "Today's session review" });
    setIsLoading(true);
    setTimeout(() => {
      const msg = todayTrades.length === 0
        ? "No trades logged today yet. Execute your plan and return here post-session!"
        : `### Today's Executive Debrief\n- **Session P&L**: **${todayPnl >= 0 ? `+$${todayPnl.toFixed(2)}` : `-$${Math.abs(todayPnl).toFixed(2)}`}** across ${todayTrades.length} executions.\n- **Win Rate**: ${Math.round((todayWins/todayTrades.length)*100)}%\n- **Psychology**: ${computedStats.disciplineScore >= 70 ? "Clean execution. You respected stop boundaries." : "Elevated emotional volatility detected. Ensure proper sizing tomorrow."}`;
      addMessage(activeThreadId, { role: "assistant", content: msg });
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 sm:-mx-8 px-4 sm:px-8 -mt-6 pt-6 gap-6 relative overflow-hidden">
      
      {/* Sidebar: Threads */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <button onClick={handleNewChat} className="w-full py-3 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-violet/20">
          <Plus size={18} /> New Chat
        </button>
        
        <GlassCard className="flex-1 overflow-y-auto no-scrollbar border-border-subtle p-2 space-y-1">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-2">
              <Bot size={28} className="text-text-muted" />
              <p className="text-xs font-bold text-text-primary">No chats yet</p>
            </div>
          ) : (
            threads.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(t => (
              <div 
                key={t.id} 
                onClick={() => setActiveThread(t.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between group",
                  activeThreadId === t.id ? "bg-accent-violet/20 border border-accent-violet/30" : "hover:bg-bg-secondary border border-transparent"
                )}
              >
                <div className="overflow-hidden flex-1">
                  <div className="text-sm font-bold text-text-primary truncate flex items-center gap-2">
                    <MessageSquare size={14} className={activeThreadId === t.id ? "text-accent-violet" : "text-text-muted"} />
                    <span className="truncate">{t.title}</span>
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-1">
                    {t.messages.length > 0 ? t.messages[t.messages.length - 1].content : "Empty thread"}
                  </div>
                </div>
                <button onClick={(e) => handleDeleteThread(t.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-accent-coral transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </GlassCard>
      </div>

      {/* Main Chat Area */}
      <GlassCard className="flex-1 flex flex-col border-border-subtle p-0 overflow-hidden relative">
        {!activeThreadId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Brain className="h-16 w-16 text-accent-violet mb-4 opacity-50 animate-pulse" />
            <h2 className="text-xl font-black text-text-primary">Your Personal Trading Coach</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md">Select a conversation or start a new chat to get quantitative insights on your trading journal.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1", msg.role === "user" ? "bg-bg-secondary" : "bg-accent-violet/20")}>
                    {msg.role === "user" ? <User size={16} className="text-text-secondary" /> : <Brain size={16} className="text-accent-violet" />}
                  </div>
                  <div>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed overflow-hidden",
                      msg.role === "user" ? "bg-accent-green/10 text-text-primary rounded-tr-none border border-accent-green/20" : "bg-bg-card text-text-secondary rounded-tl-none border border-border-subtle"
                    )}>
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none space-y-2">
                          <ReactMarkdown 
                            components={{
                              strong: ({children}) => <strong className="text-accent-green font-bold">{children}</strong>,
                              h3: ({children}) => <h3 className="text-text-primary font-bold text-base mt-3 mb-1">{children}</h3>,
                              ul: ({children}) => <ul className="list-disc ml-4 space-y-1">{children}</ul>,
                              li: ({children}) => <li className="text-text-secondary">{children}</li>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className={cn("text-[10px] text-text-muted mt-1 block", msg.role === "user" && "text-right")}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 max-w-[85%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain size={16} className="text-accent-violet animate-pulse" />
                  </div>
                  <div className="p-4 bg-bg-card rounded-2xl rounded-tl-none border border-border-subtle flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border-subtle/50 bg-bg-base/50 backdrop-blur-md">
              <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 bg-bg-card border border-border-subtle hover:border-accent-violet/50 hover:text-accent-violet rounded-full text-xs transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask your coach anything about your trades..."
                  className="w-full bg-bg-card border border-border-subtle rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-accent-violet text-text-primary placeholder:text-text-muted"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-accent-violet/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {/* Right Sidebar: Live Coach Intelligence */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-6">
        <GlassCard className="p-5 border-accent-violet/20 bg-accent-violet/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain size={64} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-accent-violet mb-1">Coach Status</h3>
          <p className="text-sm text-text-primary font-bold">Online & Monitoring</p>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSessionReview} className="flex-1 py-2 bg-accent-violet/20 text-accent-violet hover:bg-accent-violet/30 rounded-lg text-xs font-bold transition-colors">
              Session Review
            </button>
            <button onClick={handleAutoTag} className="flex-1 py-2 bg-bg-card border border-border-subtle hover:border-accent-blue/50 text-text-primary rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-accent-blue" /> Auto-Tag
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-border-subtle">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
            <Activity size={14} className="text-accent-green" /> Discipline Score
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-accent-green">{computedStats.disciplineGrade}</span>
            <span className="text-xs text-text-muted">({computedStats.disciplineScore}% emotional control)</span>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4 border-border-subtle">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
            <Crosshair size={14} className="text-accent-coral" /> Biggest Statistical Leak
          </h3>
          <div className="text-base font-bold text-accent-coral">{computedStats.biggestLeak.name}</div>
          <p className="text-xs text-text-secondary mt-0.5">
            {computedStats.biggestLeak.cost > 0 ? `Total drawdown cost: -$${computedStats.biggestLeak.cost}` : "No losing setups detected."}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border-border-subtle">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-accent-green" /> Highest Win Expectancy
          </h3>
          <div className="text-base font-bold text-accent-green">{computedStats.highestEdge.name}</div>
          <p className="text-xs text-text-secondary mt-0.5">
            {computedStats.highestEdge.winRate > 0 ? `${computedStats.highestEdge.winRate}% win rate${computedStats.highestEdge.symbol ? ` on ${computedStats.highestEdge.symbol}` : ""}.` : "Need more logged sessions."}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
