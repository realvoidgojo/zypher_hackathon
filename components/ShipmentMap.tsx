"use client"
import { useEffect, useState, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import { LatLngTuple } from "leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { getRoute } from "@/services/routingService"
import { supabase } from "@/services/supabaseClient"

export interface ShipmentMapProps {
  focusId?: string | null
}

function getDriverInfo(shipmentId: string) {
  const drivers = ["Rajesh Kumar", "Murugan", "Senthil Nathan", "Amit Singh", "Vikram Reddy"]
  const trucks = ["TN 09 BX 1234", "KA 01 MH 8899", "MH 12 AB 4567", "DL 1C AA 1111", "TS 08 XY 9999"]
  const index = shipmentId.charCodeAt(0) % drivers.length
  return { name: drivers[index], phone: `+91987654321${index}`, truck: trucks[index] }
}

// Map Markers 
const createOriginIcon = () => L.divIcon({
  html: `<div style="width:14px; height:14px; background:#10B981; border-radius:50%; border:2px solid #111827;"></div>`,
  className: "", iconSize: [14, 14], iconAnchor: [7, 7]
})

const createDestinationIcon = () => L.divIcon({
  html: `<div style="width:14px; height:14px; background:#EF4444; border-radius:50%; border:2px solid #111827;"></div>`,
  className: "", iconSize: [14, 14], iconAnchor: [7, 7]
})

const createTruckIcon = (isOutgoing: boolean, isFocused: boolean) => {
  const color = isOutgoing ? "#3B82F6" : "#10B981"
  const size = isFocused ? 54 : 26
  const svgPath = isOutgoing ? `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>` : `<path d="m19 12H5"/><path d="m12 19-7-7 7-7"/>`
  const pulseHtml = isFocused ? `<div style="position:absolute; width:150%; height:150%; border:2px solid ${color}; border-radius:50%; animation:map-pulse 1.5s infinite ease-out;"></div>` : ''

  return L.divIcon({
    html: `<div style="position:relative; width:${size}px; height:${size}px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #111827;">${pulseHtml}<svg xmlns="http://www.w3.org/2000/svg" width="${isFocused ? '20' : '12'}" height="${isFocused ? '20' : '12'}" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg></div><style>@keyframes map-pulse { 0% { transform:scale(0.8); opacity:1; } 100% { transform:scale(1.4); opacity:0; } }</style>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2]
  })
}

// Fixes Leaflet tile rendering after a CSS container resize (e.g. fullscreen toggle)
function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 50)
    return () => clearTimeout(timer)
  }, [isFullscreen, map])
  return null
}
function SingleShipmentRoute({ id, name, isOutgoing, oLat, oLng, dLat, dLng, startTime, weatherCondition, isFocused }: any) {
  const map = useMap()
  const [route, setRoute] = useState<LatLngTuple[]>([])
  const [truckPos, setTruckPos] = useState<LatLngTuple>([oLat, oLng])
  const [eta, setEta] = useState("")
  const driver = getDriverInfo(id)

  const originIcon = useMemo(() => createOriginIcon(), [])
  const destIcon = useMemo(() => createDestinationIcon(), [])
  const truckIcon = useMemo(() => createTruckIcon(isOutgoing, isFocused), [isOutgoing, isFocused])

  useEffect(() => {
    let mounted = true
    async function loadRoute() {
      try {
        const result = await getRoute(oLat, oLng, dLat, dLng)
        if (!result || !mounted) return
        setRoute(result.coordinates)

        const penalty = weatherCondition?.toLowerCase().includes("storm") || weatherCondition?.toLowerCase().includes("rain") ? 1.5 : 1
        const durationMs = parseInt(result.duration) * 60 * 1000 * penalty
        const startMs = new Date(startTime).getTime()

        const updateMovement = () => {
          if (!mounted) return;
          const progress = Math.min(1, Math.max(0, (Date.now() - startMs) / durationMs))
          if (result.coordinates.length > 0) {
            const index = Math.floor(progress * (result.coordinates.length - 1))
            const newPos = result.coordinates[index]
            setTruckPos(newPos)
            if (isFocused) map.flyTo(newPos, 10, { duration: 2 })
          }
          setEta(progress >= 1 ? "Arrived" : `${Math.max(0, Math.floor((durationMs - (Date.now() - startMs)) / 3600000))}h remaining`)
        }
        updateMovement()
        const interval = setInterval(updateMovement, 10000)
        return () => clearInterval(interval)
      } catch (err) {
        console.error("Route calculation error:", err)
      }
    }
    loadRoute()
    return () => { mounted = false }
  }, [oLat, oLng, dLat, dLng, startTime, weatherCondition, isFocused, map])

  return (
    <>
      <Marker position={[oLat, oLng]} icon={originIcon}>
        <Popup><div className="bg-[#111827] text-[#10B981] p-2 rounded-lg font-bold text-[10px] uppercase tracking-widest text-center">Origin Hub</div></Popup>
      </Marker>
      <Marker position={[dLat, dLng]} icon={destIcon}>
        <Popup><div className="bg-[#111827] text-[#EF4444] p-2 rounded-lg font-bold text-[10px] uppercase tracking-widest text-center">Destination Hub</div></Popup>
      </Marker>
      <Polyline positions={route} color={isOutgoing ? "#3B82F6" : "#10B981"} weight={isFocused ? 6 : 3} opacity={isFocused ? 1 : 0.4} />
      <Marker position={truckPos} icon={truckIcon} zIndexOffset={isFocused ? 1000 : 0}>
        <Popup>
          <div className="bg-[#111827] border border-[#1F2937] text-[#F9FAFB] p-3 rounded-xl min-w-[160px]">
            <p className="text-[#3B82F6] text-[10px] font-black uppercase tracking-widest truncate">{name}</p>
            <p className="font-light text-[#F9FAFB] text-lg mt-1">ETA: {eta}</p>
            <div className="h-px w-full bg-[#1F2937] my-3"></div>
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Pilot Profile</p>
            <p className="text-sm font-medium text-[#F9FAFB]">{driver.name}</p>
            <p className="text-xs text-[#9CA3AF] mt-1 font-bold">{driver.truck}</p>
          </div>
        </Popup>
      </Marker>
    </>
  )
}

export default function ShipmentMap({ focusId = null }: ShipmentMapProps) {
  const [activeShipments, setActiveShipments] = useState<any[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const sid = typeof window !== "undefined" ? localStorage.getItem("supplier_id") : null

  useEffect(() => {
    if (!sid) return
    async function loadShipments() {
      try {
        const { data } = await supabase.from("shipments").select("*").eq("status", "In Transit").or(`owner_id.eq.${sid},buyer_owner_id.eq.${sid}`)
        setActiveShipments(data || [])
      } catch (err) {
        console.error("Supabase fetch error:", err)
      }
    }
    loadShipments()
  }, [sid])

  return (
    <div className={
      isFullscreen
        ? "fixed inset-0 z-9999 bg-[#05080f] p-4 flex flex-col"
        : "w-full h-[280px] lg:h-[500px] bg-[#111827] rounded-xl p-3 border border-[#1F2937] shadow-sm relative z-0"
    }>
      <div className="absolute top-6 right-6 z-10000">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-[#F9FAFB] p-2 rounded-lg shadow-lg flex items-center justify-center transition-all"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          )}
        </button>
      </div>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: isFullscreen ? "1rem" : "0.75rem",
          background: '#111827',
          zIndex: 1,
          flex: isFullscreen ? 1 : 'none'
        }}
      >
        <MapResizer isFullscreen={isFullscreen} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {activeShipments.map((s) => (
          <SingleShipmentRoute key={s.id} id={s.id} name={s.name} isOutgoing={s.owner_id === sid} oLat={s.origin_lat} oLng={s.origin_lng} dLat={s.dest_lat} dLng={s.dest_lng} startTime={s.start_time} weatherCondition={s.weather_condition || "Clear"} isFocused={s.id === focusId} />
        ))}
      </MapContainer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .leaflet-popup-content-wrapper { background: #111827 !important; border: 1px solid #1F2937; border-radius: 0.75rem !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: #111827 !important; border: 1px solid #1F2937; }
        .leaflet-control-zoom { border: 1px solid #374151 !important; border-radius: 8px !important; overflow: hidden; margin-top: 16px !important; margin-left: 16px !important;}
        .leaflet-control-zoom a { background: #1F2937 !important; color: #F9FAFB !important; border-bottom: 1px solid #374151 !important; }
        .leaflet-control-zoom a:hover { background: #374151 !important; }
      `}} />
    </div>
  )
}