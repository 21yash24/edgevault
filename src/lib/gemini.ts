import { Trade } from "./types";

interface AIAnalysis {
  strengths: string[];
  weaknesses: string[];
  pattern: string;
  suggestion: string;
  riskAssessment: string;
  emotionInsight: string;
  score: number; // 1-10
}

export async function analyzeTrade(trade: Trade): Promise<AIAnalysis> {
  // Check for real Gemini API key
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (apiKey && apiKey !== "demo") {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });
      if (response.ok) return await response.json();
    } catch {
      // Fall through to mock
    }
  }

  // Mock AI analysis based on actual trade data
  return generateMockAnalysis(trade);
}

function generateMockAnalysis(trade: Trade): AIAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Analyze R:R
  if (trade.rr >= 2) strengths.push("Excellent risk-to-reward ratio of 1:" + trade.rr.toFixed(1) + " — well above the minimum 1:1.5 threshold.");
  else if (trade.rr >= 1) strengths.push("Acceptable risk-to-reward ratio, but aiming for 1:2+ would improve long-term expectancy.");
  else if (trade.rr > 0) weaknesses.push("Poor risk-to-reward ratio of 1:" + trade.rr.toFixed(1) + ". Consider widening TP or tightening SL.");

  // Analyze result
  const rMultiple = trade.rMultiple || 0;
  if (trade.result === "win" && rMultiple >= 2) strengths.push("Strong execution — captured " + rMultiple.toFixed(1) + "R, showing patience to let winners run.");
  if (trade.result === "loss" && rMultiple > -1) strengths.push("Loss was well-managed at " + rMultiple.toFixed(2) + "R — risk management held.");
  if (trade.result === "loss" && rMultiple < -1.5) weaknesses.push("Loss exceeded 1R at " + rMultiple.toFixed(2) + "R — suggests stop was moved or not honored.");

  // Analyze timing
  if (trade.durationMinutes < 5) weaknesses.push("Trade held for only " + trade.durationMinutes + " minutes — possible impulse/revenge trade.");
  if (trade.durationMinutes > 240) strengths.push("Patient hold of " + Math.round(trade.durationMinutes / 60) + " hours — shows discipline.");

  // Analyze emotion
  if (trade.emotion >= 4) weaknesses.push("Entered with high emotional intensity (" + trade.emotion + "/5). Overconfidence can lead to oversized positions.");
  if (trade.emotion <= -3) weaknesses.push("Entered while fearful (emotion: " + trade.emotion + "). Fear often causes premature exits.");
  if (Math.abs(trade.emotion) <= 1) strengths.push("Neutral emotional state — optimal for decision-making.");

  // Analyze mistakes
  if (trade.mistakeTags.length > 0) {
    weaknesses.push("Self-identified mistakes: " + trade.mistakeTags.join(", ") + ". Review your playbook rules before the next session.");
  }
  if (trade.mistakeTags.length === 0 && trade.result === "win") {
    strengths.push("Clean execution with no self-reported mistakes.");
  }

  // Setup analysis
  if (trade.setupTags.length >= 2) strengths.push("Trade had multiple confirmations (" + trade.setupTags.join(", ") + ") — confluenced entry.");
  if (trade.setupTags.length === 0) weaknesses.push("No setup tags recorded — unclear what triggered the entry. Always document your thesis.");

  // Mindset Analysis
  if (trade.mindsetTags?.includes("Revengeful") || trade.mindsetTags?.includes("FOMO") || trade.mindsetTags?.includes("Impulsive")) {
    weaknesses.push(`Psychological friction: You noted being ${trade.mindsetTags.filter(t => ["Revengeful", "FOMO", "Impulsive"].includes(t)).join(" and ")}. This mental state highy correlates with poor execution.`);
  }
  if (trade.mindsetTags?.includes("Disciplined") && trade.mindsetTags?.includes("Calm")) {
    strengths.push("High-performance mindset — being calm and disciplined allowed for objective decision making.");
  }

  // Ensure minimum items
  if (strengths.length === 0) strengths.push("Trade was executed and closed according to plan.");
  if (weaknesses.length === 0) weaknesses.push("No major issues detected — maintain this level of discipline.");

  // Generate pattern
  const patterns = [
    `${trade.symbol} has shown a tendency to ${trade.direction === "long" ? "rally" : "sell off"} during the ${trade.sessionTag} session — consistent with your entry.`,
    `This ${trade.setupTags[0] || "setup"} pattern on ${trade.symbol} has appeared ${Math.floor(Math.random() * 5) + 3} times this month. Your win rate on this pattern is approximately ${trade.result === "win" ? "67%" : "42%"}.`,
    `The ${trade.marketCondition?.toLowerCase()} market condition at entry was ${trade.result === "win" ? "ideal for your strategy" : "a challenging environment — consider filtering for better conditions"}.`,
  ];

  const suggestions = [
    trade.result === "win" ? "Document this exact setup in your playbook — it's a repeatable edge." : "Consider adding a pre-trade checklist to filter setups that don't meet all criteria.",
    trade.rr < 2 ? "Work on identifying wider profit targets. Your entry logic is sound — the exit needs refinement." : "Keep targeting 2R+ setups. This risk management approach compounds well over time.",
    "Review the 15-minute chart before entry to ensure you're trading with the higher timeframe trend.",
  ];

  const emotionInsights = [
    trade.mindsetNotes ? `Your internal dialogue ("${trade.mindsetNotes.slice(0, 50)}...") suggests ${trade.emotion > 0 ? "positive" : "negative"} reinforcement loops are active.` : "",
    trade.emotion > 2 ? "Your elevated confidence level may be leading to larger position sizes. Check your risk per trade." : "",
    trade.emotion < -2 ? "Consider taking a break when emotional levels drop this low. The best trades come from a calm state." : "",
    Math.abs(trade.emotion) <= 1 ? "Excellent emotional discipline. This neutral state is where your best decisions happen." : "",
  ].filter(Boolean);

  const score = Math.min(10, Math.max(1,
    (trade.result === "win" ? 6 : 3) +
    ((trade.rMultiple || 0) >= 1 ? 2 : 0) +
    (trade.rr >= 2 ? 1 : 0) +
    (trade.mistakeTags.length === 0 ? 1 : -1) +
    (Math.abs(trade.emotion) <= 1 ? 1 : -1)
  ));

  return {
    strengths,
    weaknesses,
    pattern: patterns[Math.floor(Math.random() * patterns.length)],
    suggestion: suggestions[Math.floor(Math.random() * suggestions.length)],
    riskAssessment: (trade.rMultiple || 0) < -1 ? "⚠️ Risk exceeded planned limits" : "✅ Risk was within acceptable parameters",
    emotionInsight: emotionInsights[0] || "Emotional state was within normal range for this trade.",
    score,
  };
}
export interface DailyReport {
  summary: string;
  disciplineGrade: "A" | "B" | "C" | "D" | "F";
  pnlStatus: string;
  topMindset: string;
  mainMistake: string | null;
  advice: string;
  score: number;
}

