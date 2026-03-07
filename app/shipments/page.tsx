"use client"

import React, { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import ShipmentManager from "@/components/ShipmentManager"
import ShipmentChart from "@/components/ShipmentChart"

// 🔥 THE FIX: Stripped types from dynamic import to prevent Next.js compilation crashes
const ShipmentMap = dynamic(
  () => import("@/components/ShipmentMap"),
  { 
    ssr: false, 
    loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-[#0f1423] rounded-[2.5rem] border border-cyan-500/10 shadow-2xl animate-pulse font-black text-cyan-500 uppercase tracking-widest text-xs">📡 Establishing Sat-Link...</div> 
  }
)

function ShipmentsContent() {
  const searchParams = useSearchParams();
  const trackId = searchParams.get('track'); 

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* 🚀 OPERATIONAL HEADER */}
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-900/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    <p className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">Fleet Pulse • Active</p>
                </div>
                <h1 className="text-4xl font-light text-white tracking-tight">Fleet Satellites</h1>
                <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm">Real-time telemetry and trajectory monitoring.</p>
            </div>
            {trackId && (
                <button onClick={() => window.location.href='/shipments'} className="bg-cyan-600 hover:bg-cyan-500 text-[#0b0f19] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] active:scale-95 whitespace-nowrap">Focus All Units</button>
            )}
        </div>
      </div>

      {/* 🖥️ MISSION CONTROL GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
            <ShipmentMap focusId={trackId} />
        </div>
        <div className="xl:col-span-4">
            <ShipmentChart />
        </div>
      </div>

      {/* 🚚 LOGISTICS CONTROL PANEL */}
      <ShipmentManager />
    </div>
  )
}

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black text-cyan-500 uppercase tracking-widest text-xs animate-pulse">Initializing Comms...</div>}>
      <ShipmentsContent />
    </Suspense>
  )
}