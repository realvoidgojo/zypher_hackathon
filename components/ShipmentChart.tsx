"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#3B82F6", "#10B981"]; // Primary and Grid colors

export default function ShipmentChart({
  data: initialData,
}: {
  data?: { name: string; value: number }[];
}) {
  const [data, setData] = useState<{ name: string; value: number }[]>(
    initialData || [],
  );

  useEffect(() => {
    if (!initialData) {
      fetchChartData();
    } else {
      setData(initialData);
    }
  }, [initialData]);

  async function fetchChartData() {
    const sid =
      typeof window !== "undefined"
        ? localStorage.getItem("supplier_id")
        : null;
    if (!sid) return;

    try {
      const { data: shipments, error } = await supabase
        .from("shipments")
        .select("owner_id, buyer_owner_id, status")
        .or(`owner_id.eq.${sid},buyer_owner_id.eq.${sid}`)
        .eq("status", "In Transit");

      if (error) return;

      const outgoing = shipments?.filter((s) => s.owner_id === sid).length || 0;
      const incoming =
        shipments?.filter((s) => s.buyer_owner_id === sid).length || 0;

      if (outgoing === 0 && incoming === 0) {
        setData([{ name: "Idle Network", value: 1 }]);
      } else {
        setData([
          { name: "Outgoing Supply", value: outgoing },
          { name: "Incoming Supply", value: incoming },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="bg-[#111827] p-6 lg:p-8 rounded-xl border border-[#1F2937] h-[320px] lg:h-[500px] flex flex-col relative overflow-hidden shadow-sm w-full">
      <div className="flex items-center gap-2 mb-6 relative z-10 border-b border-[#1F2937] pb-4">
        <PieChartIcon size={20} className="text-[#9CA3AF]" />
        <div>
          <h2 className="text-[14px] font-medium text-[#F9FAFB] tracking-wide">
            Network Load
          </h2>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 min-h-[220px] lg:min-h-0 relative w-full flex flex-row lg:flex-col items-center justify-between pb-2 gap-4 lg:gap-0 mt-4 lg:mt-0">

        {/* CHART ITSELF */}
        <div className="w-1/2 lg:w-full h-full flex-1 relative min-h-[160px] lg:min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`piechart-${data.length}`}>
              <Pie
                data={data}
                innerRadius={"70%"}
                outerRadius={"100%"}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "#111827",
                  borderRadius: "8px",
                  border: "1px solid #1F2937",
                  color: "#F9FAFB",
                  fontSize: "13px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
                itemStyle={{ color: "#F9FAFB", fontWeight: 500 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CUSTOM LEGEND */}
        <div className="flex flex-col sm:flex-col lg:flex-row items-start lg:items-center justify-center gap-3 lg:gap-6 mt-0 lg:mt-4 shrink-0 w-1/2 lg:w-full z-10 pl-2 lg:pl-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-2 bg-transparent lg:bg-[#1F2937]/50 lg:px-3 lg:py-1.5 rounded-full lg:border lg:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0"></div>
              <p className="text-xs lg:text-[11px] font-medium text-[#D1D5DB]">Outgoing Supply</p>
            </div>
            <p className="text-sm font-bold text-white ml-4 lg:ml-1">{data[0]?.value || 0}</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-2 bg-transparent lg:bg-[#1F2937]/50 mt-2 lg:mt-0 lg:px-3 lg:py-1.5 rounded-full lg:border lg:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0"></div>
              <p className="text-xs lg:text-[11px] font-medium text-[#D1D5DB]">Incoming Supply</p>
            </div>
            <p className="text-sm font-bold text-white ml-4 lg:ml-1">{data[1]?.value || 0}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
