import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { trade, prompt, type } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey === "demo") {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (type === "csv-schema") {
      const { headers, samples } = await req.json();
      const aiPrompt = `
        Analyze these CSV headers and data samples from a trading journal.
        Map them to these internal fields: symbol, direction, netPnl, entryPrice, exitPrice, positionSize, entryDate, exitDate, commission.
        
        Headers: ${JSON.stringify(headers)}
        Samples: ${JSON.stringify(samples)}
        
        Return ONLY a JSON object mapping the header index to the internal field name.
        Example: {"0": "symbol", "2": "netPnl"}
      `;
      const result = await model.generateContent(aiPrompt);
      const text = result.response.text();
      const mapping = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
      return NextResponse.json(mapping);
    }

    // Default: Trade Analysis
    const tradePrompt = `
      Analyze this trade as a professional trading coach.
      Trade Details: ${JSON.stringify(trade)}
      
      Return a JSON object with:
      - strengths: string[]
      - weaknesses: string[]
      - pattern: string (detected technical pattern)
      - suggestion: string (actionable advice)
      - riskAssessment: string
      - emotionInsight: string
      - score: number (1-10)
    `;

    const result = await model.generateContent(tradePrompt);
    const text = result.response.text();
    const analysis = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze data" }, { status: 500 });
  }
}
