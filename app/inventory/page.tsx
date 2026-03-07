import InventoryTable from "@/components/InventoryTable"
import OptimizationEngine from "@/components/OptimizationEngine"

export default function InventoryPage() {
  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* 🚀 HEADER SECTION - DARK MODE */}
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-900/20 blur-[80px] pointer-events-none rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
            <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.3em]">Matrix Live</p>
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight">Inventory Visibility</h1>
          <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm max-w-3xl leading-relaxed">
            Global asset tracking across all verified storage nodes. Monitor payload quantities in real-time and execute immediate adjustments.
          </p>
        </div>
      </div>
      
      <OptimizationEngine />

      <InventoryTable />
    </div>
  )
}