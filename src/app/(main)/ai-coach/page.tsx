"use client";

import { useTradeStore, useSettingsStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Brain, Sparkles, Send, Bot, User, Flame, 
  TrendingUp, Award, AlertTriangle, Shield, Check, Clock, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

export default function AiCoachPage() {
  const { trades } = useTradeStore();
  const { settings } = useSettingsStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Welcome to your personal **EdgeVault AI Coach**. I have analyzed your entire trade journal and am ready to help you eliminate psychological leaks, optimize your execution, and refine your edge.\n\nAsk me anything about your trading performance, or use the quick prompts below!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Compute actual trade stats
  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === "win").length;
    const winRate = (wins / totalTrades) * 100;
    
    // Find mistakes counts
    const mistakes: Record<string, number> = {};
    trades.flatMap(t => t.mistakeTags).forEach(m => {
      mistakes[m] = (mistakes[m] || 0) + 1;
    });
    const sortedMistakes = Object.entries(mistakes).sort((a, b) => b[1] - a[1]);
    const topMistake = sortedMistakes[0]?.[0] || "None";
    const totalMistakesCount = trades.reduce((sum, t) => sum + t.mistakeTags.length, 0);

    // Find top setups counts
    const setups: Record<string, { count: number; wins: number }> = {};
    trades.forEach(t => {
      t.setupTags.forEach(s => {
        if (!setups[s]) setups[s] = { count: 0, wins: 0 };
        setups[s].count++;
        if (t.result === "win") setups[s].wins++;
      });
    });
    const setupMetrics = Object.entries(setups).map(([name, data]) => ({
      name,
      count: data.count,
      winRate: (data.wins / data.count) * 100
    })).sort((a, b) => b.winRate - a.winRate || b.count - a.count);

    const topSetup = setupMetrics[0]?.name || "No setups defined yet";
    const topSetupWinRate = setupMetrics[0]?.winRate || 0;

    // Emotions calculation
    const emotions = trades.map(t => t.emotion);
    const avgEmotion = emotions.reduce((sum, val) => sum + val, 0) / emotions.length;
    let emotionStatus = "Neutral (Optimal)";
    if (avgEmotion > 1.5) emotionStatus = "Hyper-confident";
    else if (avgEmotion < -1.5) emotionStatus = "Fearful/Hesitant";

    // Discipline score: starts at 100, drops with mistakes and emotional volatility
    let disciplineScore = 100;
    disciplineScore -= (totalMistakesCount / totalTrades) * 25; // mistake density
    const highEmotionTrades = trades.filter(t => Math.abs(t.emotion) >= 3).length;
    disciplineScore -= (highEmotionTrades / totalTrades) * 20; // emotional spikes
    disciplineScore = Math.max(30, Math.min(100, Math.round(disciplineScore)));

    return {
      totalTrades,
      winRate,
      disciplineScore,
      topMistake,
      topSetup,
      topSetupWinRate,
      emotionStatus,
      avgEmotion,
      setupMetrics,
      sortedMistakes
    };
  }, [trades]);

  const quickPrompts = [
    { label: "🔍 Analyze my leaks", text: "What are my biggest psychological and execution leaks in this journal?" },
    { label: "📈 Top Setup Analysis", text: "Which setup has my highest expectancy, and how can I optimize it?" },
    { label: "🧠 Mindset Evaluation", text: "How is my emotional state affecting my wins versus my losses?" },
    { label: "📋 Give me strict rules", text: "Based on my trade history, write 3 custom rules I must follow tomorrow." }
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date()
    }]);

    setInputValue("");
    setIsThinking(true);

    // Call Gemini API if Key is present, otherwise fall back to smart local analysis
    try {
      const geminiKey = settings.api.geminiKey;
      if (geminiKey && geminiKey !== "demo") {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build context from trades
        const tradeSummary = trades.slice(-30).map(t => ({
          symbol: t.symbol,
          direction: t.direction,
          pnl: t.netPnl,
          rMultiple: t.rMultiple,
          rr: t.rr,
          result: t.result,
          emotion: t.emotion,
          setups: t.setupTags,
          mistakes: t.mistakeTags,
          notes: t.preTradeNotes + " " + t.postTradeReview
        }));

        const prompt = `You are the elite "EdgeVault AI Trade Coach" — a legendary trading psychology, risk management, and market execution coach.
You have absolute access to the trader's actual trade journal. Here are the last 30 trades from their journal:
${JSON.stringify(tradeSummary)}

Here is their current macro status:
- Discipline Score: ${stats?.disciplineScore ?? "N/A"}/100
- Main Psychological/Execution Leak: ${stats?.topMistake ?? "N/A"}
- Most Profitable Setup: ${stats?.topSetup ?? "N/A"} (Win Rate: ${stats?.topSetupWinRate ? stats.topSetupWinRate.toFixed(1) + "%" : "N/A"})
- Emotional Baseline: ${stats?.emotionStatus ?? "N/A"}

The trader asks: "${text}"

Provide a highly customized, direct, brutally honest, but empowering coaching response. 
Analyze their real setups, emotions, and mistakes. Reference their actual data. Keep the tone elite, concise, and focused on helping them level up. Use bold markdown formatting for emphasis. Do not sound generic. Make it feel like a real conversation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const botText = response.text();
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: "bot",
          text: botText,
          timestamp: new Date()
        }]);
      } else {
        // High quality heuristic mock coach
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let responseText = "";
        const lowerText = text.toLowerCase();

        if (!stats) {
          responseText = "I've analyzed your account, but you don't have any trades logged yet! Once you log a few trades in your journal, I will give you a detailed breakdown of your discipline score, emotional patterns, and execution errors. Please go ahead and log your first trade!";
        } else if (lowerText.includes("leak") || lowerText.includes("mistake") || lowerText.includes("analyze my leaks")) {
          responseText = `Based on your recent **${stats.totalTrades}** trades, your main execution leak is **"${stats.topMistake}"**. 

Here is the breakdown of your top friction points:
${stats.sortedMistakes.map(([name, count]) => `- **${name}**: ${count} occurrences`).join("\n")}

### Coaching Intervention:
When you struggle with **${stats.topMistake}**, you are actively destroying your mathematical expectancy. 
1. **The Circuit Breaker**: The next time you feel the urge to execute in a way that triggers this mistake, step away from the screens for 15 minutes.
2. **Double Confirmation**: You need to explicitly write down how this trade does *not* violate your rules in your pre-trade checklist.

Your current discipline score is **${stats.disciplineScore}/100**. Eliminating this single leak will immediately push your score above 85 and stabilize your equity curve.`;
        } else if (lowerText.includes("setup") || lowerText.includes("expectancy") || lowerText.includes("top setup")) {
          responseText = `Looking closely at your setup performance, your most reliable strategy is **"${stats.topSetup}"** with a spectacular win rate of **${stats.topSetupWinRate.toFixed(1)}%**.

Here are your setups ranked by performance:
${stats.setupMetrics.map(s => `- **${s.name}**: ${s.winRate.toFixed(1)}% win rate (${s.count} trades)`).join("\n")}

### Custom Playbook Optimization:
1. **Focus on Your Strengths**: You have a clear, demonstrable edge on **${stats.topSetup}**. Consider passing on weaker setups and sizing up slightly on this high-probability setup.
2. **Filter Out Noise**: Any setup with a win rate below 45% should be completely barred or executed with half-size until you prove consistency.
3. **Execution Review**: Analyze your last 3 winning **${stats.topSetup}** trades. Replicate the exact execution, session timing, and market condition that made them successful.`;
        } else if (lowerText.includes("emotion") || lowerText.includes("mindset") || lowerText.includes("psychological")) {
          responseText = `Your current average emotional state during entry is evaluated as **${stats.emotionStatus}** (average emotion: ${stats.avgEmotion.toFixed(1)} on a -5 to +5 scale).

### Psychometric Insights:
* **The Winner's Bias**: When you trade with high emotional intensity, you are prone to **overtrading** and **sizing too big**. 
* **The Fear Response**: If fear is present, you tend to cut your winners early, which is why your average R-multiple might be suppressed.

### Psychological Rules:
1. **State Management**: Take three deep diaphragmatic breaths before clicking buy or sell. If your heart is racing, you are over-leveraged. Reduce your position size.
2. **Zero Bias**: Accept before entry that this trade can and might fail. Your job is not to win, but to execute the playbook perfectly.`;
        } else if (lowerText.includes("rule") || lowerText.includes("custom rules") || lowerText.includes("strict")) {
          responseText = `Based on your specific trading data showing a **${stats.winRate.toFixed(1)}%** win rate and **${stats.topMistake}** as your primary leak, here are your **3 custom execution rules** for tomorrow:

1. **Rule #1 (Anti-Leak)**: You are strictly forbidden from placing a trade if it violates the **"${stats.topMistake}"** criteria. Any violation requires an immediate 24-hour trading ban.
2. **Rule #2 (Leverage Control)**: Maximum of **3 trades per day**. Over-trading is a major risk when you are in a **${stats.emotionStatus}** state.
3. **Rule #3 (Setup Discipline)**: Prioritize **"${stats.topSetup}"** setups. If none appear, you must close the charts and accept a zero-trade day.

Write these down on a physical note or pin them to your monitor. Discipline is the only bridge between a losing trader and an elite professional.`;
        } else {
          responseText = `I hear you. Looking at your portfolio of **${stats.totalTrades}** trades, your current discipline score is **${stats.disciplineScore}/100**, and your primary trade setup is **${stats.topSetup}**. 

To help you get the best feedback, tell me:
1. Are you struggling more with **letting your winners run** or **holding losers too long**?
2. How does the **"${stats.topMistake}"** leak typically start? Is it a result of FOMO, or a couple of quick losses in the NY session?

Let's address the exact friction point holding your performance back today.`;
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: "bot",
          text: responseText,
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "bot",
        text: `⚠️ **AI Engine Error**: ${err.message || "Failed to process your trade data. Using mock analysis."}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-8rem)] min-h-[500px]">
      
      {/* Sidebar Insights */}
      <div className="xl:col-span-1 flex flex-col gap-6 overflow-y-auto pr-1 no-scrollbar">
        
        {/* Coach Branding */}
        <GlassCard className="relative overflow-hidden p-6 border-accent-violet/20 flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-accent-violet/20 flex items-center justify-center mb-4 border border-accent-violet/30 animate-pulse">
            <Brain size={28} className="text-accent-violet" />
          </div>
          <h2 className="font-[family-name:var(--font-inter)] font-bold text-xl text-text-primary flex items-center gap-2">
            AI Trade Coach <Sparkles size={16} className="text-accent-green" />
          </h2>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Elite trading psychology assistant trained on institutional risk management and behavioral coaching.
          </p>
          {!settings.api.geminiKey && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-white/[0.02] border border-border-subtle flex items-center gap-2 text-left">
              <Sparkles size={14} className="text-accent-green flex-shrink-0" />
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Currently running in **Adaptive Heuristic Mode**. Add your **Gemini API Key** in Settings to unlock real-time LLM cognitive analytics.
              </p>
            </div>
          )}
        </GlassCard>

        {/* Real-time Insights Feed */}
        {stats ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="font-[family-name:var(--font-inter)] font-bold text-xs uppercase tracking-wider text-text-muted">Behavioral Dashboard</span>
              <span className="text-[10px] text-accent-green flex items-center gap-1"><Check size={10}/> Analyzed {stats.totalTrades} Trades</span>
            </div>

            {/* Discipline Score */}
            <GlassCard className="p-4 flex items-center gap-4 hover:shadow-[0_0_15px_rgba(0,255,178,0.05)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex flex-col items-center justify-center border border-accent-green/20">
                <Shield size={20} className="text-accent-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted font-medium uppercase">Discipline Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-[family-name:var(--font-space-mono)] text-accent-green">{stats.disciplineScore}</span>
                  <span className="text-xs text-text-muted">/ 100</span>
                </div>
                <div className="w-full bg-white/[0.05] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-accent-green h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.disciplineScore}%` }}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Main Psychological Leak */}
            <GlassCard className="p-4 flex items-center gap-4 hover:shadow-[0_0_15px_rgba(255,45,85,0.05)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-coral/10 flex items-center justify-center border border-accent-coral/20">
                <AlertTriangle size={20} className="text-accent-coral" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted font-medium uppercase">Biggest Leak</p>
                <p className="text-sm font-semibold text-text-primary truncate">{stats.topMistake}</p>
                <p className="text-[10px] text-accent-coral mt-0.5 flex items-center gap-1 font-medium">
                  <Flame size={10} /> Active capital friction point
                </p>
              </div>
            </GlassCard>

            {/* Most Profitable Setup */}
            <GlassCard className="p-4 flex items-center gap-4 hover:shadow-[0_0_15px_rgba(143,0,255,0.05)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-violet/10 flex items-center justify-center border border-accent-violet/20">
                <Award size={20} className="text-accent-violet" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted font-medium uppercase">Highest Edge Setup</p>
                <p className="text-sm font-semibold text-text-primary truncate">{stats.topSetup}</p>
                <p className="text-[10px] text-accent-green mt-0.5 font-medium">
                  {stats.topSetupWinRate.toFixed(0)}% Win Rate
                </p>
              </div>
            </GlassCard>

            {/* Emotional Baseline */}
            <GlassCard className="p-4 flex items-center gap-4 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center border border-border-subtle">
                <Clock size={20} className="text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted font-medium uppercase">Emotional Baseline</p>
                <p className="text-sm font-semibold text-text-primary truncate">{stats.emotionStatus}</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Avg intensity: {Math.abs(stats.avgEmotion).toFixed(1)}/5
                </p>
              </div>
            </GlassCard>
          </div>
        ) : (
          <GlassCard className="p-6 text-center text-text-muted flex flex-col items-center justify-center">
            <TrendingUp size={24} className="opacity-20 mb-2" />
            <p className="text-xs">No trade history available yet.</p>
            <p className="text-[10px] mt-1">Please log trades in your journal to populate your real-time insights dashboard.</p>
          </GlassCard>
        )}
      </div>

      {/* Main Chat Interface */}
      <GlassCard className="xl:col-span-2 flex flex-col h-full border-border-subtle/80 overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-border-subtle/50 bg-bg-card/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-accent-green animate-pulse relative">
              <span className="absolute inset-0 rounded-full bg-accent-green/60 animate-ping" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-sm text-text-primary">Interactive Coaching Session</h3>
              <p className="text-[10px] text-text-muted">EdgeVault AI v2.5 • Active Connection</p>
            </div>
          </div>
          
          <button 
            onClick={() => setMessages([{
              id: "welcome",
              sender: "bot",
              text: "Coaching session refreshed. Ask me anything about your trading performance, or use the quick prompts below!",
              timestamp: new Date()
            }])}
            className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"
            title="Reset Conversation"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                  msg.sender === "bot" 
                    ? "bg-accent-violet/10 border-accent-violet/20 text-accent-violet" 
                    : "bg-accent-green/10 border-accent-green/20 text-accent-green"
                }`}>
                  {msg.sender === "bot" ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border relative shadow-md ${
                  msg.sender === "bot"
                    ? "bg-bg-card/40 border-border-subtle rounded-tl-none text-text-secondary prose prose-invert max-w-none prose-p:text-sm prose-li:text-sm prose-headings:font-[family-name:var(--font-inter)] prose-headings:text-text-primary prose-a:text-accent-violet prose-strong:text-accent-green"
                    : "bg-accent-green/5 border-accent-green/20 rounded-tr-none text-text-primary"
                }`}>
                  {msg.sender === "bot" ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                  <span className="block text-[8px] text-text-muted mt-2 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[85%] mr-auto"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 bg-accent-violet/10 border-accent-violet/20 text-accent-violet">
                  <Bot size={16} />
                </div>
                <div className="bg-bg-card/40 border border-border-subtle rounded-2xl rounded-tl-none p-4 text-sm text-text-muted flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-accent-violet rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-accent-violet rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-accent-violet rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs">Coach is formulating mental model...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts & Input footer */}
        <div className="p-4 border-t border-border-subtle/50 bg-bg-card/10 space-y-4">
          
          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.text)}
                disabled={isThinking}
                className="px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.08] border border-border-subtle hover:border-text-muted text-xs text-text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your psychology leaks, setups, win rates, or custom rules..."
              disabled={isThinking}
              className="flex-1 bg-white/[0.02] border border-border-subtle hover:border-border-subtle/80 focus:border-accent-violet/60 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-violet/40 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-accent-violet to-accent-blue text-white flex items-center justify-center shadow-lg active:scale-95 transition-all hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:shadow-none"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </GlassCard>

    </div>
  );
}
