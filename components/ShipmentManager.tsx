"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"
import dynamic from 'next/dynamic'
import { getRoute } from "@/services/routingService"

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

const Icons = {
  Plus: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Satellite: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/></svg>,
  Pilot: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Close: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Network: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  External: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Profit: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  RouteInfo: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Weather: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M12 12v9"/></svg>,
  Check: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}

function getDriverAndTransitDetails(shipment: any) {
  const drivers = ["Rajesh Kumar", "Murugan", "Senthil Nathan", "Amit Singh", "Vikram Reddy"];
  const trucks = ["TN 09 BX 1234", "KA 01 MH 8899", "MH 12 AB 4567", "DL 1C AA 1111", "TS 08 XY 9999"];
  const index = shipment.id.charCodeAt(0) % drivers.length;
  const isDelivered = shipment.status === 'Delivered';
  const isInterstate = Math.abs(shipment.origin_lat - shipment.dest_lat) > 1.5;

  return {
    driverName: drivers[index],
    truckNumber: trucks[index],
    checkpoints: [
      { status: "Asset Dispatched", time: "Logged", completed: true },
      { status: isInterstate ? "Border Clearance" : "District Verification", time: "Verified", completed: true },
      { status: "Terminal Entry", time: isDelivered ? "Docked" : "In Transit", completed: isDelivered }
    ]
  }
}

