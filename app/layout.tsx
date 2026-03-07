"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import "./globals.css"

// Custom SVG Icons to avoid dependency installation issues
const Icons = {
  // ... your existing icons ...
  Command: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  Inventory: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Fleet: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Trust: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Forecast: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Logout: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  // 🔥 NEW ICONS:
  Heatmap: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  Procurement: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Simulation: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [supplierName, setSupplierName] = useState("")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const sid = localStorage.getItem("supplier_id")
    const sname = localStorage.getItem("supplier_name")

    if (sid) {
      setIsLoggedIn(true)
      setSupplierName(sname || "Operator")
      if (pathname === "/login" || pathname === "/") router.replace("/dashboard")
    } else {
      setIsLoggedIn(false)
      if (pathname !== "/login" && pathname !== "/") router.replace("/login")
    }
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    router.replace("/login")
  }

  return (
    <html lang="en">
      <body className="text-slate-900 font-sans selection:bg-cyan-500/30 selection:text-cyan-900 antialiased bg-[#0b0f19]">
        {!mounted ? (
          <div className="h-screen w-full bg-[#0b0f19] flex flex-col items-center justify-center font-black">
             <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
             <p className="text-cyan-500/50 mt-6 tracking-[0.4em] uppercase text-xs animate-pulse">Initializing Protocol</p>
          </div>
        ) : (
          <>
            {!isLoggedIn || pathname === "/login" ? (
              <div className="w-full min-h-screen bg-[#0b0f19]">
                {children}
              </div>
            ) : (
              <div className="flex h-screen overflow-hidden">
                
                {/* CYBER-SLATE SIDEBAR */}
                <aside className="w-72 bg-[#05080f] text-slate-300 flex flex-col h-screen border-r border-white/5 relative z-40">
                  <div className="absolute top-0 left-0 w-full h-40 bg-cyan-900/10 blur-[80px] pointer-events-none"></div>
                  
                  <div className="p-8 relative z-10 flex-1 overflow-y-auto no-scrollbar">
                    <h1 className="text-3xl font-black tracking-tighter mb-12 text-center uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-500">
                      ZYPHER
                    </h1>
                    
                    <div className="mb-10 px-2">
                      <p className="text-[10px] text-cyan-500/70 font-black uppercase tracking-widest mb-2">Active Node</p>
                      <p className="font-bold text-sm text-slate-200 truncate">{supplierName}</p>
                    </div>
                    
                    <nav className="flex flex-col space-y-2">
                      {[
                        { name: "Command Center", href: "/dashboard", icon: Icons.Command },
    { name: "Inventory Matrix", href: "/inventory", icon: Icons.Inventory },
    { name: "Fleet Satellites", href: "/shipments", icon: Icons.Fleet },
    { name: "Partner Trust", href: "/suppliers", icon: Icons.Trust },
    { name: "Prophet AI", href: "/forecast", icon: Icons.Forecast },
    // 🔥 NEW ROUTES:
    { name: "Demand Heatmap", href: "/heatmap", icon: Icons.Heatmap },
    { name: "Auto-Procurement", href: "/procurement", icon: Icons.Procurement },
    { name: "War Room Sim", href: "/simulation", icon: Icons.Simulation },
  ].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-medium group ${
                              isActive 
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]" 
                                : "hover:bg-white/5 hover:text-slate-100"
                            }`}
                          >
                            <span className={`${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>{item.icon}</span> 
                            {item.name}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                  
                  <div className="p-6 border-t border-white/5 relative z-10 bg-[#05080f]">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Built by</span>
                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">RoarX</span>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-3 rounded-xl transition-all duration-300 font-bold text-xs border border-rose-500/10 group">
                      <span className="text-rose-500/70 group-hover:text-rose-400">{Icons.Logout}</span> Terminate Session
                    </button>
                  </div>
                </aside>
                
                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto bg-[#0b0f19] relative">
                    <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-cyan-900/10 blur-[120px] pointer-events-none rounded-full"></div>
                    <div className="p-8 lg:p-12 max-w-(--突破-7xl) mx-auto min-h-full relative z-10">
                      {children}
                    </div>
                </main>
              </div>
            )}
          </>
        )}
      </body>
    </html>
  )
}