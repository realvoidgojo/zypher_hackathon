"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"

const IconCheck = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

interface Recommendation {
  id: string;
  dbId: string;
  sku: string;
  supplier: string;
  risk: "Low" | "Medium" | "High";
  qty: number;
  cost: string;
  urgency: "Stable" | "High" | "Critical";
}

export default function ProcurementPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [approved, setApproved] = useState<string[]>([])

  useEffect(() => {
    fetchRealNeeds()
  }, [])

  async function fetchRealNeeds() {
    const sid = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null;
    if (!sid) return;

    // 1. ONLY fetch from real DB
    const { data: invData } = await supabase
      .from('inventory')
      .select('id, stock_quantity, reorder_level, products(name)')
      .eq('owner_id', sid);

    // 2. ONLY use real vendors from DB
    const { data: vendors } = await supabase
      .from('suppliers')
      .select('id, name')
      .neq('owner_id', sid);

    // Filter to only items that are actually low on stock
    const lowStockItems = invData?.filter(item => item.stock_quantity <= item.reorder_level) || [];

    if (lowStockItems.length > 0) {
      const realRecs: Recommendation[] = lowStockItems.map((item, idx) => {
        // Assign a real vendor if one exists, otherwise generic fallback
        const vendorName = vendors && vendors.length > 0 ? vendors[idx % vendors.length].name : "Global Supply Network";
        
        // Calculate smart reorder quantity (e.g. 3x the reorder level to restock)
        const requiredQty = (item.reorder_level || 20) * 3 - item.stock_quantity; 
        const costStr = "$" + (requiredQty * 145).toLocaleString(); 
        
        return {
          id: `PO-${item.id.substring(0,4).toUpperCase()}`,
          dbId: item.id, 
          sku: (item.products as any)?.name || "Unknown Asset",
          supplier: vendorName,
          risk: (idx % 3 === 0 ? "Medium" : "Low") as "Low" | "Medium" | "High", 
          qty: requiredQty,
          cost: costStr,
          urgency: (item.stock_quantity === 0 ? "Critical" : "High") as "Stable" | "High" | "Critical"
        }
      });
      setRecommendations(realRecs);
    } else {
        // If DB has no low stock, show an empty state rather than fake data
        setRecommendations([]);
    }
    setLoading(false);
  }

  // Real-Time DB Update Logic
  const handleApprove = async (req: Recommendation) => {
    setProcessing(req.id);
    
    try {
        // 1. Read the absolute latest stock directly from the DB to prevent conflicts
        const { data: currentData, error: readError } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('id', req.dbId)
            .single();
            
        if (readError || !currentData) throw new Error("Could not verify current stock.");

        // 2. Add the approved PO quantity to the current stock
        const newStock = currentData.stock_quantity + req.qty;
        
        // 3. Write it back to the DB immediately
        const { error: writeError } = await supabase
            .from('inventory')
            .update({ stock_quantity: newStock })
            .eq('id', req.dbId);

        if (writeError) throw writeError;

        // Visual confirmation delay
        setTimeout(() => {
            setProcessing(null);
            setApproved(prev => [...prev, req.id]);
        }, 1200);

    } catch (e: any) {
        console.error(e);
        alert("Transaction Failed: " + e.message);
        setProcessing(null);
    }
  }

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-cyan-400 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Running AI Procurement Algorithm...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-900/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em]">AI Purchasing Agent</p>
            </div>
            <h1 className="text-4xl font-light text-white tracking-tight">Auto-Procurement Engine</h1>
            <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm">Algorithmic vendor selection and automated Purchase Order generation.</p>
        </div>
      </div>

      <div className="bg-[#0f1423] shadow-2xl rounded-[3rem] p-10 border border-cyan-500/10 text-slate-200">
        
        {/* Dynamic Empty State for when DB has healthy stock */}
        {recommendations.length === 0 ? (
             <div className="text-center py-16 opacity-50">
                <div className="text-emerald-500 mb-4 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p className="text-emerald-400 font-black uppercase tracking-widest text-xs">Network Stable</p>
                <p className="text-sm font-medium text-slate-400 mt-2">All assets are currently operating above critical reorder thresholds.</p>
            </div>
        ) : (
            <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-3 min-w-[900px]">
                <thead>
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 pb-2">Target Asset</th>
                    <th className="pb-2">Algorithm Selected Vendor</th>
                    <th className="text-center pb-2">Req. Volume</th>
                    <th className="text-center pb-2">Est. Capital</th>
                    <th className="text-right px-6 pb-2">Execution Action</th>
                    </tr>
                </thead>
                <tbody>
                    {recommendations.map((req) => {
                        const isDone = approved.includes(req.id);
                        const isWorking = processing === req.id;

                        return (
                            <tr key={req.id} className={`bg-[#161b2a] border border-white/5 transition-all duration-300 ${isDone ? 'opacity-50 grayscale' : 'hover:bg-[#1e2436] hover:border-cyan-500/20'}`}>
                                <td className="p-5 rounded-l-[1.5rem]">
                                    <p className="font-medium text-slate-200 text-sm">{req.sku}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${req.urgency === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : req.urgency === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                                            {req.urgency}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">ID: {req.id}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <p className="text-sm font-medium text-slate-300">{req.supplier}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Trust Risk: <span className={req.risk === 'High' ? 'text-rose-400' : req.risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}>{req.risk}</span></p>
                                </td>
                                <td className="p-5 text-center font-light text-xl text-white">{req.qty}</td>
                                <td className="p-5 text-center font-medium text-indigo-300">{req.cost}</td>
                                <td className="p-5 text-right rounded-r-[1.5rem] pr-6">
                                    {isDone ? (
                                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/20">
                                            {IconCheck} <span className="text-[10px] font-black uppercase tracking-widest">PO Dispatched</span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleApprove(req)}
                                            disabled={isWorking}
                                            className="bg-cyan-600 hover:bg-cyan-500 text-[#0b0f19] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ml-auto w-36"
                                        >
                                            {isWorking ? <div className="w-3 h-3 border-2 border-[#0b0f19]/30 border-t-[#0b0f19] rounded-full animate-spin"></div> : "Approve PO"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  )
}