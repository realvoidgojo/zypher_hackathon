import { NextRequest, NextResponse } from "next/server";

const AI_KEY = process.env.GEMINI_API_KEY;

// Each model has its own separate free-tier quota — try multiple
const MODELS = [
  "gemini-2.5-flash-lite", // newest, separate quota pool — works!
  "gemini-2.0-flash-lite", // lightest 2.0 variant
  "gemini-2.0-flash", // main flash model
];

async function tryGemini(model: string, body: object): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI_KEY}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      return null;
    }

    // 429 = rate limited → wait and retry once
    if (res.status === 429 && attempt === 0) {
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 6000;
      console.log(`${model}: rate limited, waiting ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    // Any other error → skip this model
    const errText = await res.text().catch(() => "");
    console.error(`${model} → ${res.status}: ${errText.slice(0, 200)}`);
    return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!AI_KEY) {
      return NextResponse.json(
        { reply: "Config Error: Set GEMINI_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    // Convert OpenAI-style messages → Gemini format
    const systemMsg =
      messages.find((m: any) => m.role === "system")?.content || "";
    const chatMessages = messages
      .filter((m: any) => m.role !== "system")
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body = {
      system_instruction: systemMsg
        ? { parts: [{ text: systemMsg }] }
        : undefined,
      contents: chatMessages,
      generationConfig: { temperature: 0.8 },
    };

    for (const model of MODELS) {
      try {
        const text = await tryGemini(model, body);
        if (text) return NextResponse.json({ reply: text });
      } catch (err: any) {
        console.error(`${model} error:`, err.message);
      }
    }

    return NextResponse.json(
      {
        reply:
          "AI quota exhausted for today. The free tier resets at midnight Pacific time. Please try again later.",
      },
      { status: 429 },
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { reply: "Server error processing chat request." },
      { status: 500 },
    );
  }
}
