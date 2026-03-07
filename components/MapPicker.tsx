"use client"
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

export default function MapPicker({ position, setPosition }: { position: [number, number], setPosition: (p: [number, number]) => void }) {
  function LocationMarker() {
    useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]) } })
    return position === null ? null : <Marker position={position} icon={customIcon} />
  }

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border-2 border-gray-200 z-0 relative text-black">
      <MapContainer center={position} zoom={10} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
      </MapContainer>
    </div>
  )
}