export default function ShipmentManager() {
  const [shipments, setShipments] = useState<any[]>([])
  const [myInventory, setMyInventory] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null) 

  // Receiving Logic State
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0])
  const [arrivalTime, setArrivalTime] = useState(new Date().toTimeString().slice(0, 5))

  const [dispatchType, setDispatchType] = useState<'network' | 'external'>('network')
  const [networkSuppliers, setNetworkSuppliers] = useState<any[]>([])
  const [selectedNetSupplier, setSelectedNetSupplier] = useState("")
  const [supplierWarehouses, setSupplierWarehouses] = useState<any[]>([])
  const [selectedTargetWarehouse, setSelectedTargetWarehouse] = useState("")

  const [selectedInvId, setSelectedInvId] = useState("")
  const [dispatchQty, setDispatchQty] = useState(1)
  const [buyerName, setBuyerName] = useState("") 
  const [destPos, setDestPos] = useState<[number, number]>([12.9716, 77.5946])

  const [previewData, setPreviewData] = useState<{distance: string, duration: string, profit: string, weather: string} | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const supplierId = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null

  useEffect(() => { 
    if (supplierId) {
      fetchShipments()
      fetchInventory()
      fetchNetworkSuppliers()
    }
  }, [supplierId])

  useEffect(() => {
    let timer: NodeJS.Timeout;
    async function analyzeRoute() {
        if (!selectedInvId || !destPos) {
            setPreviewData(null);
            return;
        }
        setIsAnalyzing(true);
        try {
            const selectedItem = myInventory.find(i => i.id === selectedInvId);
            if(!selectedItem) return;
            const oLat = selectedItem.warehouses.latitude;
            const oLng = selectedItem.warehouses.longitude;
            const routeInfo = await getRoute(oLat, oLng, destPos[0], destPos[1], dispatchQty);
            const latDiff = Math.abs(oLat - destPos[0]);
            let weather = "Clear";
            if (latDiff > 2 && latDiff <= 5) weather = "Rain";
            if (latDiff > 5) weather = "Storm";
            setPreviewData({
                distance: routeInfo.distance,
                duration: routeInfo.duration,
                profit: routeInfo.profitEstimate,
                weather: weather
            });
        } catch(e) { console.error(e) } finally { setIsAnalyzing(false) }
    }
    timer = setTimeout(() => analyzeRoute(), 800);
    return () => clearTimeout(timer);
  }, [selectedInvId, destPos, dispatchQty, myInventory])

  async function fetchNetworkSuppliers() {
    const { data } = await supabase.from('suppliers').select('owner_id, name').neq('owner_id', supplierId)
    setNetworkSuppliers(data || [])
  }

  useEffect(() => {
    if (selectedNetSupplier) {
      supabase.from('warehouses').select('id, name, latitude, longitude').eq('owner_id', selectedNetSupplier).then(({data}) => {
        setSupplierWarehouses(data || [])
        setSelectedTargetWarehouse("") 
      })
    } else { setSupplierWarehouses([]) }
  }, [selectedNetSupplier])

  useEffect(() => {
    if (selectedTargetWarehouse && dispatchType === 'network') {
      const wh = supplierWarehouses.find(w => w.id === selectedTargetWarehouse)
      if (wh && wh.latitude && wh.longitude) setDestPos([wh.latitude, wh.longitude])
    }
  }, [selectedTargetWarehouse, supplierWarehouses, dispatchType])

  async function fetchShipments() {
    const { data } = await supabase.from("shipments").select("*").or(`owner_id.eq.${supplierId},buyer_owner_id.eq.${supplierId}`).order('created_at', { ascending: false })
    setShipments(data || [])
  }

  async function fetchInventory() {
    const { data } = await supabase.from("inventory").select(`id, stock_quantity, products(name), warehouses(name, latitude, longitude)`).eq('owner_id', supplierId).gt('stock_quantity', 0)
    setMyInventory(data || [])
  }

  async function handleCreateShipment() {
    if (!selectedInvId || dispatchQty < 1) { alert("Select payload."); return; }
    let finalBuyerId: string | null = null;
    let finalBuyerName = "";
    if (dispatchType === 'network') {
        if (!selectedNetSupplier || !selectedTargetWarehouse) { alert("Target required."); return; }
        finalBuyerId = selectedNetSupplier;
        const sName = networkSuppliers.find(s => s.owner_id === selectedNetSupplier)?.name || "Partner";
        const wName = supplierWarehouses.find(w => w.id === selectedTargetWarehouse)?.name || "Hub";
        finalBuyerName = `${sName} (${wName})`;
    } else {
        if (!buyerName.trim()) { alert("Receiver required."); return; }
        finalBuyerId = null; 
        finalBuyerName = `[EXT] ${buyerName}`;
    }
    setLoading(true);
    try {
        const selectedItem = myInventory.find(i => i.id === selectedInvId);
        if (!selectedItem) throw new Error("Invalid item");
        const oLat = selectedItem.warehouses.latitude;
        const oLng = selectedItem.warehouses.longitude;
        const itemName = selectedItem.products.name;
        const routeData = await getRoute(oLat, oLng, destPos[0], destPos[1], dispatchQty);
        const durationMin = parseInt(routeData.duration || "120");
        const estimatedDelivery = new Date(Date.now() + durationMin * 60000).toISOString();
        const { error } = await supabase.from('shipments').insert({
            name: `Dispatch: ${itemName}`,
            product_name: itemName,
            owner_id: supplierId,
            buyer_owner_id: finalBuyerId,
            buyer_name: finalBuyerName,
            status: 'In Transit',
            origin_lat: oLat, origin_lng: oLng, dest_lat: destPos[0], dest_lng: destPos[1],
            start_time: new Date().toISOString(),
            estimated_delivery_time: estimatedDelivery,
            weather_condition: previewData?.weather || "Clear",
            quantity: dispatchQty
        });
        if (error) throw error;
        const newStock = selectedItem.stock_quantity - dispatchQty;
        await supabase.from('inventory').update({ stock_quantity: newStock }).eq('id', selectedInvId);
        setShowForm(false); setBuyerName(""); setDispatchQty(1); setSelectedInvId(""); setPreviewData(null); fetchShipments(); 
    } catch (err: any) { alert(err.message) } finally { setLoading(false) }
  }

  // 🔥 UPDATED ARRIVAL HANDLER WITH CUSTOM TIME 🔥
  async function handleConfirmArrival(shipmentId: string) {
    setProcessingId(shipmentId);
    try {
        const fullArrivalTime = new Date(`${arrivalDate}T${arrivalTime}`).toISOString();
        const { error } = await supabase
            .from('shipments')
            .update({ status: 'Delivered', end_time: fullArrivalTime })
            .eq('id', shipmentId);
        if (error) throw error;
        fetchShipments();
    } catch (err: any) { alert(err.message) } finally { setProcessingId(null) }
  }

  return (
    <div className="bg-[#0f1423] shadow-2xl rounded-[3rem] p-10 border border-cyan-500/10 text-slate-200 mt-10 relative overflow-hidden">
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-900/10 blur-[100px] pointer-events-none rounded-full"></div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 relative z-10">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight">Dispatch Control</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Manual Override & Mission Creation</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 ${showForm ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-cyan-600 hover:bg-cyan-500 text-[#05080f]'}`}>
          {showForm ? Icons.Close : Icons.Plus} {showForm ? "Abort Mission" : "New Dispatch"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#161b2a] rounded-[2rem] p-8 mb-12 border border-white/5 animate-fade-in-up relative z-10 shadow-inner">
          <div className="flex bg-[#0f1423] p-1.5 rounded-2xl border border-white/5 mb-8 max-w-md mx-auto">
              <button onClick={() => setDispatchType('network')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${dispatchType === 'network' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>{Icons.Network} Network Node</button>
              <button onClick={() => setDispatchType('external')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${dispatchType === 'external' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>{Icons.External} 3rd Party</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                      <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest ml-1">Payload Source</label>
                      <select value={selectedInvId} onChange={(e) => setSelectedInvId(e.target.value)} className="w-full p-4 bg-[#0f1423] border border-white/5 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all text-sm font-medium appearance-none">
                        <option value="">-- Select Local Asset --</option>
                        {myInventory.map(i => <option key={i.id} value={i.id}>{i.products?.name} (Qty: {i.stock_quantity})</option>)}
                      </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest ml-1">Volume</label>
                      <input type="number" min="1" value={dispatchQty} onChange={(e) => setDispatchQty(parseInt(e.target.value) || 1)} className="w-full p-4 bg-[#0f1423] border border-white/5 rounded-xl text-white focus:border-cyan-500/50 outline-none text-sm font-medium" />
                  </div>
              </div>

              {dispatchType === 'network' ? (
                  <div className="space-y-4 p-5 rounded-2xl bg-[#0f1423]/50 border border-cyan-500/20">
                      <div className="space-y-1.5"><label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest ml-1">Target Supplier</label><select value={selectedNetSupplier} onChange={(e) => setSelectedNetSupplier(e.target.value)} className="w-full p-4 bg-[#0f1423] border border-white/5 rounded-xl text-white outline-none focus:border-cyan-500/50 text-sm font-medium appearance-none"><option value="">-- Select Partner --</option>{networkSuppliers.map(s => <option key={s.owner_id} value={s.owner_id}>{s.name}</option>)}</select></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest ml-1">Target Node</label><select value={selectedTargetWarehouse} onChange={(e) => setSelectedTargetWarehouse(e.target.value)} disabled={!selectedNetSupplier} className="w-full p-4 bg-[#0f1423] border border-white/5 rounded-xl text-white outline-none focus:border-cyan-500/50 text-sm font-medium appearance-none disabled:opacity-50"><option value="">-- Select Hub --</option>{supplierWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                  </div>
              ) : (
                  <div className="space-y-1.5 p-5 rounded-2xl bg-[#0f1423]/50 border border-indigo-500/20"><label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest ml-1">External Receiver</label><input type="text" placeholder="e.g. Apex Industrial Solutions" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full p-4 bg-[#0f1423] border border-white/5 rounded-xl text-white focus:border-indigo-500/50 outline-none text-sm font-medium placeholder-slate-600" /></div>
              )}

              <div className="p-4 rounded-xl border border-white/5 bg-[#0f1423] shadow-inner relative min-h-[100px] flex items-center justify-center">
                  {!selectedInvId ? (<p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Awaiting Input...</p>) : isAnalyzing ? (<div className="flex items-center gap-3 text-cyan-500/70"><div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div><span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyzing...</span></div>) : previewData ? (
                      <div className="w-full grid grid-cols-3 gap-4 text-center animate-fade-in"><div className="space-y-1"><p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">{Icons.RouteInfo} Log</p><p className="text-sm font-light text-slate-200">{previewData.distance} km</p></div><div className="space-y-1 border-x border-white/5"><p className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">{Icons.Profit} Margin</p><p className="text-sm font-bold text-emerald-400">₹{previewData.profit}</p></div><div className="space-y-1"><p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">{Icons.Weather} Radar</p><p className={`text-sm font-bold ${previewData.weather === 'Clear' ? 'text-cyan-400' : 'text-rose-400'}`}>{previewData.weather}</p></div></div>
                  ) : null}
              </div>
              <button onClick={handleCreateShipment} disabled={loading || isAnalyzing || !previewData} className="w-full bg-cyan-600 hover:bg-cyan-500 text-[#0b0f19] p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">{loading ? "Processing..." : "Initialize Trajectory"}</button>
            </div>
            <div className="space-y-1.5 flex flex-col"><label className="text-[9px] font-bold uppercase tracking-widest ml-1 text-cyan-500">Target Coordinates</label><div className="flex-1 rounded-xl overflow-hidden border-2 border-white/5 min-h-[300px] shadow-inner"><MapPicker position={destPos} setPosition={setDestPos} /></div></div>
          </div>
        </div>
      )}

      {/* TABLE DATA */}
      <div className="w-full overflow-x-auto custom-scrollbar relative z-10">
        <table className="w-full text-left border-separate border-spacing-y-3 min-w-[800px]">
          <thead><tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"><th className="w-[45%] px-6 pb-2">Mission / ID</th><th className="w-[20%] text-center pb-2">Payload</th><th className="w-[20%] text-center pb-2">Status</th><th className="w-[15%] text-right px-6 pb-2">Telemetry</th></tr></thead>
          <tbody>
            {shipments.map((s) => {
              const details = getDriverAndTransitDetails(s);
              const isMoving = s.status === 'In Transit';
              const isDelivered = s.status === 'Delivered';
              
              // 🔥 LIVE DELTA CALCULATION 🔥
              const userArrivalDate = new Date(`${arrivalDate}T${arrivalTime}`);
              const estimatedDate = new Date(s.estimated_delivery_time);
              const isLate = userArrivalDate > estimatedDate;

              return (
                <React.Fragment key={s.id}>
                  <tr className={`bg-[#161b2a] border border-cyan-500/5 hover:border-cyan-500/20 transition-all duration-300 group ${isDelivered ? 'opacity-60' : ''}`}>
                    <td className="p-6 rounded-l-[1.5rem]"><p className="font-medium text-slate-200 text-base truncate group-hover:text-cyan-400 transition-colors">{s.name}</p><div className="flex items-center gap-3 mt-1.5"><span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ID: {s.id.split('-')[0]}</span><span className="w-1 h-1 bg-slate-600 rounded-full"></span><span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider truncate max-w-[200px]">{s.buyer_name}</span></div></td>
                    <td className="p-6 text-center font-medium text-slate-300 text-base">{s.quantity} <span className="text-[9px] text-slate-500 uppercase ml-1">Units</span></td>
                    <td className="p-6 text-center">{isMoving ? (<div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span><span className="text-[9px] font-bold uppercase tracking-widest">In Orbit</span></div>) : (<div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20"><span className="text-[9px] font-bold uppercase tracking-widest">Docked</span></div>)}</td>
                    <td className="p-6 text-right rounded-r-[1.5rem]"><button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="bg-[#0f1423] text-slate-400 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-cyan-500 hover:text-[#0f1423] transition-all border border-cyan-500/10 ml-auto shadow-md">{expandedId === s.id ? Icons.Close : Icons.Satellite}</button></td>
                  </tr>
                  {expandedId === s.id && (
                    <tr className="animate-fade-in"><td colSpan={4} className="py-2"><div className="bg-[#05080f] rounded-[2rem] p-8 text-white flex flex-col border border-cyan-500/10 shadow-inner">
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1 space-y-4"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Pilot</p><div className="flex items-center gap-5"><div className="w-12 h-12 rounded-xl bg-[#161b2a] flex items-center justify-center text-slate-400 border border-cyan-500/10">{Icons.Pilot}</div><div><p className="font-light text-xl text-slate-200">{details.driverName}</p><p className="text-xs text-indigo-400 font-bold mt-1">{details.truckNumber}</p></div></div></div>
                            <div className="flex-1 space-y-5 md:border-l border-cyan-500/10 md:pl-10"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trajectory Log</p><div className="space-y-4">
                                    {details.checkpoints.map((cp, i) => (<div key={i} className="flex items-center justify-between group"><div className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${cp.completed ? 'bg-cyan-500' : 'bg-slate-700'}`}></div><span className="text-xs font-medium text-slate-300">{cp.status}</span></div><span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 text-cyan-400">{cp.time}</span></div>))}
                            </div></div>
                        </div>
                        {isMoving && (
                            <div className="mt-8 pt-6 border-t border-cyan-500/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-4">Arrival Receival Protocol</p>
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[9px] text-slate-500 uppercase font-black ml-1">Arrival Date</label>
                                                <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} className="w-full p-3 bg-[#0f1423] border border-white/5 rounded-xl text-white text-xs outline-none focus:border-cyan-500/50" />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[9px] text-slate-500 uppercase font-black ml-1">Arrival Time</label>
                                                <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="w-full p-3 bg-[#0f1423] border border-white/5 rounded-xl text-white text-xs outline-none focus:border-cyan-500/50" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <div className="mb-4">
                                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Network Synchronization Status</p>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isLate ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                System Delta: {isLate ? 'Delayed' : 'On Time'}
                                            </span>
                                        </div>
                                        <button onClick={() => handleConfirmArrival(s.id)} disabled={processingId === s.id} className="bg-emerald-600 hover:bg-emerald-500 text-[#0b0f19] px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 ml-auto">
                                            {processingId === s.id ? "Verifying..." : (<>{Icons.Check} Confirm Docking & Arrival</>)}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div></td></tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}