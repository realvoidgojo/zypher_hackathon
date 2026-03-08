const ML_API_URL =
  process.env.NEXT_PUBLIC_ML_SERVICE_URL || "http://127.0.0.1:8000";

export type DelayPredictionInput = {
  distance: number;
  weather: number;
  traffic: number;
  supplier_reliability: number;
  historical_delay: number;
};
interface DelayInput {
  weather: string | number;
  distance: number;
  historical_delay: number;
  [key: string]: any; // Allows extra fields like traffic or reliability
}

export async function predictShipmentDelay(input: DelayInput) {
  try {
    const res = await fetch(`${ML_API_URL}/predict-delay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Map the fields to what your Python backend expects
        weather: input.weather.toString(),
        distance: input.distance,
        historical_delay: input.historical_delay,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.delay_probability; // Returns a number like 0.85
  } catch (error) {
    console.error("ML Service Connection Error:", error);
    return null;
  }
}

export async function predictDemand(history: any[]) {
  try {
    const res = await fetch(`${ML_API_URL}/predict-demand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: history }),
    });

    if (!res.ok) throw new Error("Backend unreachable");
    return await res.json();
  } catch (error) {
    console.error("ML Error:", error);
    return null;
  }
}
// ------------------------------------------------
// Chat helper – calls our own API route (which proxies to Gemini server-side)
export async function chatAI(messages: any[]) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    return data.reply || "No response from AI service.";
  } catch (err) {
    console.error("Chat API error:", err);
    return "AI service is temporarily unavailable. Please try again in a moment.";
  }
}
