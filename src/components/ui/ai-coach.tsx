"use client";
import { useState } from "react";
import { Trade } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Brain, Sparkles, Loader2, AlertTriangle, ArrowRight, Target, Shield } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export function AiCoach({ trades, geminiKey }: { trades: Trade[], geminiKey: string }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!geminiKey) {
      setError("Please add your Gemini API key in Settings to use the AI Coach.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Summarize data to avoid token limits
      const summary = trades.slice(-50).map(t => ({
        symbol: t.symbol,
        pnl: t.netPnl,
        r: t.rMultiple,
        result: t.result,
        setup: t.setupTags.join(","),
        emotion: t.emotion,
        mistakes: t.mistakeTags.join(",")
      }));

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an elite trading psychology and risk management coach.
Analyze the following recent trades from my journal:
${JSON.stringify(summary)}

Provide a structured, brutally honest but constructive coaching session.
Format your response in Markdown with the following sections:
1. **Performance Overview**: A 2-sentence summary of my current state.
2. **Strengths**: What am I doing well? (List 2 points)
3. **Leaks**: Where am I losing money or discipline? Focus on mistakes, emotions, and R-multiple. (List 2 points)
4. **Actionable Advice**: Give me 2 strict rules to follow for my next trading session.

Keep it concise, professional, and punchy. Avoid generic advice; use the data provided.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAnalysis(response.text());
    } catch (err: any) {
      setError(err.message || "Failed to analyze data. Check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!analysis && !isLoading && (
        <GlassCard className="flex flex-col items-center justify-center py-12 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />
          
          <Brain size={48} className="text-accent-violet mb-4" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-2 text-text-primary">
            EdgeVault AI Coach
          </h3>
          <p className="text-sm text-text-secondary max-w-md mb-6">
            Unlock personalized, brutally honest feedback based on your last 50 trades. 
            The AI analyzes your setups, emotional state, and P&L to find your leaks.
          </p>
          
          {geminiKey ? (
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 bg-gradient-to-r from-accent-violet to-accent-blue text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all"
            >
              <Sparkles size={16} />
              Generate Macro Analysis
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 text-accent-coral bg-accent-coral/10 border border-accent-coral/20 px-4 py-3 rounded-lg text-sm">
              <AlertTriangle size={16} />
              <span>API Key Required. Add your Gemini API Key in Settings.</span>
            </div>
          )}
        </GlassCard>
      )}

      {isLoading && (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 size={32} className="text-accent-violet animate-spin mb-4" />
          <p className="text-sm text-text-secondary animate-pulse">Running Monte Carlo simulations on your psychology...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="bg-accent-coral/5 border-accent-coral/20">
          <p className="text-accent-coral text-sm flex items-center gap-2"><AlertTriangle size={16}/> {error}</p>
          <button onClick={() => setError(null)} className="mt-3 text-xs text-text-muted hover:text-text-primary">Try Again</button>
        </GlassCard>
      )}

      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <GlassCard className="md:col-span-1 border-accent-violet/20 flex flex-col items-center justify-center text-center p-6">
              <Brain size={48} className="text-accent-violet mb-4" />
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg mb-2">Analysis Complete</h3>
              <p className="text-xs text-text-muted mb-6">Based on your recent trades, your psychological profile has been updated.</p>
              <button
                onClick={handleAnalyze}
                className="text-xs px-4 py-2 border border-border-subtle rounded-lg hover:bg-bg-card-hover transition-colors"
              >
                Refresh Analysis
              </button>
            </GlassCard>

            <GlassCard className="md:col-span-2 prose prose-invert max-w-none prose-p:text-sm prose-li:text-sm prose-headings:font-[family-name:var(--font-syne)] prose-headings:text-text-primary prose-a:text-accent-violet prose-strong:text-accent-green">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