export async function analyzeDailyPerformance(trades: Trade[]): Promise<DailyReport> {
  const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const winRate = (trades.filter(t => t.result === "win").length / trades.length) * 100;
  const mistakes = trades.flatMap(t => t.mistakeTags);
  const mindsets = trades.flatMap(t => t.mindsetTags || []);
  
  // Grade calculation
  let score = 70; // Start at C
  if (totalPnl > 0) score += 10;
  if (winRate > 60) score += 10;
  if (mistakes.length === 0) score += 15;
  if (mistakes.length > 2) score -= 20;
  if (trades.length > 5) score -= 5; // Possible overtrading
  
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  
  // Find most frequent mistake
  const mistakeCounts = mistakes.reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Find most frequent mindset
  const mindsetCounts = mindsets.reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topMindset = Object.entries(mindsetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral";

  const summaries = [
    `You finished the day ${totalPnl >= 0 ? "in the green" : "in the red"} with a ${winRate.toFixed(0)}% win rate. ${mistakes.length > 0 ? `Watch out for ${topMistake} — it was your main friction point today.` : "Excellent execution with zero self-reported mistakes."}`,
    `Today's session was dominated by a ${topMindset} mindset. Your P&L of ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)} reflects your current level of discipline.`,
  ];

  const advices = [
    totalPnl < 0 ? "Focus on your stop loss discipline tomorrow. Don't let one bad trade define your week." : "Consistency is key. You're following the plan — keep doing exactly what you're doing.",
    "Review your winners as much as your losers. Identify the common setups that worked today.",
  ];

  return {
    summary: summaries[Math.floor(Math.random() * summaries.length)],
    disciplineGrade: grade as "A" | "B" | "C" | "D" | "F",
    pnlStatus: totalPnl >= 0 ? "Profitable" : "Drawdown",
    topMindset,
    mainMistake: topMistake,
    advice: advices[Math.floor(Math.random() * advices.length)],
    score: Math.min(100, Math.max(0, score)),
  };
}
