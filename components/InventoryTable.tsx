"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

// Custom Enterprise SVGs
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
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: (
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

export default function InventoryTable() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [adjustAmount, setAdjustAmount] = useState<Record<string, number>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isNewWarehouse, setIsNewWarehouse] = useState(true);
  const [selectedWhId, setSelectedWhId] = useState("");
  const [whName, setWhName] = useState("");
  const [prodName, setProdName] = useState("");
  const [initialQty, setInitialQty] = useState("10");
  const [position, setPosition] = useState<[number, number]>([
    13.0827, 80.2707,
  ]);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const supplierId =
    typeof window !== "undefined" ? localStorage.getItem("supplier_id") : null;

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();

    const sub = supabase
      .channel("live-inventory")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        () => {
          fetchInventory();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [supplierId]);

  async function fetchInventory() {
    if (!supplierId) return;
    const { data } = await supabase
      .from("inventory")
      .select(
        `id, stock_quantity, reorder_level, products:product_id(name), warehouses:warehouse_id(name)`,
      )
      .eq("owner_id", supplierId)
      .order("id", { ascending: true });
    setInventory(data || []);
  }

  async function fetchWarehouses() {
    if (!supplierId) return;
    const { data } = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("owner_id", supplierId);
    setWarehouses(data || []);
    if (data && data.length > 0) setIsNewWarehouse(false);
  }

  async function handleAddNewEntry() {
    if (!supplierId || !prodName)
      return alert("Please fill required product details.");
    if (isNewWarehouse && !whName)
      return alert("Please provide a name for the new warehouse.");
    if (!isNewWarehouse && !selectedWhId)
      return alert("Please select an existing warehouse.");

    setLoading(true);
    try {
      let activeWarehouseId = selectedWhId;
      if (isNewWarehouse) {
        const { data: wh, error: whErr } = await supabase
          .from("warehouses")
          .insert({
            name: whName,
            latitude: position[0],
            longitude: position[1],
            owner_id: supplierId,
          })
          .select()
          .single();
        if (whErr) throw whErr;
        activeWarehouseId = wh.id;
      }

      const { data: prod, error: prodErr } = await supabase
        .from("products")
        .insert({
          name: prodName,
          owner_id: supplierId,
        })
        .select()
        .single();
      if (prodErr) throw prodErr;

      const { error: invErr } = await supabase.from("inventory").insert({
        product_id: prod.id,
        warehouse_id: activeWarehouseId,
        stock_quantity: parseInt(initialQty),
        owner_id: supplierId,
        reorder_level: 10,
      });
      if (invErr) throw invErr;

      setShowAddModal(false);
      setMapFullscreen(false);
      setWhName("");
      setProdName("");
      setInitialQty("10");
      fetchInventory();
      fetchWarehouses();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function adjustStock(
    id: string,
    currentStock: number,
    isAddition: boolean,
  ) {
    const amountToChange = adjustAmount[id] || 1;
    const change = isAddition ? amountToChange : -amountToChange;
    const newStock = Math.max(0, currentStock + change);

    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock_quantity: newStock } : item,
      ),
    );

    const { error } = await supabase
      .from("inventory")
      .update({ stock_quantity: newStock })
      .eq("id", id);
    if (!error) {
      setAdjustAmount((prev) => ({ ...prev, [id]: 1 }));
      fetchInventory();
    } else {
      alert("Failed to update stock.");
      fetchInventory();
    }
  }

  const handleAmountChange = (id: string, value: string) => {
    const num = parseInt(value);
    setAdjustAmount(
      (prev) => ({ ...prev, [id]: isNaN(num) ? "" : num }) as any,
    );
  };

  async function handleDeleteStock(id: string) {
    if (!confirm("Are you sure you want to purge this depleted asset?")) return;
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (!error) fetchInventory();
  }

  return (
    <div className="bg-[#111827] p-8 lg:p-10 rounded-[2rem] border border-[#1F2937] shadow-sm relative overflow-hidden animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
        <div>
          <h2 className="text-xl font-medium text-[#F9FAFB]">Inventory</h2>
          <p className="text-sm font-medium text-[#9CA3AF] mt-1">
            Manage and track your products.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1F2937] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-all border border-[#374151] active:scale-95 shadow-sm"
        >
          {Icons.Plus} Add Stock
        </button>
      </div>

      {/* NEW STOCK MODAL - DARK MODE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0B0F14]/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#111827] p-8 rounded-[2rem] max-w-md w-full shadow-[0_1px_2px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto border border-[#1F2937] animate-fade-in-up">
            <h3 className="text-lg font-medium text-[#F9FAFB] mb-1">
              Add Stock
            </h3>
            <p className="text-sm font-medium text-[#9CA3AF] mb-6">
              Configure details for your new inventory item.
            </p>

            <div className="space-y-5">
              <div className="flex bg-[#111827] p-1 rounded-xl border border-[#1F2937]">
                <button
                  onClick={() => setIsNewWarehouse(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isNewWarehouse ? "bg-[#3B82F6] text-white shadow-sm border border-[#3B82F6]" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Existing Warehouse
                </button>
                <button
                  onClick={() => setIsNewWarehouse(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isNewWarehouse ? "bg-[#3B82F6] text-white shadow-sm border border-[#3B82F6]" : "text-slate-500 hover:text-slate-300"}`}
                >
                  New Warehouse
                </button>
              </div>

              {isNewWarehouse ? (
                <div className="space-y-4 border-l-2 border-cyan-500/50 pl-4 py-2">
                  <input
                    placeholder="Warehouse Name"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    className="w-full p-4 bg-[#111827] border border-[#1F2937] rounded-xl text-white placeholder-slate-500 focus:border-[#3B82F6] outline-none transition-all text-sm font-medium"
                  />
                  <div
                    className={`${
                      mapFullscreen
                        ? "fixed inset-0 z-[100] p-0"
                        : "rounded-xl overflow-hidden border border-white/5 relative h-[200px]"
                    } transition-all duration-300`}
                  >
                    <div
                      className={`relative w-full ${mapFullscreen ? "h-full" : "h-full"}`}
                    >
                      <MapPicker
                        position={position}
                        setPosition={setPosition}
                        isFullscreen={mapFullscreen}
                      />
                      <button
                        type="button"
                        onClick={() => setMapFullscreen((f) => !f)}
                        className="absolute top-3 right-3 z-[1000] bg-[#111827]/90 hover:bg-[#1F2937] border border-[#374151] text-white p-2 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:scale-105 active:scale-95"
                        title={
                          mapFullscreen ? "Exit fullscreen" : "Fullscreen map"
                        }
                      >
                        {mapFullscreen ? (
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
                            <polyline points="4 14 10 14 10 20" />
                            <polyline points="20 10 14 10 14 4" />
                            <line x1="14" y1="10" x2="21" y2="3" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        ) : (
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
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        )}
                      </button>
                      {mapFullscreen && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#111827]/90 backdrop-blur-sm border border-[#374151] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
                          Click on the map to set warehouse location
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-l-2 border-indigo-500/50 pl-4 py-2">
                  <select
                    value={selectedWhId}
                    onChange={(e) => setSelectedWhId(e.target.value)}
                    className="w-full p-4 bg-[#111827] border border-[#1F2937] rounded-xl text-white outline-none focus:border-[#3B82F6] transition-all text-sm font-medium appearance-none"
                  >
                    <option value="" className="text-slate-500">
                      -- Select Warehouse --
                    </option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-5 border-t border-[#1F2937]">
                <input
                  placeholder="Product Name (e.g. MacBook Pro)"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full p-4 bg-[#111827] border border-[#1F2937] rounded-xl text-white placeholder-slate-500 focus:border-[#3B82F6] outline-none transition-all text-sm font-medium mb-4"
                />
                <input
                  type="number"
                  placeholder="Initial Quantity"
                  value={initialQty}
                  onChange={(e) => setInitialQty(e.target.value)}
                  className="w-full p-4 bg-[#111827] border border-[#1F2937] rounded-xl text-white placeholder-slate-500 focus:border-[#3B82F6] outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-[#1F2937] rounded-xl font-medium text-[#9CA3AF] hover:bg-[#1F2937] transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewEntry}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-semibold transition-all shadow-sm text-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE VIEW - Desktop */}
      <div className="hidden lg:block w-full overflow-x-auto relative z-10">
        <table className="w-full table-fixed text-left border-separate border-spacing-y-3 min-w-[800px]">
          <thead>
            <tr className="text-xs font-semibold text-[#9CA3AF] border-b border-[#1F2937]">
              <th className="w-[30%] px-6 pb-2">Product</th>
              <th className="w-[25%] pb-2">Warehouse</th>
              <th className="w-[15%] text-center pb-2">Quantity</th>
              <th className="w-[15%] text-center pb-2">Manage</th>
              <th className="w-[15%] text-right px-6 pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const isZero = item.stock_quantity === 0;
              const isLow = !isZero && item.stock_quantity < item.reorder_level;
              const amount =
                adjustAmount[item.id] !== undefined ? adjustAmount[item.id] : 1;

              return (
                <tr
                  key={item.id}
                  className={`bg-[#161b2a] border border-white/5 hover:bg-[#1e2436] transition-colors duration-300 group ${isZero ? "opacity-50 grayscale-[0.5]" : ""}`}
                >
                  <td className="p-5 rounded-l-3xl">
                    <p className="font-medium text-[#F9FAFB] text-sm truncate">
                      {item.products?.name}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">Managed Item</p>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-medium text-slate-400 truncate">
                      {item.warehouses?.name}
                    </p>
                  </td>

                  <td className="p-5 text-center">
                    <span
                      className={`text-xl font-light ${isZero ? "text-rose-500" : "text-white"}`}
                    >
                      {item.stock_quantity}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="flex items-center justify-center gap-1 bg-[#111827] rounded-lg p-1 w-max mx-auto border border-[#1F2937]">
                      <button
                        onClick={() =>
                          adjustStock(item.id, item.stock_quantity, false)
                        }
                        disabled={isZero}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F2937] text-white opacity-80 hover:opacity-100 font-bold disabled:opacity-30 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) =>
                          handleAmountChange(item.id, e.target.value)
                        }
                        className="w-12 text-center font-medium bg-transparent focus:outline-none text-[#F9FAFB] text-sm"
                      />
                      <button
                        onClick={() =>
                          adjustStock(item.id, item.stock_quantity, true)
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F2937] text-white opacity-80 hover:opacity-100 font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* 🔥 THE FIX: Single elegant Purge button for 0 stock */}
                  <td className="p-5 text-right rounded-r-3xl pr-6">
                    <div className="flex items-center justify-end">
                      {isZero ? (
                        <button
                          onClick={() => handleDeleteStock(item.id)}
                          className="flex items-center gap-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 bg-transparent rounded-lg transition-all border border-rose-500/20"
                          title="Purge Empty Record"
                        >
                          <span className="text-xs font-semibold">Delete</span>
                          {Icons.Trash}
                        </button>
                      ) : isLow ? (
                        <span className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/20">
                          Critical
                        </span>
                      ) : (
                        <span className="bg-[#1F2937] text-[#10B981] px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#374151] shadow-sm">
                          Optimal
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CARD VIEW - Mobile */}
      <div className="lg:hidden w-full flex flex-col gap-4 relative z-10 mt-6 pt-4 border-t border-[#1F2937]">
        {inventory.map((item) => {
          const isZero = item.stock_quantity === 0;
          const isLow = !isZero && item.stock_quantity < item.reorder_level;
          const amount =
            adjustAmount[item.id] !== undefined ? adjustAmount[item.id] : 1;

          return (
            <div
              key={item.id}
              className={`bg-[#161b2a] border border-white/5 hover:bg-[#1e2436] rounded-3xl p-5 flex flex-col gap-4 shadow-sm transition-colors duration-300 ${isZero ? "opacity-50 grayscale-[0.5]" : ""}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#F9FAFB] text-base truncate pr-2">
                    {item.products?.name}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1 truncate">
                    {item.warehouses?.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-2xl font-light ${isZero ? "text-rose-500" : "text-white"}`}
                  >
                    {item.stock_quantity}
                  </span>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider font-semibold">
                    In Stock
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
                <div className="flex items-center gap-1.5 bg-[#111827] rounded-xl p-1.5 border border-[#1F2937]">
                  <button
                    onClick={() =>
                      adjustStock(item.id, item.stock_quantity, false)
                    }
                    disabled={isZero}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F2937] text-white opacity-80 hover:opacity-100 font-bold disabled:opacity-30 transition-all shadow-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) =>
                      handleAmountChange(item.id, e.target.value)
                    }
                    className="w-10 text-center font-bold bg-transparent focus:outline-none text-[#F9FAFB] text-sm"
                  />
                  <button
                    onClick={() =>
                      adjustStock(item.id, item.stock_quantity, true)
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1F2937] text-white opacity-80 hover:opacity-100 font-bold transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>

                <div>
                  {isZero ? (
                    <button
                      onClick={() => handleDeleteStock(item.id)}
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-xl transition-all border border-rose-500/20 shadow-sm"
                    >
                      <span className="text-xs font-semibold">Purge</span>
                      {Icons.Trash}
                    </button>
                  ) : isLow ? (
                    <span className="bg-rose-500/10 text-rose-400 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/20 shadow-sm">
                      Critical
                    </span>
                  ) : (
                    <span className="bg-[#1F2937] text-[#10B981] px-3 py-2 rounded-xl text-xs font-semibold border border-[#374151] shadow-sm">
                      Optimal
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
