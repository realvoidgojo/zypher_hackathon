"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/services/supabaseClient"

// Enterprise SVGs
const Icons = {
    Radar: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><circle cx="12" cy="12" r="10"/><path d="M12 2v10l4.5 4.5"/><path d="M12 12 7.5 7.5"/></svg>,
    Warning: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    Check: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    Track: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>,
    Phone: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
}

function getDriverInfo(shipmentId: string) {
  const drivers = ["Rajesh Kumar", "Murugan", "Senthil Nathan", "Amit Singh", "Vikram Reddy"];
  const trucks = ["TN 09 BX 1234", "KA 01 MH 8899", "MH 12 AB 4567", "DL 1C AA 1111", "TS 08 XY 9999"];
  const index = shipmentId.charCodeAt(0) % drivers.length;
  return { name: drivers[index], phone: `+91987654321${index}`, truck: trucks[index] }
}

export default function AlertsPanel() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supplierId = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null

  useEffect(() => { if (supplierId) runRealTimeAI() }, [supplierId])

  async function runRealTimeAI() {
    setLoading(true)
    const { data: shipments } = await supabase.from("shipments").select("*").or(`owner_id.eq.${supplierId},buyer_owner_id.eq.${supplierId}`).eq("status", "In Transit")
    if (!shipments) { setLoading(false); return; }

    const liveAlerts = shipments.map(ship => {
      const weather = ship.weather_condition || "Clear"
      const driver = getDriverInfo(ship.id)
      const isCritical = weather === "Storm" || weather === "Rain"
      return {
        id: ship.id, title: isCritical ? `RISK DETECTED` : `TRAJECTORY STABLE`,
        message: `Cargo "${ship.name}" traversing via ${weather} zone.`, type: isCritical ? "critical" : "safe",
        driverName: driver.name, driverPhone: driver.phone, truck: driver.truck
      }
    }).sort((a, b) => (a.type === 'critical' ? -1 : 1))

    setAlerts(liveAlerts); setLoading(false)
  }

  return (
    <div className="bg-[#0f1423] p-8 rounded-[2rem] border border-white/5 h-[450px] flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
            {Icons.Radar}
            <h2 className="text-xl font-light text-white tracking-wide">Risk Intelligence</h2>
        </div>
        <button onClick={runRealTimeAI} className="bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-colors border border-cyan-500/20 active:scale-95">
          Ping Satellites
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="text-slate-500 font-bold text-[10px] tracking-widest uppercase animate-pulse">Scanning Network...</div>
            </div>
        ) : alerts.map((alert) => (
          <div key={alert.id} className={`p-5 rounded-2xl border transition-all duration-300 bg-[#161b2a] hover:bg-[#1a2133] ${
              alert.type === "critical" 
              ? "border-rose-500/30 hover:border-rose-500/60 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]" 
              : "border-white/5 hover:border-white/10"
            }`}>
            
            <div className="flex justify-between items-start mb-3">
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${alert.type === "critical" ? "text-rose-400" : "text-emerald-400"}`}>
                    {alert.type === "critical" ? Icons.Warning : Icons.Check}
                    {alert.title}
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-[#0f1423] px-3 py-1 rounded-full border border-white/5">
                    {alert.truck}
                </span>
            </div>
            
            <p className="text-sm font-medium text-slate-300 mb-5">{alert.message}</p>
            
            <div className="flex gap-3">
              <button onClick={() => router.push(`/shipments?track=${alert.id}`)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-[#0b0f19] transition-all active:scale-95">
                {Icons.Track} Live Feed
              </button>
              <a href={`tel:${alert.driverPhone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0f1423] border border-white/10 hover:bg-white/10 text-center text-[10px] font-black tracking-widest uppercase text-slate-300 transition-all active:scale-95">
                {Icons.Phone} Comms Link
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}