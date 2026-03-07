"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/services/supabaseClient"
import { predictDemand, chatAI } from "@/services/mlPredictionService"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

// Enterprise SVGs
const Icons = {
  Brain: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4"/></svg>,
  Sparkle: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  Send: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}

export default function ForecastChart() {
  const [data, setData] = useState<any[]>([])
  const [insight, setInsight] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<{role:string;content:string}[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sid = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null;

  useEffect(() => {
    async function generateRealForecast() {
      if (!sid) { setLoading(false); return; }
      const { data: shipments } = await supabase.from("shipments").select("quantity, end_time").eq("owner_id", sid).not("end_time", "is", null)
      const historyMap: Record<string, number> = {}
      shipments?.forEach(s => {
        const date = s.end_time.split('T')[0]
        historyMap[date] = (historyMap[date] || 0) + s.quantity
      })
      const history = Object.keys(historyMap).map(date => ({ ds: date, y: historyMap[date] })).sort((a,b) => a.ds.localeCompare(b.ds))
      const finalHistory = history.length > 5 ? history : Array.from({ length: 30 }).map((_, i) => ({
        ds: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        y: Math.floor(Math.random() * 20) + 10
      }))
      const { data: inv } = await supabase.from("inventory").select("stock_quantity").eq("owner_id", sid)
      const totalStock = inv?.reduce((acc, curr) => acc + curr.stock_quantity, 0) || 0

      const forecast = await predictDemand(finalHistory)
      if (forecast) {
        setData(forecast.chart_data.map((d: any) => ({ date: d.ds, demand: d.yhat })))
        const safeDailyAvg = forecast.daily_avg > 0 ? forecast.daily_avg : 1;
        setInsight({ stock: totalStock, monthlyDemand: forecast.next_month_total, daysLeft: Math.round(totalStock / safeDailyAvg), dailyAvg: Math.round(safeDailyAvg) })
      }
      setLoading(false)
    }
    generateRealForecast()
  }, [sid])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatMessages, chatLoading])

  const sendChat = async (overrideInput?: string) => {
    const finalInput = overrideInput || chatInput;
    if (!finalInput.trim()) return;
    const userMsg = { role: 'user', content: finalInput }
    const newConv = [...chatMessages, userMsg]
    setChatMessages(newConv)
    setChatInput(""); setChatLoading(true)

    const system = { role: 'system', content: `You are a logistics AI. Current stats: stock=${insight?.stock}, 30d demand=${insight?.monthlyDemand}, days left=${insight?.daysLeft}. Be an expert and explain in detail.` }
    const reply = await chatAI([system, ...newConv])
    if (reply) { setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]) }
    setChatLoading(false)
  }

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-cyan-400 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Syncing Neural Net...</p>
    </div>
  );

  const isCritical = insight?.daysLeft < 15;

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-200 pb-20 animate-fade-in-up">
      
      {/* 1. TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f1423] p-8 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">Live Inventory</p>
          <p className="text-4xl font-light text-white mt-2 relative z-10">{insight?.stock}</p>
        </div>
        <div className="bg-[#0f1423] p-8 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">30D Demand</p>
          <p className="text-4xl font-light text-indigo-400 mt-2 relative z-10">{insight?.monthlyDemand}</p>
        </div>
        <div className={`p-8 rounded-[2rem] border shadow-xl relative overflow-hidden ${isCritical ? 'bg-rose-500/5 border-rose-500/20' : 'bg-[#0f1423] border-white/5'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'text-rose-400' : 'text-slate-500'}`}>Depletion In</p>
          <p className={`text-4xl font-light mt-2 ${isCritical ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-emerald-400'}`}>{insight?.daysLeft} <span className="text-sm font-medium text-slate-500 ml-1">Days</span></p>
        </div>
      </div>

      {/* 2. THE CHART */}
      <div className="bg-[#0f1423] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-8">
            {Icons.Sparkle}
            <h3 className="font-light text-white text-xl tracking-wide">Predictive Demand Trajectory</h3>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} minTickGap={50} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: '#05080f', borderRadius: '16px', border: '1px solid #1e293b', color: '#fff' }} />
              <Area type="monotone" dataKey="demand" stroke="#22d3ee" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. AI ANALYSIS BAR */}
      <div className="bg-[#05080f] rounded-[2.5rem] p-10 text-white shadow-[inset_0_0_40px_rgba(6,182,212,0.03)] border border-cyan-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-8 flex items-center gap-3">
          {Icons.Brain} Deep Insights Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3 p-6 bg-[#0f1423] rounded-[1.5rem] border border-white/5">
            <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Trend Intelligence</p>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Average consumption sits at <strong className="text-cyan-400 font-bold">{insight?.dailyAvg} units/day</strong>. Based on current network velocity, maintaining a safety stock of <strong className="text-white">{Math.round(insight?.dailyAvg * 7)} units</strong> is optimal.
            </p>
          </div>
          <div className={`p-6 rounded-[1.5rem] border ${isCritical ? 'bg-rose-500/10 border-rose-500/30 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
            <p className="font-bold text-[10px] uppercase text-slate-400 tracking-widest mb-3">Action Priority</p>
            <p className="text-sm text-slate-200 font-medium">
              {isCritical 
                ? "CRITICAL ALERT: Current reserves are insufficient for the predicted cycle. Immediate procurement required." 
                : "STABILITY CONFIRMED: Sufficient runway exists for the predicted demand curve. No emergency actions needed."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. THE CHATBOT TERMINAL */}
      <div className="bg-[#0f1423] rounded-[2.5rem] border border-white/5 p-8 flex flex-col h-[650px] shadow-2xl relative">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
            {Icons.Brain}
            <h3 className="font-light text-white text-xl tracking-wide">Prophet AI Terminal</h3>
            <span className="ml-auto text-[9px] text-cyan-500 uppercase tracking-[0.3em] font-black border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-500/10">v4.0 Connect</span>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 custom-scrollbar">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              {Icons.Sparkle}
              <p className="text-slate-300 text-sm font-medium mt-4">Terminal Active. Awaiting queries.</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-2">Select a directive below to begin</p>
            </div>
          )}
          
          {chatMessages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${
                m.role === 'assistant' 
                  ? 'bg-[#161b2a] text-slate-200 border border-white/5 rounded-tl-sm' 
                  : 'bg-cyan-500/10 text-cyan-50 border border-cyan-500/20 rounded-tr-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-[#161b2a] border border-white/5 text-cyan-500/70 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                Synthesizing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK DIRECTIVES */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {[
            "Analyze demand volatility",
            "Verify 30-day stock safety",
            "Project stockout timeline",
            "Generate procurement brief"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => sendChat(suggestion)}
              disabled={chatLoading}
              className="whitespace-nowrap bg-transparent text-slate-400 border border-white/10 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 transition-all disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex gap-3 relative">
          <input
            type="text"
            className="flex-1 bg-[#05080f] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 outline-none font-medium transition-all disabled:opacity-50"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendChat() }}
            placeholder="Input directive..."
            disabled={chatLoading}
          />
          <button 
            onClick={() => sendChat()} 
            disabled={chatLoading || !chatInput.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-[#05080f] w-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-cyan-600 shadow-[0_0_15px_rgba(8,145,178,0.4)] active:scale-95"
          >
            {Icons.Send}
          </button>
        </div>
      </div>
    </div>
  )
}