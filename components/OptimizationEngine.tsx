"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { predictDemand } from "@/services/mlPredictionService";

const Icons = {
  Brain: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#3B82F6]"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4" />
    </svg>
  ),
  Execute: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

export default function OptimizationEngine() {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const sid =
    typeof window !== "undefined" ? localStorage.getItem("supplier_id") : null;

  useEffect(() => {
    async function runOptimizationEngine() {
      if (!sid) return;
      try {
        const { data: inventoryData, error } = await supabase
          .from("inventory")
          .select(
            "id, stock_quantity, products!inner(name), warehouses!inner(name)",
          )
          .eq("owner_id", sid)
          .limit(1)
          .single();

        if (error || !inventoryData) {
          setLoading(false);
          return;
        }

        const currentStock = inventoryData.stock_quantity;
        const productName = (inventoryData.products as any).name;
        const warehouseName = (inventoryData.warehouses as any).name;
        const inventoryId = inventoryData.id;

        // Fetch REAL shipment history instead of generating fake random data
        const { data: shipmentHistory } = await supabase
          .from("shipments")
          .select("quantity, end_time")
          .eq("owner_id", sid)
          .not("end_time", "is", null);

        const historyMap: Record<string, number> = {};
        shipmentHistory?.forEach((s) => {
          const date = s.end_time.split("T")[0];
          historyMap[date] = (historyMap[date] || 0) + s.quantity;
        });
        const history = Object.keys(historyMap)
          .map((date) => ({ ds: date, y: historyMap[date] }))
          .sort((a, b) => a.ds.localeCompare(b.ds));

        // Not enough real data — skip recommendation instead of using fake data
        if (history.length < 5) {
          setLoading(false);
          return;
        }

        const forecast = await predictDemand(history);
        if (!forecast) return;

        const predicted30DayDemand = forecast.next_month_total;
        const safetyStock = 50;
        let reorderQuantity = predicted30DayDemand + safetyStock - currentStock;

        if (reorderQuantity < 0) reorderQuantity = 0;

        setRecommendation({
          inventoryId,
          product: productName,
          warehouse: warehouseName,
          currentStock: currentStock,
          predictedDemand: predicted30DayDemand,
          reorderQuantity: reorderQuantity,
        });
      } catch (error) {
        console.error("Optimization Engine Error:", error);
      } finally {
        setLoading(false);
      }
    }

    runOptimizationEngine();
  }, [sid]);

  async function handleApprovePO() {
    if (!recommendation || recommendation.reorderQuantity === 0) return;
    setIsApproving(true);

    const newStock =
      recommendation.currentStock + recommendation.reorderQuantity;

    const { error } = await supabase
      .from("inventory")
      .update({ stock_quantity: newStock })
      .eq("id", recommendation.inventoryId);

    if (!error) {
      alert(
        `SUCCESS: Authorized procurement of ${recommendation.reorderQuantity} units for ${recommendation.product}.`,
      );
      setRecommendation(null);
    } else {
      alert("Execution Error: " + error.message);
    }
    setIsApproving(false);
  }

  if (loading) {
    return (
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 mb-8 flex items-center justify-center gap-4 shadow-sm">
        <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#9CA3AF] font-medium text-xs animate-pulse">
          Running optimization engine...
        </p>
      </div>
    );
  }

  if (!recommendation || recommendation.reorderQuantity === 0) return null;

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 lg:p-10 mb-10 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 animate-fade-in-up">
      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-3 mb-4">
          {Icons.Brain}
          <span className="text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-md border border-[#3B82F6]/20">
            AI Recommendation
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-[#F9FAFB]">
          Reorder Recommendation
        </h2>
        <p className="text-[#9CA3AF] font-medium text-sm mt-3 max-w-2xl">
          Based on predictive forecasting, the 30-day demand for{" "}
          <strong className="text-[#F9FAFB] font-semibold">
            {recommendation.product}
          </strong>{" "}
          at{" "}
          <strong className="text-[#F9FAFB] font-semibold">
            {recommendation.warehouse}
          </strong>{" "}
          is expected to hit{" "}
          <strong className="text-[#3B82F6] font-semibold">
            {recommendation.predictedDemand} units
          </strong>
          . Current reserves sit at{" "}
          <strong className="text-rose-400 font-semibold">
            {recommendation.currentStock}
          </strong>
          .
        </p>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] px-8 py-6 rounded-3xl text-center shadow-sm shrink-0 w-full lg:w-auto relative z-10 hover:border-[#374151] transition-all duration-300">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-1">
          Suggested Quantity
        </p>
        <p className="text-3xl font-semibold text-[#F9FAFB] mb-6 mt-2">
          {recommendation.reorderQuantity}{" "}
          <span className="text-sm text-[#9CA3AF] font-medium">Units</span>
        </p>
        <button
          onClick={handleApprovePO}
          disabled={isApproving}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isApproving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>{Icons.Execute} Approve PO</>
          )}
        </button>
      </div>
    </div>
  );
}
