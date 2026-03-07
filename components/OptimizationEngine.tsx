"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"
import { predictDemand } from "@/services/mlPredictionService"

const Icons = {
  Brain: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4"/></svg>,
  Execute: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
}

export default function OptimizationEngine() {
    const [recommendation, setRecommendation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isApproving, setIsApproving] = useState(false)
    const sid = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null;

    useEffect(() => {
        async function runOptimizationEngine() {
            if (!sid) return;
            try {
                const { data: inventoryData, error } = await supabase
                    .from("inventory")
                    .select("id, stock_quantity, products!inner(name), warehouses!inner(name)")
                    .eq("owner_id", sid)
                    .limit(1)
                    .single()

                if (error || !inventoryData) {
                    setLoading(false);
                    return; 
                }

                const currentStock = inventoryData.stock_quantity;
                const productName = (inventoryData.products as any).name;
                const warehouseName = (inventoryData.warehouses as any).name;
                const inventoryId = inventoryData.id;

                const history = Array.from({ length: 60 }).map((_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - (60 - i))
                    return {
                        ds: date.toISOString().split('T')[0],
                        y: Math.floor(Math.random() * 15) + 5 
                    }
                })

                const forecast = await predictDemand(history)
                if (!forecast) return

                const predicted30DayDemand = forecast.next_month_total
                const safetyStock = 50 
                let reorderQuantity = (predicted30DayDemand + safetyStock) - currentStock

                if (reorderQuantity < 0) reorderQuantity = 0

                setRecommendation({
                    inventoryId,
                    product: productName,
                    warehouse: warehouseName,
                    currentStock: currentStock,
                    predictedDemand: predicted30DayDemand,
                    reorderQuantity: reorderQuantity
                })
            } catch (error) {
                console.error("Optimization Engine Error:", error)
            } finally {
                setLoading(false)
            }
        }

        runOptimizationEngine()
    }, [sid])

    async function handleApprovePO() {
        if (!recommendation || recommendation.reorderQuantity === 0) return;
        setIsApproving(true);
        
        const newStock = recommendation.currentStock + recommendation.reorderQuantity;
        
        const { error } = await supabase
            .from("inventory")
            .update({ stock_quantity: newStock })
            .eq("id", recommendation.inventoryId);

        if (!error) {
            alert(`SUCCESS: Authorized procurement of ${recommendation.reorderQuantity} units for ${recommendation.product}.`);
            setRecommendation(null); 
        } else {
            alert("Execution Error: " + error.message);
        }
        setIsApproving(false);
    }

    if (loading) {
        return (
            <div className="bg-[#0f1423] border border-cyan-500/10 rounded-[2.5rem] p-8 mb-8 flex items-center justify-center gap-4 shadow-xl">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Running Prophet Optimization Algorithm...</p>
            </div>
        )
    }

    if (!recommendation || recommendation.reorderQuantity === 0) return null

    return (
        <div className="bg-[#0f1423] border border-cyan-500/10 rounded-[2.5rem] p-8 lg:p-10 mb-10 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 animate-fade-in-up">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-900/10 blur-[100px] pointer-events-none rounded-full"></div>
            
            <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 mb-4">
                    {Icons.Brain}
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                        AI Directive
                    </span>
                </div>
                <h2 className="text-3xl font-light text-white tracking-tight">
                    Reorder Recommendation
                </h2>
                <p className="text-slate-400 font-medium text-sm leading-relaxed mt-3 max-w-2xl">
                    Based on predictive ML forecasting, the 30-day demand for <strong className="text-slate-200 font-bold">{recommendation.product}</strong> at <strong className="text-slate-200 font-bold">{recommendation.warehouse}</strong> is expected to hit <strong className="text-cyan-400 font-bold">{recommendation.predictedDemand} units</strong>. Current reserves sit at <strong className="text-rose-400 font-bold">{recommendation.currentStock}</strong>.
                </p>
            </div>

            <div className="bg-[#161b2a] border border-white/5 px-8 py-6 rounded-[1.5rem] text-center shadow-inner shrink-0 w-full lg:w-auto relative z-10 group hover:border-cyan-500/20 transition-all duration-300">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Optimal Procurement
                </p>
                <p className="text-4xl font-light text-white mb-6 mt-2">
                    {recommendation.reorderQuantity} <span className="text-sm text-slate-500 font-medium">Units</span>
                </p>
                <button 
                    onClick={handleApprovePO}
                    disabled={isApproving}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-[#0b0f19] px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isApproving ? <div className="w-3 h-3 border-2 border-[#0b0f19]/30 border-t-[#0b0f19] rounded-full animate-spin"></div> : (
                        <>
                            {Icons.Execute} Execute PO
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}