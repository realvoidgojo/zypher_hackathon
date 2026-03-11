"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { Loader2, Package } from "lucide-react";

const IconCheck = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [approved, setApproved] = useState<string[]>([]);

  useEffect(() => {
    fetchRealNeeds();
  }, []);

  async function fetchRealNeeds() {
    const sid =
      typeof window !== "undefined"
        ? localStorage.getItem("supplier_id")
        : null;
    if (!sid) return;

    // 1. ONLY fetch from real DB
    const { data: invData } = await supabase
      .from("inventory")
      .select("id, stock_quantity, reorder_level, products(name)")
      .eq("owner_id", sid);

    // 2. ONLY use real vendors from DB (include reliability_score for risk calculation)
    const { data: vendors } = await supabase
      .from("suppliers")
      .select("id, name, reliability_score, total_orders, delayed_orders")
      .neq("owner_id", sid);

    // Filter to only items that are actually low on stock
    const lowStockItems =
      invData?.filter((item) => item.stock_quantity <= item.reorder_level) ||
      [];

    if (lowStockItems.length > 0) {
      const realRecs: Recommendation[] = lowStockItems.map((item, idx) => {
        // Assign a real vendor if one exists, otherwise generic fallback
        const vendor =
          vendors && vendors.length > 0 ? vendors[idx % vendors.length] : null;
        const vendorName = vendor?.name || "Global Supply Network";

        // Compute risk from the vendor's real reliability score
        const reliability = vendor?.reliability_score ?? 0.5;
        const risk: "Low" | "Medium" | "High" =
          reliability >= 0.9 ? "Low" : reliability >= 0.7 ? "Medium" : "High";

        // Calculate smart reorder quantity (e.g. 3x the reorder level to restock)
        const requiredQty =
          (item.reorder_level || 20) * 3 - item.stock_quantity;
        // Estimate cost: ₹850/unit base (transparent calculation)
        const unitCost = 850;
        const costStr = "₹" + (requiredQty * unitCost).toLocaleString();

        return {
          id: `PO-${item.id.substring(0, 4).toUpperCase()}`,
          dbId: item.id,
          sku: (item.products as any)?.name || "Unknown Asset",
          supplier: vendorName,
          risk,
          qty: requiredQty,
          cost: costStr,
          urgency: (item.stock_quantity === 0 ? "Critical" : "High") as
            | "Stable"
            | "High"
            | "Critical",
        };
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
        .from("inventory")
        .select("stock_quantity")
        .eq("id", req.dbId)
        .single();

      if (readError || !currentData)
        throw new Error("Could not verify current stock.");

      // 2. Add the approved PO quantity to the current stock
      const newStock = currentData.stock_quantity + req.qty;

      // 3. Write it back to the DB immediately
      const { error: writeError } = await supabase
        .from("inventory")
        .update({ stock_quantity: newStock })
        .eq("id", req.dbId);

      if (writeError) throw writeError;

      // Visual confirmation delay
      setTimeout(() => {
        setProcessing(null);
        setApproved((prev) => [...prev, req.id]);
      }, 1200);
    } catch (e: any) {
      console.error(e);
      alert("Transaction Failed: " + e.message);
      setProcessing(null);
    }
  };

  if (loading)
    return (
      <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin" />
        <p className="mt-6 text-[#9CA3AF] font-medium text-xs animate-pulse">
          Loading recommendations...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="bg-[#111827] p-8 lg:p-10 rounded-[2.5rem] border border-[#1F2937] shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-ping"></div>
            <p className="text-[#8B5CF6] font-semibold text-xs">
              Automated Procurement
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-[#F9FAFB]">Procurement</h1>
          <p className="text-[#9CA3AF] font-medium text-sm mt-1">
            Automated vendor selection and purchase order generation.
          </p>
        </div>
      </div>

      <div className="bg-[#111827] shadow-sm rounded-[3rem] p-10 border border-[#1F2937] text-slate-200">
        {/* Dynamic Empty State for when DB has healthy stock */}
        {recommendations.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <div className="text-[#10B981] mb-4 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-[#10B981] font-semibold text-sm">
              Stock Levels Healthy
            </p>
            <p className="text-sm font-medium text-[#9CA3AF] mt-2">
              All products are currently operating above critical reorder
              thresholds.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
              {recommendations.map((req) => {
                const isDone = approved.includes(req.id);
                const isWorking = processing === req.id;

                return (
                  <div
                    key={req.id}
                    className={`bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex flex-col gap-4 ${isDone ? "opacity-50 grayscale" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#F9FAFB] text-base">{req.sku}</p>
                        <span className="text-xs font-medium text-[#9CA3AF]">ID: {req.id}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-md border ${req.urgency === "Critical" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse" : req.urgency === "High" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"}`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Supplier</p>
                        <p className="text-sm font-medium text-[#D1D5DB] truncate">{req.supplier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Quantity &amp; Cost</p>
                        <p className="text-sm font-semibold flex items-center gap-1 text-[#8B5CF6]">
                          {req.qty} <Package className="w-3.5 h-3.5" />
                          <span className="text-[#9CA3AF] font-normal mx-0.5">•</span>
                          {req.cost}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#1F2937] pt-4 mt-2 flex items-center justify-between">
                      <p className="text-xs text-[#9CA3AF]">
                        Risk:{" "}
                        <span
                          className={
                            req.risk === "High"
                              ? "text-rose-400"
                              : req.risk === "Medium"
                                ? "text-amber-400"
                                : "text-[#10B981]"
                          }
                        >
                          {req.risk}
                        </span>
                      </p>
                      {isDone ? (
                        <div className="inline-flex items-center gap-2 bg-[#10B981]/10 text-[#10B981] px-3 py-1.5 rounded-lg border border-[#10B981]/20">
                          {IconCheck} <span className="text-xs font-semibold text-[#10B981]">Ordered</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={isWorking}
                          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 w-28"
                        >
                          {isWorking ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            "Approve"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-3 min-w-[900px]">
                <thead>
                  <tr className="text-xs font-semibold text-[#9CA3AF] border-b border-[#1F2937]">
                    <th className="px-6 pb-2">Product</th>
                    <th className="pb-2">Recommended Vendor</th>
                    <th className="text-center pb-2">Quantity</th>
                    <th className="text-center pb-2">Estimated Cost</th>
                    <th className="text-right px-6 pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((req) => {
                    const isDone = approved.includes(req.id);
                    const isWorking = processing === req.id;

                    return (
                      <tr
                        key={req.id}
                        className={`bg-[#111827] border border-[#1F2937] transition-all duration-300 ${isDone ? "opacity-50 grayscale" : "hover:bg-[#1F2937] hover:border-[#374151]"}`}
                      >
                        <td className="p-5 rounded-l-3xl">
                          <p className="font-medium text-[#F9FAFB] text-sm">
                            {req.sku}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${req.urgency === "Critical" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse" : req.urgency === "High" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"}`}
                            >
                              {req.urgency}
                            </span>
                            <span className="text-xs font-medium text-[#9CA3AF]">
                              ID: {req.id}
                            </span>
                          </div>
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-medium text-[#D1D5DB]">
                            {req.supplier}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            Supplier Risk:{" "}
                            <span
                              className={
                                req.risk === "High"
                                  ? "text-rose-400"
                                  : req.risk === "Medium"
                                    ? "text-amber-400"
                                    : "text-[#10B981]"
                              }
                            >
                              {req.risk}
                            </span>
                          </p>
                        </td>
                        <td className="p-5 text-center font-medium text-lg text-[#F9FAFB]">
                          {req.qty}
                        </td>
                        <td className="p-5 text-center font-semibold text-[#8B5CF6]">
                          {req.cost}
                        </td>
                        <td className="p-5 text-right rounded-r-3xl pr-6">
                          {isDone ? (
                            <div className="inline-flex items-center gap-2 bg-[#10B981]/10 text-[#10B981] px-4 py-2 rounded-lg border border-[#10B981]/20">
                              {IconCheck}{" "}
                              <span className="text-xs font-semibold">
                                Ordered
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isWorking}
                              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ml-auto w-36"
                            >
                              {isWorking ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
