"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"

interface CellData {
  product: string;
  intensity: number;
  qty: number | string;
  price: string;
}

interface MatrixRow {
  region: string;
  data: CellData[];
}

export default function HeatmapPage() {
  const [matrix, setMatrix] = useState<MatrixRow[]>([])
  const [productsList, setProductsList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealHeatmapData()
  }, [])

  async function fetchRealHeatmapData() {
    const sid = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null;
    if (!sid) return;

    const { data: invData, error } = await supabase
      .from('inventory')
      .select('stock_quantity, reorder_level, products(name), warehouses(name)')
      .eq('owner_id', sid);

    if (error || !invData || invData.length === 0) {
        setLoading(false);
        return;
    }

    const uniqueWarehouses = Array.from(new Set(invData.map(item => (item.warehouses as any)?.name).filter(Boolean))) as string[];
    const uniqueProducts = Array.from(new Set(invData.map(item => (item.products as any)?.name).filter(Boolean))) as string[];

    const builtMatrix: MatrixRow[] = uniqueWarehouses.map(warehouseName => {
      const rowData = uniqueProducts.map(productName => {
        const record = invData.find(i => (i.warehouses as any)?.name === warehouseName && (i.products as any)?.name === productName);
        
        let intensity = 0;
        let qty: number | string = "N/A";
        
        const mockPriceValue = (productName.length * 125) + (productName.charCodeAt(0) * 15);
        const formattedPrice = "$" + mockPriceValue.toLocaleString();

        if (record) {
            // THE FIX: Isolate the pure number so TypeScript knows it's safe for math
            const stockQty = record.stock_quantity;
            qty = stockQty;
            const reorder = record.reorder_level || 10;
            
            if (stockQty === 0) {
                intensity = 95 + Math.floor(Math.random() * 5); 
            } else if (stockQty < reorder) {
                intensity = 60 + Math.floor(Math.random() * 15); 
            } else if (stockQty < (reorder * 2)) {
                intensity = 30 + Math.floor(Math.random() * 10); 
            } else {
                intensity = Math.floor(Math.random() * 20); 
            }
        }

        return { product: productName, intensity, qty, price: formattedPrice };
      });

      return { region: warehouseName, data: rowData };
    });

    setProductsList(uniqueProducts);
    setMatrix(builtMatrix);
    setLoading(false);
  }

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="mt-6 text-cyan-400 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Compiling Telemetry Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-900/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                <p className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">Global Telemetry</p>
            </div>
            <h1 className="text-4xl font-light text-white tracking-tight">Demand Heatmap</h1>
            <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm">Spatial distribution of asset depletion velocity across verified hubs.</p>
        </div>
      </div>

      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2.5rem] border border-cyan-500/10 shadow-2xl overflow-x-auto custom-scrollbar">
        {matrix.length === 0 ? (
            <div className="text-center py-10 opacity-50">
                <p className="text-cyan-400 font-black uppercase tracking-widest text-xs">No Data Detected</p>
                <p className="text-sm font-medium text-slate-400 mt-2">Initialize assets in the Inventory Matrix to generate telemetry.</p>
            </div>
        ) : (
            <div className="min-w-[800px]">
                <div className="flex mb-4">
                    <div className="w-32 shrink-0"></div>
                    {productsList.map(p => (
                        <div key={p} className="flex-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 truncate">
                            {p}
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    {matrix.map((row) => (
                        <div key={row.region} className="flex items-center gap-4">
                            <div className="w-32 shrink-0 text-xs font-bold text-slate-300 uppercase tracking-wider text-right pr-4 border-r border-white/5 truncate">
                                {row.region}
                            </div>
                            <div className="flex flex-1 gap-2">
                                {row.data.map((cell, i) => {
                                    if (cell.qty === "N/A") {
                                        return <div key={i} className="flex-1 h-14 rounded-xl bg-[#0b0f19] border border-white/5 opacity-30"></div>
                                    }

                                    const isHigh = cell.intensity > 75;
                                    const isMed = cell.intensity > 40 && cell.intensity <= 75;
                                    
                                    let bgColor = "bg-[#161b2a] border-white/5"; 
                                    if (isMed) bgColor = "bg-cyan-500/30 border-cyan-500/50 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]";
                                    if (isHigh) bgColor = "bg-rose-500/40 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]";

                                    return (
                                        <div key={i} className={`flex-1 h-14 rounded-xl border flex items-center justify-center transition-all duration-500 hover:scale-105 cursor-crosshair group relative ${bgColor}`}>
                                            <span className={`text-xs font-black ${isHigh ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                {cell.intensity}
                                            </span>
                                            
                                            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#05080f] border border-cyan-500/30 text-white p-3 rounded-xl min-w-[150px] z-50 shadow-2xl pointer-events-none flex flex-col gap-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">{row.region}</p>
                                                <p className="text-sm font-medium">{cell.product}</p>
                                                <div className="h-px w-full bg-white/10 my-1"></div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">Stock:</span>
                                                    <span className={`font-bold ${isHigh ? 'text-rose-400' : 'text-slate-200'}`}>{cell.qty}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">Unit Value:</span>
                                                    <span className="font-bold text-emerald-400">{cell.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center justify-end gap-6 mt-10 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#161b2a] border border-white/5"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Healthy Reserves</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-cyan-500/30 border border-cyan-500/50"></div><span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Reorder Threshold</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-rose-500/40 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div><span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Critical Depletion</span></div>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}