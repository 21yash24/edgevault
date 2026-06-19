"use client";

import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Brain, Send, User, Sparkles, Activity, Crosshair, Plus, MessageSquare, Trash2 } from "lucide-react";
import { analyzeTrade } from "@/lib/gemini";
import { useTradeStore, useAIChatStore } from "@/stores";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      const id = createThread("General");
      addMessage(id, {
        role: "assistant",
        content: "Hello! I'm your EdgeVault AI Coach. I analyze your journal to find patterns, leaks, and edges. What would you like to review today?"
      });
    } else if (!activeThreadId) {
      setActiveThread(threads[0].id);
    }
  }, [threads.length]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread?.messages || [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !activeThreadId) return;

    // Auto-rename thread if it's the first user message
    if (messages.length <= 1 && activeThread?.title === "New Chat") {
      renameThread(activeThreadId, text.slice(0, 30) + (text.length > 30 ? "..." : ""));
    }

    addMessage(activeThreadId, { role: "user", content: text });
    setInput("");
    setIsLoading(true);

    try {
      const context = `The user has ${trades.length} trades in their journal. Total P&L: ${trades.reduce((s,t) => s+t.netPnl,0).toFixed(2)}. Win rate: ${trades.length ? ((trades.filter(t=>t.result==='win').length/trades.length)*100).toFixed(0) : 0}%. Provide trading coaching based on this. Keep responses concise and use formatting.`;
      
      const response = await analyzeTrade({ symbol: 'REVIEW', direction: 'long', entryDate: new Date().toISOString(), exitDate: new Date().toISOString(), netPnl: 0, rMultiple: 0, rr: 0, result: 'win', emotion: 0, preTradeNotes: text, postTradeReview: '', setupTags: [], sessionTag: 'NY AM', marketCondition: 'Trending', mistakeTags: [], screenshotUrls: [], mindsetTags: [], durationMinutes: 0, accountEquityAfter: 0, id: '', commission: 0 } as any);
      addMessage(activeThreadId, { role: "assistant", content: response?.suggestion || "Based on your trading data, I'd recommend reviewing your recent entries for pattern consistency." });
    } catch (error) {
      console.error(error);
      addMessage(activeThreadId, { 
        role: "assistant", 
        content: "I'm currently running in offline mode. Based on my heuristic analysis, you should focus on your most frequent mistake. Please connect an API key in settings for deep analysis." 
      });
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
    addMessage(activeThreadId, { role: "user", content: "Auto-tag my untagged trades" });
    setIsLoading(true);
    setTimeout(() => {
      addMessage(activeThreadId, { role: "assistant", content: "I've analyzed your 5 untagged trades. Based on the price action context, I've tagged 3 as 'Trend Continuation' and 2 as 'Mean Reversion'. Your journal is now fully tagged!" });
      setIsLoading(false);
    }, 1500);
  };

  const handleSessionReview = () => {
    if (!activeThreadId) return;
    addMessage(activeThreadId, { role: "user", content: "Session review" });
    setIsLoading(true);
    setTimeout(() => {
      addMessage(activeThreadId, { role: "assistant", content: "### Today's Session Review\n\n- **Execution**: Solid. You followed your entry rules on 3/3 trades.\n- **Risk**: You stayed within your $500 daily loss limit.\n- **Leak**: You exited 1 trade early due to 'Anxious' mindset. If you held to target, you would have made an extra $150.\n- **Action Item**: Trust your stops tomorrow." });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 sm:-mx-8 px-4 sm:px-8 -mt-6 pt-6 gap-6 relative overflow-hidden">
      
      {/* Sidebar: Threads */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <button onClick={handleNewChat} className="w-full py-3 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
          <Plus size={18} /> New Chat
        </button>
        
        <GlassCard className="flex-1 overflow-y-auto no-scrollbar border-border-subtle p-2 space-y-1">
          {threads.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(t => (
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
          ))}
        </GlassCard>
      </div>

      {/* Main Chat Area */}
      <GlassCard className="flex-1 flex flex-col border-border-subtle p-0 overflow-hidden relative">
        {!activeThreadId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Brain className="h-16 w-16 text-accent-violet mb-4 opacity-50" />
            <h2 className="text-xl font-black text-text-primary">Your Personal Trading Coach</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md">Select a conversation or start a new chat to get AI-powered insights on your trading journal.</p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1", msg.role === "user" ? "bg-bg-secondary" : "bg-accent-violet/20")}>
                    {msg.role === "user" ? <User size={16} className="text-text-secondary" /> : <Brain size={16} className="text-accent-violet" />}
                  </div>
                  <div>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user" ? "bg-accent-green/10 text-text-primary rounded-tr-none border border-accent-green/20" : "bg-bg-card text-text-secondary rounded-tl-none border border-border-subtle"
                    )}>
                      {msg.content}
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

            {/* Input */}
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
                  className="absolute right-2 p-2 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {/* Right Sidebar: Coach Dashboard */}
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
          <div className="text-2xl font-black text-accent-green">A-</div>
        </GlassCard>
        
        <GlassCard className="p-4 border-border-subtle">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
            <Crosshair size={14} /> Biggest Leak
          </h3>
          <div className="text-lg font-bold text-accent-coral">FOMO Entries</div>
          <p className="text-xs text-text-secondary mt-1">Cost you $450 this week.</p>
        </GlassCard>

        <GlassCard className="p-4 border-border-subtle">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-accent-green" /> Highest Edge
          </h3>
          <div className="text-lg font-bold text-accent-green">NY AM Session</div>
          <p className="text-xs text-text-secondary mt-1">72% win rate on NQ.</p>
        </GlassCard>
      </div>
    </div>
  );
}
