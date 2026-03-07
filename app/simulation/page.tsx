"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/services/supabaseClient"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

export default function SimulationPage() {
  const [demandSpike, setDemandSpike] = useState(0)
  const [delayDays, setDelayDays] = useState(0)
  
  // Real-Time DB State
  const [realBaseStock, setRealBaseStock] = useState(1000) 
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRealInventory() {
        const sid = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null;
        if (!sid) return;

        // Fetch ALL inventory for this supplier
        const { data: invData, error } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('owner_id', sid);

        if (!error && invData) {
            // Sum up the entire network's stock to get a global baseline
            const totalStock = invData.reduce((acc, item) => acc + item.stock_quantity, 0);
            if (totalStock > 0) {
                setRealBaseStock(totalStock);
            }
        }
        setLoading(false);
    }
    fetchRealInventory();
  }, [])

  // Generate simulated chart data based on slider inputs AND Real DB Stock
  const generateData = () => {
    // Dynamically scale the daily depletion rate based on how much stock exists
    // (Assume they normally sell 5% of their total stock per day)
    const baseDepletion = Math.max(10, Math.floor(realBaseStock * 0.05)); 
    
    return Array.from({ length: 30 }).map((_, i) => {
        let normalStock = Math.max(0, realBaseStock - (baseDepletion * i));
        
        const simDepletion = baseDepletion * (1 + (demandSpike / 100));
        let simStock = Math.max(0, realBaseStock - (simDepletion * i));
        
        // Dynamically scale the restock volume to match the size of the company
        const restockVolume = Math.floor(realBaseStock * 0.6); 

        if (i > (15 + delayDays)) simStock += restockVolume; 
        if (i > 15) normalStock += restockVolume; 

        return { day: `Day ${i+1}`, baseline: normalStock, simulated: simStock }
    });
  }

  const chartData = generateData();

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-rose-400 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Initializing Sandbox Environment...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* HEADER */}
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-900/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-ping"></div>
                    <p className="text-rose-400 font-bold text-[10px] uppercase tracking-[0.3em]">Sandbox Mode Active</p>
                </div>
                <h1 className="text-4xl font-light text-white tracking-tight">War Room Simulation</h1>
                <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm max-w-2xl">Stress-test network resilience against demand spikes and geopolitical delays.</p>
            </div>
            
            {/* Displaying the live DB metric to prove it's connected */}
            <div className="bg-[#161b2a] border border-rose-500/20 px-6 py-4 rounded-xl shadow-inner text-right">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Global Baseline</p>
                <p className="text-2xl font-light text-rose-400">{realBaseStock.toLocaleString()} <span className="text-xs text-slate-400 font-medium">Units</span></p>
            </div>
        </div>
      </div>

      {/* SIMULATOR GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[550px]">
        
        {/* CONTROL PANEL */}
        <div className="xl:col-span-4 bg-[#0f1423] p-8 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl flex flex-col h-full">
            <h3 className="text-xl font-light text-white mb-8 border-b border-white/5 pb-4">Variable Parameters</h3>
            
            <div className="space-y-10 flex-1">
                {/* Demand Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Demand Surge</label>
                        <span className="text-xl font-light text-white">+{demandSpike}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" value={demandSpike} onChange={(e) => setDemandSpike(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#161b2a] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Simulates unexpected market spikes or viral marketing campaigns.</p>
                </div>

                {/* Delay Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Supply Chain Delay</label>
                        <span className="text-xl font-light text-white">{delayDays} Days</span>
                    </div>
                    <input 
                        type="range" min="0" max="14" value={delayDays} onChange={(e) => setDelayDays(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#161b2a] rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Simulates geopolitical port closures, weather events, or vendor failure.</p>
                </div>
            </div>

            <button onClick={() => {setDemandSpike(0); setDelayDays(0);}} className="w-full py-4 border border-white/10 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-all mt-auto active:scale-95">
                Reset Parameters
            </button>
        </div>

        {/* VISUALIZATION CHART */}
        <div className="xl:col-span-8 bg-[#0f1423] p-8 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl h-full flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 relative z-10">Projected Inventory Impact</h3>
            
            <div className="relative w-full flex-1" style={{ minHeight: '300px' }}>
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#334155" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="day" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} minTickGap={30} />
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#05080f', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }} />
                            
                            <Area type="monotone" dataKey="baseline" name="Stable Baseline" stroke="#64748b" fill="url(#colorBase)" strokeWidth={2} />
                            <Area type="monotone" dataKey="simulated" name="Simulated Trajectory" stroke="#f43f5e" fill="url(#colorSim)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}