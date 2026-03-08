"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Radar,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Phone
} from "lucide-react"

function getDriverInfo(shipmentId: string) {
  const drivers = ["Rajesh Kumar", "Murugan", "Senthil Nathan", "Amit Singh", "Vikram Reddy"];
  const trucks = ["TN 09 BX 1234", "KA 01 MH 8899", "MH 12 AB 4567", "DL 1C AA 1111", "TS 08 XY 9999"];
  const index = shipmentId.charCodeAt(0) % drivers.length;
  return { name: drivers[index], phone: `+91987654321${index}`, truck: trucks[index] }
}

export default function AlertsPanel({ shipments, runRealTimeAI }: { shipments: any[]; runRealTimeAI: () => void }) {
  const router = useRouter()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (shipments) processAlerts()
  }, [shipments])

  function processAlerts() {
    setLoading(true)
    if (!shipments || shipments.length === 0) {
      setAlerts([])
      setLoading(false)
      return
    }

    const liveAlerts = shipments.map(ship => {
      const weather = ship.weather_condition || "Clear"
      const driver = getDriverInfo(ship.id)
      const isCritical = weather === "Storm" || weather === "Rain"
      return {
        id: ship.id, title: isCritical ? `Delay Risk` : `On Track`,
        message: `Shipment "${ship.name}" is passing through a ${weather} zone.`, type: isCritical ? "critical" : "safe",
        driverName: driver.name, driverPhone: driver.phone, truck: driver.truck
      }
    }).sort((a, b) => (a.type === 'critical' ? -1 : 1))

    setAlerts(liveAlerts); setLoading(false)
  }

  return (
    <div className="bg-[#111827] p-6 lg:p-8 rounded-xl border border-[#1F2937] h-auto min-h-[300px] lg:h-[500px] flex flex-col shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-[#1F2937] pb-4">
        <div className="flex items-center gap-2">
          <Radar size={20} className="text-[#9CA3AF]" />
          <h2 className="text-[14px] font-medium text-[#F9FAFB]">Alerts</h2>
        </div>
        <button onClick={runRealTimeAI} className="bg-[#0B0F14] text-[#F9FAFB] px-3 py-1.5 rounded-md text-[12px] font-medium hover:bg-[#1F2937] transition-colors border border-[#374151]">
          Refresh
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10 pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-6 h-6 border-2 border-[#1F2937] border-t-[#3B82F6] rounded-full animate-spin"></div>
            <div className="text-[#9CA3AF] font-medium text-[12px]">Loading alerts...</div>
          </div>
        ) : alerts.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-lg border transition-all duration-150 bg-[#0B0F14] hover:border-[#374151] ${alert.type === "critical"
            ? "border-l-2 border-l-[#EF4444] border-t-[#1F2937] border-r-[#1F2937] border-b-[#1F2937]"
            : "border-[#1F2937]"
            }`}>

            <div className="flex justify-between items-start mb-2">
              <div className={`flex items-center gap-1.5 text-[12px] font-medium ${alert.type === "critical" ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                {alert.type === "critical" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                {alert.title}
              </div>
              <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#111827] px-2 py-0.5 rounded-sm border border-[#1F2937]">
                {alert.truck}
              </span>
            </div>

            <p className="text-[13px] text-[#F9FAFB] mb-4">{alert.message}</p>

            <div className="flex gap-2">
              <button onClick={() => router.push(`/shipments?track=${alert.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium bg-[#1F2937] text-[#F9FAFB] hover:bg-[#374151] transition-all">
                <Navigation size={12} /> Live Feed
              </button>
              <a href={`tel:${alert.driverPhone}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium bg-transparent border border-[#1F2937] text-[#F9FAFB] hover:bg-[#1F2937] transition-all">
                <Phone size={12} /> Comms
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}