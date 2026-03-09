"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"

// Custom SVG to maintain the enterprise look
const ShieldIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;

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
      <div className="bg-[#111827] p-8 lg:p-10 rounded-3xl border border-[#1F2937] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <h2 className="text-xl font-medium text-[#F9FAFB]">Supplier Ratings</h2>
          <p className="text-sm font-medium text-[#9CA3AF] mt-1">Performance over the last 30 days</p>
        </div>
        <div className="bg-[#1F2937] px-4 py-2 rounded-lg border border-[#374151] flex items-center gap-3">
          <div className="text-[#3B82F6]">{ShieldIcon}</div>
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF]">Status</p>
            <p className="text-sm font-semibold text-[#F9FAFB]">Monitoring Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* GRID-BASED TABLE */}
        <div className="xl:col-span-7 space-y-3">
          <div className="hidden md:grid grid-cols-12 px-6 pb-2 text-xs font-semibold text-[#9CA3AF] border-b border-[#1F2937]">
            <div className="col-span-6">Supplier</div>
            <div className="col-span-3 text-center">Volume</div>
            <div className="col-span-3 text-right">Rating</div>
          </div>

          <div className="space-y-3">
            {processedData.map((s) => (
              <div key={s.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-0 items-start md:items-center bg-[#111827] p-5 rounded-3xl border border-[#1F2937] hover:border-[#374151] transition-colors duration-300 shadow-sm">
                <div className="md:col-span-6 flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-[#1F2937] shrink-0 flex items-center justify-center text-[#9CA3AF] font-medium text-sm border border-[#374151]">
                    {s.name.charAt(0)}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="font-medium text-[#F9FAFB] text-sm truncate pr-2">{s.name}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{s.isNew ? 'New Supplier' : 'Established'}</p>
                  </div>
                </div>
                <div className="w-full flex justify-between md:contents">
                  <div className="md:col-span-3 md:text-center text-left shrink-0">
                    <p className="font-medium text-[#F9FAFB] text-sm">{s.total_orders} <span className="md:hidden text-[#9CA3AF] font-normal text-[11px]">Orders</span></p>
                    <p className="text-xs text-rose-400 mt-1">{s.delayed_orders} Delayed</p>
                  </div>
                  <div className="md:col-span-3 flex justify-end shrink-0">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${s.fairRating < 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {s.fairRating}% <span className="md:hidden ml-1">Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART VIEW */}
        <div className="xl:col-span-5 bg-[#111827] p-8 rounded-3xl border border-[#1F2937] flex flex-col shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#9CA3AF]">Distribution</p>
            <h3 className="text-[#F9FAFB] font-medium text-lg mt-1">Reliability Scores</h3>
          </div>

          {/* 🔥 THE FIX: Absolute Inset Wrapper. This guarantees Recharts cannot collapse. */}
          <div className="relative w-full" style={{ height: '400px' }}>
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />

                  {/* Slightly widened YAxis to fit all partner names comfortably */}
                  <YAxis dataKey="name" type="category" width={130} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />

                  <Tooltip cursor={{ fill: '#1F2937' }} contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1F2937', color: '#F9FAFB' }} itemStyle={{ color: '#9CA3AF' }} labelStyle={{ color: '#F9FAFB' }} />

                  <Bar dataKey="fairRating" radius={[0, 4, 4, 0]} barSize={12}>
                    <LabelList dataKey="fairRating" position="right" fill="#9CA3AF" fontSize={11} offset={12} formatter={(v: any) => `${v}%`} />
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fairRating < 70 ? '#EF4444' : '#3B82F6'} />
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