import ForecastChart from "@/components/ForecastChart"

export default function ForecastPage() {
  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* 🚀 HEADER SECTION - DARK MODE */}
      <div className="bg-[#111827] p-6 lg:p-10 rounded-[2rem] border border-[#1F2937] shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#818CF8] rounded-full animate-ping"></div>
            <p className="text-[#818CF8] font-semibold text-xs">Demand Forecast</p>
          </div>
          <h1 className="text-2xl font-semibold text-[#F9FAFB]">Forecast</h1>
          <p className="text-[#9CA3AF] font-medium mt-1 text-sm max-w-3xl">
            AI prediction models trained on historical data. Anticipate stock depletion and optimize procurement timelines automatically.
          </p>
        </div>
      </div>

      <ForecastChart />
    </div>
  )
}