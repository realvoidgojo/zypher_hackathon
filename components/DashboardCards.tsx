"use client";

import {
  Send,
  Download,
  AlertTriangle,
  Siren,
  Database
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
  const cards = [
    {
      title: "Active Dispatches",
      value: metrics.activeShipments,
      trend: "+12%",
      trendDir: "up",
      icon: <Send size={16} />,
    },
    {
      title: "Incoming Supply",
      value: metrics.incomingShipments,
      trend: "+5%",
      trendDir: "up",
      icon: <Download size={16} />,
    },
    {
      title: "Critical Stock",
      value: metrics.lowStock,
      trend: "-2%",
      trendDir: "down",
      icon: <AlertTriangle size={16} />,
    },
    {
      title: "Delay Alerts",
      value: metrics.delayedShipments,
      trend: "+1%",
      trendDir: "up",
      icon: <Siren size={16} />,
    },
    {
      title: "Total Assets",
      value: metrics.products + metrics.warehouses,
      trend: "0%",
      trendDir: "neutral",
      icon: <Database size={16} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
      {cards.map((m, i) => (
        <div
          key={m.title}
          className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] hover:-translate-y-[2px] transition-all duration-150 flex flex-col justify-between h-auto min-h-[120px] shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#9CA3AF] text-[14px] uppercase tracking-[0.05em] font-medium">
              {m.title}
            </h3>
            <div className="text-[#9CA3AF]">
              {m.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[#F9FAFB] text-3xl font-bold leading-none">
              {m.value}
            </span>
            {m.trendDir && m.trendDir !== 'neutral' && (
              <span className={`text-xs font-medium flex items-center gap-1 ${m.trendDir === 'up' && m.title !== 'Delay Alerts' && m.title !== 'Critical Stock' ? 'text-[#10B981]' : m.trendDir === 'down' && m.title !== 'Critical Stock' ? 'text-[#EF4444]' : m.title === 'Critical Stock' || m.title === 'Delay Alerts' ? 'text-[#F59E0B]' : 'text-[#9CA3AF]'}`}>
                {m.trendDir === 'up' ? '↑' : '↓'} {m.trend}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
