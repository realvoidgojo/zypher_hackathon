"use client";

import DashboardCards from "@/components/DashboardCards";
import ShipmentChart from "@/components/ShipmentChart";
import AlertsPanel from "@/components/AlertsPanel";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    products: 0,
    warehouses: 0,
    activeShipments: 0,
    delayedShipments: 0,
    lowStock: 0,
    incomingShipments: 0,
  });
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    [],
  );
  const [activeShipments, setActiveShipments] = useState<any[]>([]);

  useEffect(() => {
    fetchGlobalData();
    const channel = supabase
      .channel("dashboard-monitor")
      .on("postgres_changes", { event: "*", schema: "public" }, () =>
        fetchGlobalData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchGlobalData() {
    const sid =
      typeof window !== "undefined"
        ? localStorage.getItem("supplier_id")
        : null;
    if (!sid) return;

    try {
      setLoading(true);
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", sid);
      const { count: warehouseCount } = await supabase
        .from("warehouses")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", sid);
      const { data: shipments } = await supabase
        .from("shipments")
        .select("*")
        .or(`owner_id.eq.${sid},buyer_owner_id.eq.${sid}`)
        .eq("status", "In Transit");
      const { data: invData } = await supabase
        .from("inventory")
        .select("stock_quantity, reorder_level")
        .eq("owner_id", sid);

      const outgoing = shipments?.filter((s) => s.owner_id === sid) || [];
      const incoming = shipments?.filter((s) => s.buyer_owner_id === sid) || [];
      const lowStockCount =
        invData?.filter((item) => item.stock_quantity < item.reorder_level)
          .length || 0;

      const now = new Date().toISOString();
      const delayedCount =
        shipments?.filter((s) => s.estimated_delivery_time < now).length || 0;

      setMetrics({
        products: productCount || 0,
        warehouses: warehouseCount || 0,
        activeShipments: outgoing.length,
        incomingShipments: incoming.length,
        delayedShipments: delayedCount,
        lowStock: lowStockCount,
      });

      setActiveShipments(shipments || []);

      setChartData([
        { name: "Outgoing Supply", value: outgoing.length },
        { name: "Incoming Supply", value: incoming.length },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="pb-6">
          <div className="h-4 bg-[#1F2937] rounded w-24 mb-3"></div>
          <div className="h-8 bg-[#1F2937] rounded w-64 mb-2"></div>
          <div className="h-4 bg-[#1F2937] rounded w-48"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-auto min-h-[120px] rounded-xl bg-[#111827] border border-[#1F2937] p-5 flex flex-col justify-between"
            >
              <div className="h-4 bg-[#1F2937] rounded w-2/3"></div>
              <div className="h-8 bg-[#1F2937] rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 h-[280px] lg:h-[500px] bg-[#111827] rounded-xl border border-[#1F2937] p-6 lg:p-8 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-[#1F2937]"></div>
          </div>
          <div className="xl:col-span-7 h-[300px] lg:h-[500px] bg-[#111827] rounded-xl border border-[#1F2937] p-6 flex flex-col">
            <div className="flex justify-between w-full mb-6">
              <div className="h-6 bg-[#1F2937] rounded w-32"></div>
              <div className="h-6 bg-[#1F2937] rounded w-24"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[#1F2937] rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      {/* HEADER SECTION */}
      <div className="pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
            <p className="text-[#9CA3AF] font-medium text-xs">System Online</p>
          </div>
          <h1 className="text-2xl font-semibold text-[#F9FAFB]">Overview</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Supply chain and logistics analytics.
          </p>
        </div>
      </div>

      <DashboardCards metrics={metrics} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 w-full">
          <ShipmentChart data={chartData} />
        </div>
        <div className="xl:col-span-7 w-full">
          <AlertsPanel
            shipments={activeShipments}
            runRealTimeAI={fetchGlobalData}
          />
        </div>
      </div>
    </div>
  );
}
