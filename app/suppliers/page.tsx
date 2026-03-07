import SupplierAnalytics from "@/components/SupplierAnalytics"

export default function SuppliersPage() {
  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* 🚀 HEADER SECTION - DARK MODE */}
      <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glowing Ambient Light */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-900/20 blur-[80px] pointer-events-none rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            <p className="text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">Network Audit • Live</p>
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight">Supplier Management</h1>
          <p className="text-slate-400 font-medium mt-2 tracking-wide text-sm max-w-3xl leading-relaxed">
            Track and analyze the performance of your logistics partners. Suppliers with a reliability score below 70% are automatically flagged as high risk by the RoarX Bayesian Engine to prevent downstream supply chain disruptions.
          </p>
        </div>
      </div>

      {/* THE DATA MATRIX */}
      <SupplierAnalytics />
    </div>
  )
}