"use client"

import DashboardCards from "@/components/DashboardCards"
import ShipmentChart from "@/components/ShipmentChart"
import AlertsPanel from "@/components/AlertsPanel"

const StatusPulse = <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-400 animate-pulse"><circle cx="12" cy="12" r="10"/></svg>;

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HEADER SECTION */}
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-900/20 blur-[80px] pointer-events-none rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            {StatusPulse}
            <p className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">System Online • Live Sync</p>
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight">Global Command Center</h1>
          <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm">Autonomous tracking & supply chain intelligence.</p>
        </div>
        <div className="hidden lg:block text-right relative z-10">
            <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-slate-100 to-slate-500 tracking-tighter">ZYPHER</p>
            <p className="text-[10px] font-black text-cyan-500/80 uppercase tracking-[0.4em] mt-1">Team RoarX</p>
        </div>
      </div>

      <DashboardCards />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 h-full">
            <ShipmentChart />
        </div>
        <div className="xl:col-span-7 h-full">
            <AlertsPanel />
        </div>
      </div>
    </div>
  )
}