"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import dynamic from "next/dynamic";
import { getRoute } from "@/services/routingService";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

const Icons = {
  Plus: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Satellite: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M13 7 9 3 5 7l4 4" />
      <path d="m17 11 4 4-4 4-4-4" />
      <path d="m8 12 4 4 6-6-4-4Z" />
    </svg>
  ),
  Pilot: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Close: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Network: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  External: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Profit: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  RouteInfo: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Weather: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
      <path d="M12 12v9" />
    </svg>
  ),
  Check: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

function getDriverAndTransitDetails(shipment: any) {
  const isDelivered = shipment.status === "Delivered";
  const isInterstate =
    shipment.origin_lat && shipment.dest_lat
      ? Math.abs(shipment.origin_lat - shipment.dest_lat) > 1.5
      : false;

  return {
    driverName: shipment.driver_name || "Unassigned",
    truckNumber: shipment.truck_number || "—",
    driverPhone: shipment.driver_phone || "",
    checkpoints: [
      {
        status: "Asset Dispatched",
        time: shipment.start_time
          ? new Date(shipment.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Logged",
        completed: true,
      },
      {
        status: isInterstate ? "Border Clearance" : "District Verification",
        time: "Verified",
        completed: true,
      },
      {
        status: "Terminal Entry",
        time: isDelivered
          ? shipment.end_time
            ? new Date(shipment.end_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Docked"
          : "In Transit",
        completed: isDelivered,
      },
    ],
  };
}

export default function ShipmentManager() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Receiving Logic State
  const [arrivalDate, setArrivalDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [arrivalTime, setArrivalTime] = useState(
    new Date().toTimeString().slice(0, 5),
  );

  const [dispatchType, setDispatchType] = useState<"network" | "external">(
    "network",
  );
  const [networkSuppliers, setNetworkSuppliers] = useState<any[]>([]);
  const [selectedNetSupplier, setSelectedNetSupplier] = useState("");
  const [supplierWarehouses, setSupplierWarehouses] = useState<any[]>([]);
  const [selectedTargetWarehouse, setSelectedTargetWarehouse] = useState("");

  const [selectedInvId, setSelectedInvId] = useState("");
  const [dispatchQty, setDispatchQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [destPos, setDestPos] = useState<[number, number] | null>(null);

  const [previewData, setPreviewData] = useState<{
    distance: string;
    duration: string;
    profit: string;
    weather: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const router = useRouter();
  const supplierId =
    typeof window !== "undefined" ? localStorage.getItem("supplier_id") : null;

  useEffect(() => {
    if (supplierId) {
      fetchShipments();
      fetchInventory();
      fetchNetworkSuppliers();
    }
  }, [supplierId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    async function analyzeRoute() {
      if (!selectedInvId || !destPos) {
        setPreviewData(null);
        return;
      }
      setIsAnalyzing(true);
      try {
        const selectedItem = myInventory.find((i) => i.id === selectedInvId);
        if (!selectedItem) return;
        const oLat = selectedItem.warehouses.latitude;
        const oLng = selectedItem.warehouses.longitude;
        const routeInfo = await getRoute(
          oLat,
          oLng,
          destPos[0],
          destPos[1],
          dispatchQty,
        );
        // Fetch real weather at destination from OpenWeatherMap
        let weather = "Clear";
        try {
          const wxKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
          if (wxKey) {
            const wxRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${destPos[0]}&lon=${destPos[1]}&appid=${wxKey}`,
            );
            if (wxRes.ok) {
              const wxData = await wxRes.json();
              const main = wxData.weather?.[0]?.main?.toLowerCase() || "";
              if (
                main.includes("thunder") ||
                main.includes("tornado") ||
                main.includes("squall")
              )
                weather = "Storm";
              else if (main.includes("rain") || main.includes("drizzle"))
                weather = "Rain";
              else if (main.includes("snow") || main.includes("sleet"))
                weather = "Snow";
              else if (main.includes("cloud")) weather = "Cloudy";
              else if (
                main.includes("mist") ||
                main.includes("fog") ||
                main.includes("haze")
              )
                weather = "Fog";
              else weather = "Clear";
            }
          }
        } catch {
          /* fallback to Clear */
        }
        setPreviewData({
          distance: routeInfo.distance,
          duration: routeInfo.duration,
          profit: routeInfo.profitEstimate,
          weather: weather,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsAnalyzing(false);
      }
    }
    timer = setTimeout(() => analyzeRoute(), 800);
    return () => clearTimeout(timer);
  }, [selectedInvId, destPos, dispatchQty, myInventory]);

  async function fetchNetworkSuppliers() {
    const { data } = await supabase
      .from("suppliers")
      .select("owner_id, name")
      .neq("owner_id", supplierId);
    setNetworkSuppliers(data || []);
  }

  useEffect(() => {
    if (selectedNetSupplier) {
      supabase
        .from("warehouses")
        .select("id, name, latitude, longitude")
        .eq("owner_id", selectedNetSupplier)
        .then(({ data }) => {
          setSupplierWarehouses(data || []);
          setSelectedTargetWarehouse("");
        });
    } else {
      setSupplierWarehouses([]);
    }
  }, [selectedNetSupplier]);

  useEffect(() => {
    if (selectedTargetWarehouse && dispatchType === "network") {
      const wh = supplierWarehouses.find(
        (w) => w.id === selectedTargetWarehouse,
      );
      if (wh && wh.latitude && wh.longitude)
        setDestPos([wh.latitude, wh.longitude]);
    }
  }, [selectedTargetWarehouse, supplierWarehouses, dispatchType]);

  async function fetchShipments() {
    const { data } = await supabase
      .from("shipments")
      .select("*")
      .or(`owner_id.eq.${supplierId},buyer_owner_id.eq.${supplierId}`)
      .order("created_at", { ascending: false });
    setShipments(data || []);
  }

  async function fetchInventory() {
    const { data } = await supabase
      .from("inventory")
      .select(
        `id, stock_quantity, products(name), warehouses(name, latitude, longitude)`,
      )
      .eq("owner_id", supplierId)
      .gt("stock_quantity", 0);
    setMyInventory(data || []);
  }

  async function handleCreateShipment() {
    if (!selectedInvId || dispatchQty < 1) {
      alert("Select payload.");
      return;
    }
    if (!destPos) {
      alert("Please select a target destination on the map.");
      return;
    }

    let finalBuyerId: string | null = null;
    let finalBuyerName = "";
    if (dispatchType === "network") {
      if (!selectedNetSupplier || !selectedTargetWarehouse) {
        alert("Target required.");
        return;
      }
      finalBuyerId = selectedNetSupplier;
      const sName =
        networkSuppliers.find((s) => s.owner_id === selectedNetSupplier)
          ?.name || "Partner";
      const wName =
        supplierWarehouses.find((w) => w.id === selectedTargetWarehouse)
          ?.name || "Hub";
      finalBuyerName = `${sName} (${wName})`;
    } else {
      if (!buyerName.trim()) {
        alert("Receiver required.");
        return;
      }
      finalBuyerId = null;
      finalBuyerName = `[EXT] ${buyerName}`;
    }
    setLoading(true);
    try {
      const selectedItem = myInventory.find((i) => i.id === selectedInvId);
      if (!selectedItem) throw new Error("Invalid item");
      const oLat = selectedItem.warehouses.latitude;
      const oLng = selectedItem.warehouses.longitude;
      const itemName = selectedItem.products.name;
      const routeData = await getRoute(
        oLat,
        oLng,
        destPos[0],
        destPos[1],
        dispatchQty,
      );
      const durationMin = parseInt(routeData.duration || "120");
      const estimatedDelivery = new Date(
        Date.now() + durationMin * 60000,
      ).toISOString();
      // Generate driver details for this shipment
      const driverNames = [
        "Rajesh Kumar",
        "Murugan S",
        "Senthil Nathan",
        "Amit Singh",
        "Vikram Reddy",
      ];
      const truckPlates = [
        "TN 09 BX 1234",
        "KA 01 MH 8899",
        "MH 12 AB 4567",
        "DL 1C AA 1111",
        "TS 08 XY 9999",
      ];
      const dIdx = Math.floor(Math.random() * driverNames.length);
      const { error } = await supabase.from("shipments").insert({
        name: `Dispatch: ${itemName}`,
        product_name: itemName,
        owner_id: supplierId,
        buyer_owner_id: finalBuyerId,
        buyer_name: finalBuyerName,
        status: "In Transit",
        origin_lat: oLat,
        origin_lng: oLng,
        dest_lat: destPos[0],
        dest_lng: destPos[1],
        start_time: new Date().toISOString(),
        estimated_delivery_time: estimatedDelivery,
        weather_condition: previewData?.weather || "Clear",
        quantity: dispatchQty,
        driver_name: driverNames[dIdx],
        driver_phone: `+91${9876500000 + Math.floor(Math.random() * 100000)}`,
        truck_number: truckPlates[dIdx],
      });
      if (error) throw error;
      const newStock = selectedItem.stock_quantity - dispatchQty;
      await supabase
        .from("inventory")
        .update({ stock_quantity: newStock })
        .eq("id", selectedInvId);
      setShowForm(false);
      setBuyerName("");
      setDispatchQty(1);
      setSelectedInvId("");
      setPreviewData(null);
      fetchShipments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔥 UPDATED ARRIVAL HANDLER WITH CUSTOM TIME 🔥
  async function handleConfirmArrival(shipmentId: string) {
    setProcessingId(shipmentId);
    try {
      const fullArrivalTime = new Date(
        `${arrivalDate}T${arrivalTime}`,
      ).toISOString();
      const { error } = await supabase
        .from("shipments")
        .update({ status: "Delivered", end_time: fullArrivalTime })
        .eq("id", shipmentId);
      if (error) throw error;
      fetchShipments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="bg-[#111827] shadow-sm rounded-3xl md:rounded-[3rem] p-6 text-slate-200 mt-6 md:mt-10 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 relative z-10">
        <div>
          <h2 className="text-xl font-medium text-[#F9FAFB]">
            Shipment Control
          </h2>
          <p className="text-sm font-medium text-[#9CA3AF] mt-1">
            Create and manage your outgoing shipments.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm active:scale-95 border ${showForm ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-[#1F2937] text-white hover:bg-[#374151] border-[#374151]"}`}
        >
          {showForm ? Icons.Close : Icons.Plus}{" "}
          {showForm ? "Cancel" : "New Shipment"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111827] rounded-3xl p-5 md:p-8 mb-8 md:mb-12 border border-[#1F2937] animate-fade-in-up relative z-10 shadow-sm">
          <div className="flex bg-[#111827] p-1 rounded-xl border border-[#1F2937] mb-6 md:mb-8 max-w-md mx-auto">
            <button
              onClick={() => setDispatchType("network")}
              className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 md:gap-2 ${dispatchType === "network" ? "bg-[#3B82F6] text-white shadow-sm border border-[#3B82F6]" : "text-[#9CA3AF] hover:text-[#F9FAFB]"}`}
            >
              {Icons.Network} Network Partner
            </button>
            <button
              onClick={() => setDispatchType("external")}
              className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 md:gap-2 ${dispatchType === "external" ? "bg-[#3B82F6] text-white shadow-sm border border-[#3B82F6]" : "text-[#9CA3AF] hover:text-[#F9FAFB]"}`}
            >
              {Icons.External} 3rd Party
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#9CA3AF] ml-1">
                    Product Source
                  </label>
                  <select
                    value={selectedInvId}
                    onChange={(e) => setSelectedInvId(e.target.value)}
                    className="w-full p-2.5 md:p-3 bg-[#111827] border border-[#1F2937] rounded-xl text-white outline-none focus:border-[#3B82F6] transition-all text-xs md:text-sm font-medium appearance-none"
                  >
                    <option value="">-- Select Local Product --</option>
                    {myInventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.products?.name} (Qty: {i.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#9CA3AF] ml-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dispatchQty}
                    onChange={(e) =>
                      setDispatchQty(parseInt(e.target.value) || 1)
                    }
                    className="w-full p-2.5 md:p-3 bg-[#111827] border border-[#1F2937] rounded-xl text-white focus:border-[#3B82F6] outline-none text-xs md:text-sm font-medium"
                  />
                </div>
              </div>

              {dispatchType === "network" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:p-5 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-[#3B82F6] ml-1">
                      Target Supplier
                    </label>
                    <select
                      value={selectedNetSupplier}
                      onChange={(e) => setSelectedNetSupplier(e.target.value)}
                      className="w-full p-2.5 md:p-3 bg-[#1F2937] border border-[#374151] rounded-lg text-white outline-none focus:border-[#3B82F6] text-xs md:text-sm font-medium appearance-none"
                    >
                      <option value="">-- Select Partner --</option>
                      {networkSuppliers.map((s) => (
                        <option key={s.owner_id} value={s.owner_id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold text-[#3B82F6] ml-1">
                      Target Warehouse
                    </label>
                    <select
                      value={selectedTargetWarehouse}
                      onChange={(e) =>
                        setSelectedTargetWarehouse(e.target.value)
                      }
                      disabled={!selectedNetSupplier}
                      className="w-full p-2.5 md:p-3 bg-[#1F2937] border border-[#374151] rounded-lg text-white outline-none focus:border-[#3B82F6] text-xs md:text-sm font-medium appearance-none disabled:opacity-50"
                    >
                      <option value="">-- Select Warehouse --</option>
                      {supplierWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 p-4 md:p-5 rounded-xl bg-[#111827] border border-[#1F2937]">
                  <label className="text-[10px] md:text-xs font-semibold text-[#8B5CF6] ml-1">
                    External Receiver
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Industrial Solutions"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full p-2.5 md:p-3 bg-[#1F2937] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] outline-none text-xs md:text-sm font-medium placeholder-slate-400"
                  />
                </div>
              )}

              <div className="p-4 rounded-xl border border-[#1F2937] bg-[#111827] relative min-h-[100px] flex items-center justify-center">
                {!selectedInvId ? (
                  <p className="text-xs font-medium text-[#9CA3AF]">
                    Select source payload to estimate delivery Details
                  </p>
                ) : isAnalyzing ? (
                  <div className="flex items-center gap-3 text-[#3B82F6]">
                    <div className="w-4 h-4 border-2 border-[#1F2937] border-t-[#3B82F6] rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold animate-pulse">
                      Calculating route...
                    </span>
                  </div>
                ) : previewData ? (
                  <div className="w-full grid grid-cols-3 gap-4 text-center animate-fade-in">
                    <div className="space-y-1">
                      <p className="text-xs text-[#9CA3AF] font-semibold flex items-center justify-center gap-1.5">
                        {Icons.RouteInfo} Distance
                      </p>
                      <p className="text-sm font-medium text-[#F9FAFB]">
                        {previewData.distance} km
                      </p>
                    </div>
                    <div className="space-y-1 border-x border-[#1F2937]">
                      <p className="text-xs text-[#9CA3AF] font-semibold flex items-center justify-center gap-1.5">
                        {Icons.Profit} Profit
                      </p>
                      <p className="text-sm font-bold text-[#10B981]">
                        ₹{previewData.profit}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[#9CA3AF] font-semibold flex items-center justify-center gap-1.5">
                        {Icons.Weather} Weather
                      </p>
                      <p
                        className={`text-sm font-bold ${previewData.weather === "Clear" ? "text-[#3B82F6]" : "text-rose-400"}`}
                      >
                        {previewData.weather}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                onClick={handleCreateShipment}
                disabled={loading || isAnalyzing || !previewData}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white p-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Create Shipment"}
              </button>
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold ml-1 text-[#3B82F6]">
                Destination Map
              </label>

              {/* Normal inline map with expand button */}
              <div className="flex-1 rounded-xl overflow-hidden border-2 border-[#1F2937] min-h-[300px] shadow-sm relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={() => setMapFullscreen(true)}
                    className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-[#F9FAFB] p-2 rounded-lg shadow-lg flex items-center justify-center transition-all"
                    title="Enter Fullscreen"
                  >
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
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  </button>
                </div>
                <MapPicker
                  position={destPos}
                  setPosition={setDestPos}
                  isFullscreen={false}
                />
              </div>

              {/* FULLSCREEN PORTAL — renders at document.body to escape parent transforms/stacking contexts */}
              {mapFullscreen &&
                typeof document !== "undefined" &&
                createPortal(
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 99999,
                      background: "#05080f",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        zIndex: 100000,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setMapFullscreen(false)}
                        style={{
                          background: "#1F2937",
                          border: "1px solid #374151",
                          color: "#F9FAFB",
                          padding: "8px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Exit Fullscreen"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                      </button>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <MapPicker
                        position={destPos}
                        setPosition={(p) => {
                          setDestPos(p);
                        }}
                        isFullscreen={true}
                      />
                    </div>
                  </div>,
                  document.body,
                )}
            </div>
          </div>
        </div>
      )}

      {/* TABLE DATA - Desktop */}
      <div className="hidden lg:block w-full overflow-x-auto custom-scrollbar relative z-10">
        <table className="w-full text-left border-separate border-spacing-y-3 min-w-[800px]">
          <thead>
            <tr className="text-xs font-semibold text-[#9CA3AF] border-b border-[#1F2937]">
              <th className="w-[45%] px-6 pb-2">Shipment ID</th>
              <th className="w-[20%] text-center pb-2">Product</th>
              <th className="w-[20%] text-center pb-2">Status</th>
              <th className="w-[15%] text-right px-6 pb-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => {
              const details = getDriverAndTransitDetails(s);
              const isMoving = s.status === "In Transit";
              const isDelivered = s.status === "Delivered";

              // 🔥 LIVE DELTA CALCULATION 🔥
              const userArrivalDate = new Date(`${arrivalDate}T${arrivalTime}`);
              const estimatedDate = new Date(s.estimated_delivery_time);
              const isLate = userArrivalDate > estimatedDate;

              return (
                <React.Fragment key={s.id}>
                  <tr
                    className={`bg-[#111827] border border-[#1F2937] hover:border-[#374151] transition-all duration-300 group ${isDelivered ? "opacity-60" : ""}`}
                  >
                    <td className="p-6 rounded-l-3xl">
                      <p className="font-medium text-[#F9FAFB] text-base truncate group-hover:text-[#3B82F6] transition-colors">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-medium text-[#9CA3AF]">
                          ID: {s.id.split("-")[0]}
                        </span>
                        <span className="w-1 h-1 bg-[#4B5563] rounded-full"></span>
                        <span className="text-xs font-medium text-[#8B5CF6] truncate max-w-[200px]">
                          {s.buyer_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center font-medium text-[#D1D5DB] text-base">
                      {s.quantity}{" "}
                      <span className="text-xs text-[#9CA3AF] ml-1">units</span>
                    </td>
                    <td className="p-6 text-center">
                      {isMoving ? (
                        <button
                          onClick={() =>
                            router.push(`/shipments?track=${s.id}`)
                          }
                          className="inline-flex items-center gap-2 bg-[#3B82F6]/10 text-[#3B82F6] px-3 py-1.5 rounded-lg border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]/40 transition-all cursor-pointer active:scale-95"
                          title="Track on map"
                        >
                          <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse"></span>
                          <span className="text-xs font-semibold">
                            In Transit
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="3 11 22 2 13 21 11 13 3 11" />
                          </svg>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-[#10B981]/10 text-[#10B981] px-3 py-1.5 rounded-lg border border-[#10B981]/20">
                          <span className="text-xs font-semibold">
                            Delivered
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-right rounded-r-3xl">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === s.id ? null : s.id)
                        }
                        className="bg-[#1F2937] text-[#D1D5DB] w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#374151] hover:text-white transition-all border border-[#374151] ml-auto shadow-sm"
                      >
                        {expandedId === s.id ? Icons.Close : Icons.RouteInfo}
                      </button>
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr className="animate-fade-in">
                      <td colSpan={4} className="py-2">
                        <div className="bg-[#111827] rounded-3xl p-8 text-white flex flex-col border border-[#1F2937] shadow-sm mt-2 mb-2">
                          <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1 space-y-4">
                              <p className="text-xs font-semibold text-[#9CA3AF]">
                                Driver Details
                              </p>
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-[#1F2937] flex items-center justify-center text-[#9CA3AF] border border-[#374151]">
                                  {Icons.Pilot}
                                </div>
                                <div>
                                  <p className="font-medium text-lg text-[#F9FAFB]">
                                    {details.driverName}
                                  </p>
                                  <p className="text-xs text-[#8B5CF6] font-medium mt-1">
                                    {details.truckNumber}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 space-y-5 md:border-l border-[#1F2937] md:pl-10">
                              <p className="text-xs font-semibold text-[#9CA3AF]">
                                Tracking Log
                              </p>
                              <div className="space-y-4">
                                {details.checkpoints.map((cp, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-2 h-2 rounded-full ${cp.completed ? "bg-[#3B82F6]" : "bg-[#4B5563]"}`}
                                      ></div>
                                      <span className="text-sm font-medium text-[#D1D5DB]">
                                        {cp.status}
                                      </span>
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#1F2937] text-[#9CA3AF]">
                                      {cp.time}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          {isMoving && (
                            <div className="mt-8 pt-6 border-t border-[#1F2937]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                <div className="space-y-4">
                                  <p className="text-xs font-semibold text-[#3B82F6] mb-4">
                                    Confirm Delivery
                                  </p>
                                  <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                      <label className="text-xs text-[#9CA3AF] font-medium ml-1">
                                        Arrival Date
                                      </label>
                                      <input
                                        type="date"
                                        value={arrivalDate}
                                        onChange={(e) =>
                                          setArrivalDate(e.target.value)
                                        }
                                        className="w-full p-2.5 bg-[#1F2937] border border-[#374151] rounded-lg text-white text-sm outline-none focus:border-[#3B82F6]"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                      <label className="text-xs text-[#9CA3AF] font-medium ml-1">
                                        Arrival Time
                                      </label>
                                      <input
                                        type="time"
                                        value={arrivalTime}
                                        onChange={(e) =>
                                          setArrivalTime(e.target.value)
                                        }
                                        className="w-full p-2.5 bg-[#1F2937] border border-[#374151] rounded-lg text-white text-sm outline-none focus:border-[#3B82F6]"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4 text-right">
                                  <div className="mb-4">
                                    <p className="text-xs text-[#9CA3AF] font-medium mb-1">
                                      Delivery Status
                                    </p>
                                    <span
                                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${isLate ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"}`}
                                    >
                                      {isLate ? "Delayed" : "Received On Time"}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleConfirmArrival(s.id)}
                                    disabled={processingId === s.id}
                                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 ml-auto"
                                  >
                                    {processingId === s.id ? (
                                      "Saving..."
                                    ) : (
                                      <>{Icons.Check} Confirm Delivery</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CARD VIEW - Mobile */}
      <div className="lg:hidden w-full flex flex-col gap-4 relative z-10 mt-6 pt-4 border-t border-[#1F2937]">
        {shipments.map((s) => {
          const details = getDriverAndTransitDetails(s);
          const isMoving = s.status === "In Transit";
          const isDelivered = s.status === "Delivered";
          const userArrivalDate = new Date(`${arrivalDate}T${arrivalTime}`);
          const estimatedDate = new Date(s.estimated_delivery_time);
          const isLate = userArrivalDate > estimatedDate;

          return (
            <div
              key={s.id}
              className={`bg-[#161b2a] border border-[#1F2937] rounded-3xl p-5 flex flex-col gap-4 shadow-sm transition-all duration-300 ${isDelivered ? "opacity-60" : ""}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#F9FAFB] text-base truncate pr-2">
                    {s.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-medium text-[#9CA3AF]">
                      ID: {s.id.split("-")[0]}
                    </span>
                    <span className="w-1 h-1 bg-[#4B5563] rounded-full shrink-0"></span>
                    <span className="text-xs font-medium text-[#8B5CF6] truncate max-w-[120px]">
                      {s.buyer_name}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {isMoving ? (
                    <button
                      onClick={() => router.push(`/shipments?track=${s.id}`)}
                      className="inline-flex items-center gap-1.5 bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-1.5 rounded-lg border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]/40 transition-all active:scale-95"
                      title="Track on map"
                    >
                      <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        In Transit
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-[#10B981]/10 text-[#10B981] px-2.5 py-1.5 rounded-lg border border-[#10B981]/20">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        Delivered
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#0B0F14] p-3 rounded-xl border border-[#1F2937]">
                <div>
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase">
                    Product Qty
                  </p>
                  <p className="font-medium text-[#D1D5DB] text-sm mt-0.5">
                    {s.quantity}{" "}
                    <span className="text-[10px] text-[#9CA3AF]">units</span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    setExpandedId(expandedId === s.id ? null : s.id)
                  }
                  className="bg-[#1F2937] text-[#D1D5DB] w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#374151] hover:text-white transition-all border border-[#374151] shadow-sm"
                >
                  {expandedId === s.id ? Icons.Close : Icons.RouteInfo}
                </button>
              </div>

              {expandedId === s.id && (
                <div className="animate-fade-in border-t border-[#1F2937] pt-5 mt-1">
                  <div className="flex flex-col gap-6">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-[#9CA3AF]">
                        Driver Details
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#1F2937] flex items-center justify-center text-[#9CA3AF] border border-[#374151] shrink-0">
                          {Icons.Pilot}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[#F9FAFB] truncate">
                            {details.driverName}
                          </p>
                          <p className="text-[11px] text-[#8B5CF6] font-medium mt-1 truncate">
                            {details.truckNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-[#9CA3AF]">
                        Tracking Log
                      </p>
                      <div className="space-y-3">
                        {details.checkpoints.map((cp, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${cp.completed ? "bg-[#3B82F6]" : "bg-[#4B5563]"}`}
                              ></div>
                              <span className="text-xs font-medium text-[#D1D5DB]">
                                {cp.status}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1F2937] text-[#9CA3AF]">
                              {cp.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isMoving && (
                      <div className="pt-6 border-t border-[#1F2937] flex flex-col gap-5">
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-[#3B82F6]">
                            Confirm Delivery
                          </p>
                          <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] text-[#9CA3AF] font-medium ml-1">
                                Arrival Date
                              </label>
                              <input
                                type="date"
                                value={arrivalDate}
                                onChange={(e) => setArrivalDate(e.target.value)}
                                className="w-full p-2.5 bg-[#1F2937] border border-[#374151] rounded-xl text-white text-xs outline-none focus:border-[#3B82F6]"
                              />
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] text-[#9CA3AF] font-medium ml-1">
                                Arrival Time
                              </label>
                              <input
                                type="time"
                                value={arrivalTime}
                                onChange={(e) => setArrivalTime(e.target.value)}
                                className="w-full p-2.5 bg-[#1F2937] border border-[#374151] rounded-xl text-white text-xs outline-none focus:border-[#3B82F6]"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-[#9CA3AF] font-medium">
                              Delivery Status
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border ${isLate ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"}`}
                            >
                              {isLate ? "Delayed" : "Received On Time"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleConfirmArrival(s.id)}
                            disabled={processingId === s.id}
                            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-3 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                          >
                            {processingId === s.id ? (
                              "Saving..."
                            ) : (
                              <>{Icons.Check} Confirm Delivery</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
