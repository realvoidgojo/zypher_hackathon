"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#22d3ee", "#818cf8", "#1e293b"];

const ChartIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

export default function ShipmentChart({ data: initialData }: { data?: { name: string; value: number }[] }) {
  const [data, setData] = useState<{ name: string, value: number }[]>(initialData || [])

  useEffect(() => {
    if (!initialData) {
      fetchChartData()
    } else {
      setData(initialData)
    }
  }, [initialData])

  async function fetchChartData() {
    const sid = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null;
    if (!sid) return;

    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('owner_id, buyer_owner_id, status')
        .or(`owner_id.eq.${sid},buyer_owner_id.eq.${sid}`)
        .eq('status', 'In Transit');

      if (error) return;

      const outgoing = shipments?.filter(s => s.owner_id === sid).length || 0;
      const incoming = shipments?.filter(s => s.buyer_owner_id === sid).length || 0;

      if (outgoing === 0 && incoming === 0) {
        setData([{ name: "Idle Network", value: 1 }]);
      } else {
        setData([
          { name: "Active Dispatches", value: outgoing },
          { name: "Incoming Supply", value: incoming }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    // 🔥 THE FIX: Explicit h-[500px] to strictly match the Map container height
    <div className="bg-[#0f1423] p-8 rounded-[2.5rem] border border-cyan-500/10 h-[500px] flex flex-col relative overflow-hidden shadow-2xl">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px] pointer-events-none rounded-full"></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        {ChartIcon}
        <div>
          <h2 className="text-xl font-light text-slate-100 tracking-wide">Network Load</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Asset Allocation</p>
        </div>
      </div>

      {/* 🔥 THE FIX: Strict style height injected into Recharts container to stop the "width -1" error */}
      <div style={{ width: '100%', height: '350px' }} className="relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={`piechart-${data.length}`}>
            <Pie data={data} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `drop-shadow(0px 0px 12px ${COLORS[index % COLORS.length]}60)` }} />
              ))}
            </Pie>
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#05080f', borderRadius: '16px', border: '1px solid #1e293b', color: '#f8fafc', fontWeight: 'bold', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#e2e8f0', fontSize: '14px' }} />
            <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}