"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/services/supabaseClient";
import { predictDemand, chatAI } from "@/services/mlPredictionService";
import ReactMarkdown from "react-markdown";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Enterprise SVGs
const Icons = {
  Brain: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cyan-400"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4" />
    </svg>
  ),
  Sparkle: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-indigo-400"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Send: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

export default function ForecastChart() {
  const [data, setData] = useState<any[]>([]);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sid =
    typeof window !== "undefined" ? localStorage.getItem("supplier_id") : null;

  useEffect(() => {
    async function generateRealForecast() {
      if (!sid) {
        setLoading(false);
        return;
      }

      // Fetch real shipment history for this supplier
      const { data: shipments } = await supabase
        .from("shipments")
        .select("quantity, end_time")
        .eq("owner_id", sid)
        .not("end_time", "is", null);
      const historyMap: Record<string, number> = {};
      shipments?.forEach((s) => {
        const date = s.end_time.split("T")[0];
        historyMap[date] = (historyMap[date] || 0) + s.quantity;
      });
      const history = Object.keys(historyMap)
        .map((date) => ({ ds: date, y: historyMap[date] }))
        .sort((a, b) => a.ds.localeCompare(b.ds));

      // Fetch current stock
      const { data: inv } = await supabase
        .from("inventory")
        .select("stock_quantity")
        .eq("owner_id", sid);
      const totalStock =
        inv?.reduce((acc, curr) => acc + curr.stock_quantity, 0) || 0;

      // If not enough real data, show empty state instead of fake data
      if (history.length < 5) {
        setInsight({
          stock: totalStock,
          monthlyDemand: 0,
          daysLeft: totalStock > 0 ? null : 0,
          dailyAvg: 0,
          noData: true,
        });
        setLoading(false);
        return;
      }

      const forecast = await predictDemand(history);
      if (forecast) {
        setData(
          forecast.chart_data.map((d: any) => ({ date: d.ds, demand: d.yhat })),
        );
        const safeDailyAvg = forecast.daily_avg > 0 ? forecast.daily_avg : 1;
        setInsight({
          stock: totalStock,
          monthlyDemand: forecast.next_month_total,
          daysLeft: Math.round(totalStock / safeDailyAvg),
          dailyAvg: Math.round(safeDailyAvg),
          noData: false,
        });
      } else {
        setInsight({
          stock: totalStock,
          monthlyDemand: 0,
          daysLeft: totalStock > 0 ? null : 0,
          dailyAvg: 0,
          noData: true,
        });
      }
      setLoading(false);
    }
    generateRealForecast();
  }, [sid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const sendChat = async (overrideInput?: string) => {
    const finalInput = overrideInput || chatInput;
    if (!finalInput.trim()) return;
    const userMsg = { role: "user", content: finalInput };
    const newConv = [...chatMessages, userMsg];
    setChatMessages(newConv);
    setChatInput("");
    setChatLoading(true);

    const system = {
      role: "system",
      content: `You are Zypher — a sharp logistics AI assistant embedded in a supply chain dashboard.

Context (live data):
- Current Stock: ${insight?.stock ?? "N/A"} units
- 30-Day Demand: ${insight?.monthlyDemand ?? "N/A"} units
- Avg Daily Demand: ${insight?.monthlyDemand ? Math.round(insight.monthlyDemand / 30) : "N/A"} units/day
- Estimated Days of Supply Left: ${insight?.daysLeft ?? "N/A"} days

Rules:
1. Keep responses SHORT — max 150 words. No essays.
2. Use bullet points and bold for key numbers.
3. Start with a one-line verdict (✅ Safe / ⚠️ Warning / 🚨 Critical).
4. Give 2-3 actionable insights, not theory.
5. End with one concrete recommendation.
6. Use markdown formatting: **bold**, bullet lists, headers.
7. Never repeat the raw data back — the user can already see it.
8. Be direct, confident, and practical — like a supply chain expert on a call.`,
    };
    const reply = await chatAI([system, ...newConv]);
    if (reply) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    }
    setChatLoading(false);
  };

  if (loading)
    return (
      <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-[#9CA3AF] font-medium text-xs animate-pulse">
          Loading forecast...
        </p>
      </div>
    );

  const isCritical = insight?.daysLeft < 15;

  return (
    <div className="w-full text-slate-200 pb-20 animate-fade-in-up">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN — scrolls normally */}
        <div className="xl:col-span-7 flex flex-col gap-6 lg:gap-8">
          {/* METRIC CARDS */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-[#111827] p-4 lg:p-6 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col justify-center">
              <p className="text-[#9CA3AF] text-[10px] md:text-xs font-semibold uppercase tracking-wider truncate">
                Inventory
              </p>
              <p className="text-2xl md:text-4xl font-light text-white mt-2 md:mt-3">
                {insight?.stock ?? 0}
              </p>
              <p className="text-[10px] md:text-xs text-[#4B5563] mt-1 md:mt-2 font-medium hidden sm:block">
                Total units on hand
              </p>
            </div>
            <div className="bg-[#111827] p-4 lg:p-6 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col justify-center">
              <p className="text-[#9CA3AF] text-[10px] md:text-xs font-semibold uppercase tracking-wider truncate">
                30-Day Demand
              </p>
              {insight?.noData ? (
                <>
                  <p className="text-2xl md:text-4xl font-light text-[#4B5563] mt-2 md:mt-3">
                    —
                  </p>
                  <p className="text-[10px] md:text-xs text-[#4B5563] mt-1 md:mt-2 font-medium hidden sm:block">
                    Needs shipment history
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-4xl font-light text-indigo-400 mt-2 md:mt-3">
                    {insight?.monthlyDemand}
                  </p>
                  <p className="text-[10px] md:text-xs text-[#4B5563] mt-1 md:mt-2 font-medium hidden sm:block">
                    Forecasted units needed
                  </p>
                </>
              )}
            </div>
            <div
              className={`p-4 lg:p-6 rounded-2xl border shadow-sm flex flex-col justify-center ${!insight?.noData && isCritical ? "bg-rose-500/5 border-rose-500/20" : "bg-[#111827] border-[#1F2937]"}`}
            >
              <p
                className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider truncate ${!insight?.noData && isCritical ? "text-rose-400" : "text-[#9CA3AF]"}`}
              >
                Depletion In
              </p>
              {insight?.noData ? (
                <>
                  <p className="text-2xl md:text-4xl font-light text-[#4B5563] mt-2 md:mt-3">
                    —
                  </p>
                  <p className="text-[10px] md:text-xs text-[#4B5563] mt-1 md:mt-2 font-medium hidden sm:block">
                    Awaiting data
                  </p>
                </>
              ) : (
                <>
                  <p
                    className={`text-2xl md:text-4xl font-light mt-2 md:mt-3 ${isCritical ? "text-rose-500" : "text-emerald-400"}`}
                  >
                    {insight?.daysLeft}{" "}
                    <span className="text-xs md:text-sm font-medium text-slate-500 ml-0.5 md:ml-1">
                      <span className="hidden sm:inline">days</span>
                      <span className="sm:hidden">d</span>
                    </span>
                  </p>
                  <p
                    className={`text-[10px] md:text-xs mt-1 md:mt-2 font-medium hidden sm:block ${isCritical ? "text-rose-500/60" : "text-[#4B5563]"}`}
                  >
                    {isCritical ? "Reorder urgently" : "Sufficient stock level"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* DEMAND CHART */}
          <div className="bg-[#111827] p-5 lg:p-8 rounded-2xl border border-[#1F2937] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              {Icons.Sparkle}
              <h3 className="font-semibold text-[#F9FAFB] text-base">
                Demand Forecast
              </h3>
              <span className="ml-auto text-[10px] text-[#9CA3AF] font-bold tracking-widest uppercase">
                30-Day Projection
              </span>
            </div>
            {insight?.noData || data.length === 0 ? (
              <div className="h-[250px] sm:h-[300px] w-full mt-4 flex flex-col items-center justify-center gap-4 opacity-50">
                {Icons.Sparkle}
                <p className="text-sm font-medium text-[#9CA3AF]">
                  Not enough shipment data yet
                </p>
                <p className="text-xs text-[#6B7280] max-w-xs text-center">
                  Complete at least 5 shipments to unlock AI-powered demand
                  forecasting
                </p>
              </div>
            ) : (
              <div className="h-[250px] sm:h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorDemand"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#06b6d4"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#06b6d4"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#1e293b"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      minTickGap={50}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#334155",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                      contentStyle={{
                        backgroundColor: "#05080f",
                        borderRadius: "12px",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="demand"
                      stroke="#22d3ee"
                      fillOpacity={1}
                      fill="url(#colorDemand)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI ANALYSIS */}
          <div className="bg-[#111827] rounded-2xl p-5 lg:p-8 border border-[#1F2937]">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-6 flex items-center gap-2">
              {Icons.Brain} AI Analysis
            </h4>
            {insight?.noData ? (
              <div className="p-5 bg-[#0B0F14] rounded-xl border border-[#1F2937] text-center">
                <p className="text-sm text-[#9CA3AF] font-medium">
                  Insufficient data for AI analysis
                </p>
                <p className="text-xs text-[#6B7280] mt-2">
                  The AI engine needs real shipment history to generate
                  meaningful consumption trends and stock recommendations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-5 bg-[#0B0F14] rounded-xl border border-[#1F2937]">
                  <p className="font-semibold text-xs text-[#9CA3AF] uppercase tracking-wider">
                    Consumption Trend
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Average consumption is{" "}
                    <strong className="text-cyan-400">
                      {insight?.dailyAvg} units/day
                    </strong>
                    . Safety stock of{" "}
                    <strong className="text-white">
                      {Math.round(insight?.dailyAvg * 7)} units
                    </strong>{" "}
                    recommended.
                  </p>
                </div>
                <div
                  className={`p-5 rounded-xl border ${isCritical ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/5 border-emerald-500/20"}`}
                >
                  <p className="font-semibold text-xs text-[#9CA3AF] uppercase tracking-wider mb-2">
                    Status
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-slate-200">
                    {isCritical
                      ? "Stock is insufficient. Immediate procurement is recommended."
                      : "Stock levels are healthy for predicted demand."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — sticky chat panel */}
        <div className="xl:col-span-5 xl:sticky xl:top-8 h-[480px] xl:h-[calc(100vh-4rem)]">
          <div className="bg-[#111827] rounded-2xl border border-[#1F2937] shadow-sm flex flex-col h-full overflow-hidden">
            {/* CHAT HEADER */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1F2937] shrink-0">
              {Icons.Brain}
              <div>
                <h3 className="font-semibold text-[#F9FAFB] text-sm">
                  Forecast Assistant
                </h3>
                <p className="text-[10px] text-[#4B5563] font-medium mt-0.5">
                  Powered by AI · Always on
                </p>
              </div>
              <span className="ml-auto text-[10px] text-[#9CA3AF] font-bold tracking-wider uppercase border border-[#374151] px-2 py-1 rounded-full bg-[#0B0F14]">
                AI Agent
              </span>
            </div>

            {/* MESSAGES — this is the scrollable region */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar min-h-0">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4">
                  {Icons.Sparkle}
                  <p className="text-[#9CA3AF] text-sm font-medium mt-4">
                    How can I help you analyze the forecast?
                  </p>
                  <p className="text-[#6B7280] text-xs mt-1">
                    Select a suggestion below to begin
                  </p>
                </div>
              )}

              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                      m.role === "assistant"
                        ? "bg-[#161b2a] text-slate-200 border border-[#1F2937] rounded-tl-sm"
                        : "bg-[#3B82F6] text-white border border-[#2563EB] rounded-tr-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-cyan-400 prose-strong:text-white prose-a:text-cyan-400">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#0B0F14] border border-[#1F2937] text-[#9CA3AF] text-[13px] font-medium p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[#1F2937] border-t-[#3B82F6] rounded-full animate-spin"></div>
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA — pinned to bottom */}
            <div className="shrink-0 border-t border-[#1F2937] px-6 py-4 flex flex-col gap-3 bg-[#111827]">
              {/* QUICK CHIPS */}
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  "Analyze demand volatility",
                  "Verify 30-day stock safety",
                  "Project stockout timeline",
                  "Generate procurement brief",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendChat(suggestion)}
                    disabled={chatLoading}
                    className="whitespace-nowrap bg-[#0B0F14] text-[#D1D5DB] border border-[#1F2937] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-[#1F2937] hover:text-white transition-all disabled:opacity-50 shrink-0"
                  >
                    {suggestion}
                  </button>
                ))}
                <div className="w-3 shrink-0" />
              </div>

              {/* TEXT INPUT */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-[#0B0F14] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-[#F9FAFB] placeholder-[#4B5563] focus:border-[#374151] outline-none font-medium transition-all disabled:opacity-50"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat();
                  }}
                  placeholder="Ask a question..."
                  disabled={chatLoading}
                />
                <button
                  onClick={() => sendChat()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white w-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shadow-sm active:scale-95 shrink-0"
                >
                  {Icons.Send}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
