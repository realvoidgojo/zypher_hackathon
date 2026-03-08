"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

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
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [productsList, setProductsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    cell: CellData;
    region: string;
    x: number;
    y: number;
    isHigh: boolean;
  } | null>(null);

  useEffect(() => {
    fetchRealHeatmapData();
  }, []);

  async function fetchRealHeatmapData() {
    const sid =
      typeof window !== "undefined"
        ? localStorage.getItem("supplier_id")
        : null;
    if (!sid) return;

    const { data: invData, error } = await supabase
      .from("inventory")
      .select("stock_quantity, reorder_level, products(name), warehouses(name)")
      .eq("owner_id", sid);

    const uniqueWarehouses = Array.from(
      new Set(
        (invData || [])
          .map((item) => (item.warehouses as any)?.name)
          .filter(Boolean),
      ),
    ) as string[];
    const uniqueProducts = Array.from(
      new Set(
        (invData || [])
          .map((item) => (item.products as any)?.name)
          .filter(Boolean),
      ),
    ) as string[];

    if (
      !error &&
      invData &&
      uniqueWarehouses.length >= 1 &&
      uniqueProducts.length >= 1
    ) {
      const builtMatrix: MatrixRow[] = uniqueWarehouses.map((warehouseName) => {
        const rowData = uniqueProducts.map((productName) => {
          const record = invData.find(
            (i) =>
              (i.warehouses as any)?.name === warehouseName &&
              (i.products as any)?.name === productName,
          );
          let intensity = 0;
          let qty: number | string = "N/A";
          if (record) {
            const stockQty = record.stock_quantity;
            qty = stockQty;
            const reorder = record.reorder_level || 10;

            if (stockQty === 0) intensity = 95;
            else if (stockQty < reorder) intensity = 70;
            else if (stockQty < reorder * 2) intensity = 35;
            else intensity = 10;
          }
          return {
            product: productName,
            intensity,
            qty,
            price: "",
          };
        });
        return { region: warehouseName, data: rowData };
      });
      setProductsList(uniqueProducts);
      setMatrix(builtMatrix);
    } else {
      // No inventory data at all — show empty state
      setProductsList([]);
      setMatrix([]);
    }
    setLoading(false);
  }

  if (loading)
    return (
      <div className="p-20 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-[#9CA3AF] font-medium text-xs animate-pulse">
          Loading heatmap...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="bg-[#111827] p-6 lg:p-10 rounded-[2.5rem] border border-[#1F2937] shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-ping"></div>
            <p className="text-[#10B981] font-semibold text-xs">
              Inventory Distribution
            </p>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#F9FAFB]">
            Demand Heatmap
          </h1>
          <p className="text-[#9CA3AF] font-medium mt-1 text-sm">
            Visual distribution of stock levels across all warehouses.
          </p>
        </div>
      </div>

      {/* The overflow-x-auto is the magic class that prevents mobile squishing */}
      {matrix.length === 0 ? (
        <div className="bg-[#111827] p-8 md:p-12 lg:p-16 rounded-3xl border border-[#1F2937] shadow-sm w-full">
          <div className="flex flex-col items-center justify-center gap-4 opacity-50 py-12">
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
              className="text-[#374151]"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
            <p className="text-sm font-medium text-[#9CA3AF]">
              No inventory data to visualize
            </p>
            <p className="text-xs text-[#6B7280] max-w-sm text-center">
              Add products and warehouses from the Inventory page to see stock
              distribution across your network
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] p-4 md:p-8 lg:p-10 rounded-3xl border border-[#1F2937] shadow-sm w-full">
          <div className="overflow-x-auto custom-scrollbar w-full pt-6 md:pt-10 pb-6 md:pb-10 relative z-20">
            <div className="min-w-max md:min-w-[800px] px-2 md:px-4">
              <div className="flex mb-4">
                <div className="w-24 md:w-32 shrink-0"></div>
                {productsList.map((p) => (
                  <div
                    key={p}
                    className="flex-1 text-center text-[10px] md:text-xs font-semibold text-[#9CA3AF] px-1 md:px-2 min-w-[60px] md:min-w-0"
                  >
                    <div className="truncate w-full">{p}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {matrix.map((row, rowIndex) => (
                  <div
                    key={row.region}
                    className="flex items-center gap-4 relative group/row border-transparent"
                  >
                    <div className="w-24 md:w-32 shrink-0 text-xs md:text-sm font-medium text-[#D1D5DB] text-right pr-2 md:pr-4 border-r border-[#1F2937] truncate">
                      {row.region}
                    </div>
                    <div className="flex flex-1 gap-2">
                      {row.data.map((cell, i) => {
                        if (cell.qty === "N/A") {
                          return (
                            <div
                              key={i}
                              className="flex-1 min-w-[60px] md:min-w-0 h-10 md:h-14 rounded-xl bg-[#111827] border border-[#1F2937] opacity-30"
                            ></div>
                          );
                        }

                        const isHigh = cell.intensity > 75;
                        const isMed =
                          cell.intensity > 40 && cell.intensity <= 75;

                        let bgColor = "bg-[#1F2937] border-white/5";
                        if (isMed) bgColor = "bg-[#3B82F6] border-[#2563EB]";
                        if (isHigh) bgColor = "bg-[#EF4444] border-[#DC2626]";

                        return (
                          <div
                            key={i}
                            className={`flex-1 min-w-[60px] md:min-w-0 h-10 md:h-14 rounded-xl border flex items-center justify-center transition-transform duration-300 hover:scale-105 cursor-crosshair group ${bgColor}`}
                            onMouseEnter={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setHoveredCell({
                                cell,
                                region: row.region,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                                isHigh,
                              });
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <span
                              className={`text-xs font-semibold ${isHigh ? "text-white" : "text-[#9CA3AF] group-hover:text-[#F9FAFB]"}`}
                            >
                              {cell.intensity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6 mt-8 pt-6 border-t border-[#1F2937] relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#1F2937] border border-white/5"></div>
              <span className="text-xs font-medium text-[#9CA3AF]">
                Healthy Reserves
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#3B82F6] border border-[#2563EB]"></div>
              <span className="text-xs font-medium text-[#9CA3AF]">
                Reorder Threshold
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#EF4444] border border-[#DC2626]"></div>
              <span className="text-xs font-medium text-[#9CA3AF]">
                Critical Depletion
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 
        This is a fixed, absolute portal tooltip that renders exactly where the mouse hovered, 
        ensuring it NEVER gets clipped by parent overflowing scroll boundaries! 
      */}
      {hoveredCell && (
        <div
          className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full pb-3"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y,
          }}
        >
          <div className="bg-[#111827] border border-[#1F2937] text-white p-2 rounded-lg min-w-[120px] shadow-2xl flex flex-col gap-0 animate-fade-in-up">
            <p className="text-[10px] font-semibold text-[#3B82F6] truncate w-full text-center">
              {hoveredCell.region}
            </p>
            <p className="text-xs font-medium text-[#F9FAFB] truncate w-full flex-1 min-w-0 text-center mt-1">
              {hoveredCell.cell.product}
            </p>
            <div className="h-px w-full bg-[#1F2937] my-1.5"></div>
            <div className="flex justify-between items-center text-[10px] gap-4">
              <span className="text-[#9CA3AF]">Stock:</span>
              <span
                className={`font-semibold ${hoveredCell.isHigh ? "text-rose-400" : "text-[#F9FAFB]"}`}
              >
                {hoveredCell.cell.qty}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] gap-4">
              <span className="text-[#9CA3AF]">Value:</span>
              <span className="font-semibold text-[#10B981]">
                {hoveredCell.cell.price}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
