import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { geminiKey } = await req.json();

    if (!geminiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const prompt = `
      You are a real-time financial market data agent.
      Fetch or estimate the current live market prices and 24-hour percentage change for the following major indices:
      NQ (Nasdaq 100), ES (S&P 500), GC (Gold), CL (Crude Oil), BTC (Bitcoin).
      Also provide 3 breaking, high-impact financial news headlines that are highly relevant to traders right now.

      If you do not have live access, provide the most recent data you are aware of, or highly plausible simulated current data if necessary.
      Format the output strictly according to the provided schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  price: { type: Type.STRING },
                  change: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["up", "down"] },
                },
                required: ["symbol", "price", "change", "type"],
              },
            },
            newsEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  time: { type: Type.STRING },
                  urgent: { type: Type.BOOLEAN },
                },
                required: ["text", "time", "urgent"],
              },
            },
          },
          required: ["marketData", "newsEvents"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gemini Market Pulse Error:", error);
    return NextResponse.json(
      { error: "Failed to generate market pulse" },
      { status: 500 }
    );
  }
}
