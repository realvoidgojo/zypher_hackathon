"use client"

import dynamic from 'next/dynamic'
import { useEffect, useState } from "react"
import { supabase } from "@/services/supabaseClient"

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

// Custom Enterprise SVGs
const Icons = {
  Plus: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
}

export default function InventoryTable() {
  const [inventory, setInventory] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([]) 
  const [adjustAmount, setAdjustAmount] = useState<Record<string, number>>({})
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [isNewWarehouse, setIsNewWarehouse] = useState(true) 
  const [selectedWhId, setSelectedWhId] = useState("")
  const [whName, setWhName] = useState("")
  const [prodName, setProdName] = useState("")
  const [initialQty, setInitialQty] = useState("10")
  const [position, setPosition] = useState<[number, number]>([13.0827, 80.2707])

  const supplierId = typeof window !== 'undefined' ? localStorage.getItem("supplier_id") : null

  useEffect(() => {
    fetchInventory()
    fetchWarehouses()

    const sub = supabase.channel('live-inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory()
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [supplierId])

  async function fetchInventory() {
    if (!supplierId) return
    const { data } = await supabase
      .from("inventory")
      .select(`id, stock_quantity, reorder_level, products:product_id(name), warehouses:warehouse_id(name)`)
      .eq('owner_id', supplierId)
      .order('id', { ascending: true })
    setInventory(data || [])
  }

  async function fetchWarehouses() {
    if (!supplierId) return
    const { data } = await supabase.from("warehouses").select("id, name").eq('owner_id', supplierId)
    setWarehouses(data || [])
    if (data && data.length > 0) setIsNewWarehouse(false) 
  }

  async function handleAddNewEntry() {
    if (!supplierId || !prodName) return alert("Please fill required product details.")
    if (isNewWarehouse && !whName) return alert("Please provide a name for the new warehouse.")
    if (!isNewWarehouse && !selectedWhId) return alert("Please select an existing warehouse.")
    
    setLoading(true)
    try {
      let activeWarehouseId = selectedWhId;
      if (isNewWarehouse) {
        const { data: wh, error: whErr } = await supabase.from('warehouses').insert({
          name: whName, latitude: position[0], longitude: position[1], owner_id: supplierId
        }).select().single()
        if (whErr) throw whErr
        activeWarehouseId = wh.id;
      }

      const { data: prod, error: prodErr } = await supabase.from('products').insert({
        name: prodName, owner_id: supplierId
      }).select().single()
      if (prodErr) throw prodErr

      const { error: invErr } = await supabase.from('inventory').insert({
        product_id: prod.id, warehouse_id: activeWarehouseId, stock_quantity: parseInt(initialQty), 
        owner_id: supplierId, reorder_level: 10
      })
      if (invErr) throw invErr

      setShowAddModal(false)
      setWhName(""); setProdName(""); setInitialQty("10");
      fetchInventory()
      fetchWarehouses() 
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function adjustStock(id: string, currentStock: number, isAddition: boolean) {
    const amountToChange = adjustAmount[id] || 1
    const change = isAddition ? amountToChange : -amountToChange
    const newStock = Math.max(0, currentStock + change)

    setInventory(prev => prev.map(item => item.id === id ? { ...item, stock_quantity: newStock } : item))

    const { error } = await supabase.from("inventory").update({ stock_quantity: newStock }).eq("id", id)
    if (!error) {
      setAdjustAmount((prev) => ({ ...prev, [id]: 1 }))
      fetchInventory()
    } else {
      alert("Failed to update stock.");
      fetchInventory() 
    }
  }

  const handleAmountChange = (id: string, value: string) => {
    const num = parseInt(value)
    setAdjustAmount((prev) => ({ ...prev, [id]: isNaN(num) ? '' : num } as any))
  }

  async function handleDeleteStock(id: string) {
    if (!confirm("Are you sure you want to purge this depleted asset?")) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) fetchInventory();
  }

  return (
    <div className="bg-[#0f1423] p-8 lg:p-10 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 blur-[80px] pointer-events-none rounded-full"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
        <div>
          <h2 className="text-2xl font-light text-white tracking-wide">Live Inventory Management</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Asset Allocation & Status</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-[#0b0f19] transition-all border border-cyan-500/20 active:scale-95 shadow-lg shadow-cyan-500/10"
        >
          {Icons.Plus} Add New Stock
        </button>
      </div>

      {/* NEW STOCK MODAL - DARK MODE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#0f1423] p-8 rounded-[2rem] max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto border border-white/10 animate-fade-in-up">
            <h3 className="text-xl font-light mb-1 text-white">Initialize New Asset</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-6">Configuration Terminal</p>
            
            <div className="space-y-5">
              <div className="flex bg-[#161b2a] p-1 rounded-xl border border-white/5">
                <button onClick={() => setIsNewWarehouse(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isNewWarehouse ? 'bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>Existing Node</button>
                <button onClick={() => setIsNewWarehouse(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isNewWarehouse ? 'bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>New Node</button>
              </div>

              {isNewWarehouse ? (
                <div className="space-y-4 border-l-2 border-cyan-500/50 pl-4 py-2">
                  <input placeholder="New Node Designation" value={whName} onChange={(e) => setWhName(e.target.value)} className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500/50 outline-none transition-all text-sm font-medium" />
                  <div className="rounded-xl overflow-hidden border border-white/5">
                      <MapPicker position={position} setPosition={setPosition} />
                  </div>
                </div>
              ) : (
                <div className="border-l-2 border-indigo-500/50 pl-4 py-2">
                  <select value={selectedWhId} onChange={(e) => setSelectedWhId(e.target.value)} className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-xl text-white outline-none focus:border-indigo-500/50 transition-all text-sm font-medium appearance-none">
                    <option value="" className="text-slate-500">-- Select Hub Location --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-5 border-t border-white/5">
                <input placeholder="Asset Nomenclature (e.g. Server Rack)" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500/50 outline-none transition-all text-sm font-medium mb-4" />
                <input type="number" placeholder="Initial Capacity" value={initialQty} onChange={e => setInitialQty(e.target.value)} className="w-full p-4 bg-[#161b2a] border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500/50 outline-none transition-all text-sm font-medium" />
              </div>
              
              <div className="flex gap-3 pt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 p-3.5 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-all text-xs uppercase tracking-widest">Abort</button>
                <button onClick={handleAddNewEntry} disabled={loading} className="flex-1 p-3.5 bg-cyan-600 hover:bg-cyan-500 text-[#0b0f19] rounded-xl font-black transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] text-xs uppercase tracking-widest disabled:opacity-50">
                    {loading ? "Processing..." : "Deploy Asset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE VIEW - DARK MODE */}
      <div className="w-full overflow-x-auto relative z-10">
        <table className="w-full table-fixed text-left border-separate border-spacing-y-3 min-w-[800px]">
          <thead>
            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="w-[30%] px-6 pb-2">Asset / Product</th>
              <th className="w-[25%] pb-2">Storage Node</th>
              <th className="w-[15%] text-center pb-2">Volume</th>
              <th className="w-[15%] text-center pb-2">Adjust</th>
              <th className="w-[15%] text-right px-6 pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const isZero = item.stock_quantity === 0
              const isLow = !isZero && item.stock_quantity < item.reorder_level
              const amount = adjustAmount[item.id] !== undefined ? adjustAmount[item.id] : 1
              
              return (
                <tr key={item.id} className={`bg-[#161b2a] border border-white/5 hover:bg-[#1e2436] transition-colors duration-300 group ${isZero ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                  <td className="p-5 rounded-l-[1.5rem]">
                    <p className="font-medium text-slate-200 text-base truncate group-hover:text-cyan-400 transition-colors">{item.products?.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">Verified Payload</p>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-medium text-slate-400 truncate">{item.warehouses?.name}</p>
                  </td>
                  
                  <td className="p-5 text-center">
                      <span className={`text-xl font-light ${isZero ? 'text-rose-500' : 'text-white'}`}>
                        {item.stock_quantity}
                      </span>
                  </td>
                  
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-1 bg-[#0f1423] rounded-xl p-1 w-max mx-auto border border-white/5 shadow-inner">
                      <button onClick={() => adjustStock(item.id, item.stock_quantity, false)} disabled={isZero} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#161b2a] text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-white/5 font-bold disabled:opacity-30 transition-all">-</button>
                      <input type="number" min="1" value={amount} onChange={(e) => handleAmountChange(item.id, e.target.value)} className="w-12 text-center font-semibold bg-transparent focus:outline-none text-slate-300 text-sm" />
                      <button onClick={() => adjustStock(item.id, item.stock_quantity, true)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#161b2a] text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/5 font-bold transition-all">+</button>
                    </div>
                  </td>
                  
                  {/* 🔥 THE FIX: Single elegant Purge button for 0 stock */}
                  <td className="p-5 text-right rounded-r-[1.5rem] pr-6">
                    <div className="flex items-center justify-end">
                        {isZero ? (
                            <button 
                                onClick={() => handleDeleteStock(item.id)} 
                                className="flex items-center gap-2 text-rose-500 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-all border border-rose-500/20"
                                title="Purge Empty Record"
                            >
                                <span className="text-[9px] font-black uppercase tracking-widest">Purge</span>
                                {Icons.Trash}
                            </button>
                        ) : isLow ? (
                            <span className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)] animate-pulse">Critical</span>
                        ) : (
                            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 shadow-sm">Optimal</span>
                        )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}