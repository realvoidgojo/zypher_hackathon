"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

// Custom SVG to maintain the enterprise look
const ShieldIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

type Supplier = { id: string, name: string, total_orders: number, delayed_orders: number }

export default function SupplierAnalytics() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSuppliers() {
      const { data, error } = await supabase.from("suppliers").select("id, name, total_orders, delayed_orders").order("total_orders", { ascending: false })
      setSuppliers(data || [])
      setLoading(false)
    }
    fetchSuppliers()
  }, [])

  const processedData = suppliers.map(s => {
    const total = s.total_orders || 0;
    const delayed = s.delayed_orders || 0;
    const rawReliability = total > 0 ? (1 - (delayed / total)) : 0;
    const trustFactor = 0.5 + (Math.min(total / 10, 1) * 0.5);
    const fairRating = Math.round(rawReliability * trustFactor * 100);
    return { ...s, fairRating, isNew: total < 5 }
  }).sort((a, b) => b.fairRating - a.fairRating);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HEADER SECTION */}
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight">Partner Trust Matrix</h2>
          <p className="text-slate-400 text-xs font-medium tracking-widest uppercase mt-2">Network Analytics & Compliance</p>
        </div>
        <div className="bg-[#161b2a] px-5 py-3 rounded-xl border border-white/5 flex items-center gap-4">
            <div className="text-cyan-500">{ShieldIcon}</div>
            <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol Active</p>
                <p className="text-sm font-medium text-slate-200">Bayesian Weighting</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* GRID-BASED TABLE */}
        <div className="xl:col-span-7 space-y-3">
          <div className="grid grid-cols-12 px-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="col-span-6">Partner Profile</div>
            <div className="col-span-3 text-center">Volume</div>
            <div className="col-span-3 text-right">Rating</div>
          </div>

          <div className="space-y-3">
            {processedData.map((s) => (
              <div key={s.id} className="grid grid-cols-12 items-center bg-[#0f1423] p-5 rounded-[1.5rem] border border-white/5 hover:bg-[#161b2a] transition-colors duration-300 shadow-md">
                <div className="col-span-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1e2436] flex items-center justify-center text-slate-300 font-medium text-sm border border-white/5">
                    {s.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-slate-200 text-sm truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{s.isNew ? 'Emerging Node' : 'Strategic Partner'}</p>
                  </div>
                </div>
                <div className="col-span-3 text-center">
                  <p className="font-medium text-slate-200 text-sm">{s.total_orders}</p>
                  <p className="text-[9px] text-rose-400 mt-1">{s.delayed_orders} Delayed</p>
                </div>
                <div className="col-span-3 flex justify-end">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${s.fairRating < 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {s.fairRating}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART VIEW */}
        <div className="xl:col-span-5 bg-[#0f1423] p-8 rounded-[2rem] border border-white/5 flex flex-col shadow-lg">
            <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Efficiency Distribution</p>
                <h3 className="text-white font-light text-xl mt-1">Network Topology</h3>
            </div>
            
            {/* 🔥 THE FIX: Absolute Inset Wrapper. This guarantees Recharts cannot collapse. */}
            <div className="relative w-full" style={{ height: '400px' }}>
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barCyan" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#0891b2" stopOpacity={0.6}/>
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={1}/>
                                </linearGradient>
                                <linearGradient id="barRose" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#e11d48" stopOpacity={0.6}/>
                                    <stop offset="100%" stopColor="#fb7185" stopOpacity={1}/>
                                </linearGradient>
                            </defs>
                            <XAxis type="number" domain={[0, 100]} hide />
                            
                            {/* Slightly widened YAxis to fit all partner names comfortably */}
                            <YAxis dataKey="name" type="category" width={130} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 400 }} axisLine={false} tickLine={false} />
                            
                            <Tooltip cursor={{fill: '#161b2a'}} contentStyle={{ backgroundColor: '#05080f', borderRadius: '12px', border: '1px solid #1e293b', color: '#f8fafc' }} />
                            
                            <Bar dataKey="fairRating" radius={[0, 4, 4, 0]} barSize={12}>
                                <LabelList dataKey="fairRating" position="right" fill="#94a3b8" fontSize={11} offset={12} formatter={(v: any) => `${v}%`} />
                                {processedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fairRating < 70 ? 'url(#barRose)' : 'url(#barCyan)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}