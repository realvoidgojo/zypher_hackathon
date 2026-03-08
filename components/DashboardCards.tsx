"use client";

import { useRouter } from "next/navigation";
import {
  Send,
  Download,
  AlertTriangle,
  Siren,
  Database,
  Navigation,
} from "lucide-react";

export default function DashboardCards({
  metrics,
}: {
  metrics: {
    products: number;
    warehouses: number;
    activeShipments: number;
    delayedShipments: number;
    lowStock: number;
    incomingShipments: number;
  };
}) {
  const router = useRouter();

  const cards = [
    {
      title: "Active Dispatches",
      value: metrics.activeShipments,
      icon: <Send size={16} />,
      linkable: true,
    },
    {
      title: "Incoming Supply",
      value: metrics.incomingShipments,
      icon: <Download size={16} />,
      linkable: true,
    },
    {
      title: "Critical Stock",
      value: metrics.lowStock,
      icon: <AlertTriangle size={16} />,
      linkable: false,
    },
    {
      title: "Delay Alerts",
      value: metrics.delayedShipments,
      icon: <Siren size={16} />,
      linkable: true,
    },
    {
      title: "Total Assets",
      value: metrics.products + metrics.warehouses,
      icon: <Database size={16} />,
      linkable: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
      {cards.map((m) => (
        <div
          key={m.title}
          onClick={m.linkable ? () => router.push("/shipments") : undefined}
          className={`bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] hover:-translate-y-[2px] transition-all duration-150 flex flex-col justify-between h-auto min-h-[120px] shadow-sm ${m.linkable ? "cursor-pointer active:scale-[0.98]" : ""}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#9CA3AF] text-[14px] uppercase tracking-[0.05em] font-medium">
              {m.title}
            </h3>
            <div className="text-[#9CA3AF]">{m.icon}</div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[#F9FAFB] text-3xl font-bold leading-none">
              {m.value}
            </span>
            {m.value > 0 &&
              (m.title === "Critical Stock" || m.title === "Delay Alerts") && (
                <span className="text-xs font-medium flex items-center gap-1 text-[#F59E0B]">
                  ⚠ Needs attention
                </span>
              )}
          </div>
          {m.linkable && (
            <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium bg-[#1F2937] text-[#F9FAFB] hover:bg-[#374151] transition-all border border-[#374151]">
              <Navigation size={12} /> Live Map
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
