import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, chatId, message } = await req.json();

    if (!token || !chatId || !message) {
      return NextResponse.json(
        { error: "Missing required parameters (token, chatId, message)" },
        { status: 400 }
      );
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "MarkdownV2",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to send Telegram message", details: errorData },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Telegram API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
