"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  LayoutDashboard,
  Package,
  Truck,
  ShieldCheck,
  TrendingUp,
  Map as MapIcon,
  ShoppingCart,
  Activity,
  LogOut,
  X,
  MoreHorizontal,
  ChevronRight,
  Loader2,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Shipments", href: "/shipments", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Forecast", href: "/forecast", icon: TrendingUp },
];

const moreItems = [
  { name: "Suppliers", href: "/suppliers", icon: ShieldCheck },
  { name: "Heatmap", href: "/heatmap", icon: MapIcon },
  { name: "Procurement", href: "/procurement", icon: ShoppingCart },
  { name: "Simulation", href: "/simulation", icon: Activity },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const sid = localStorage.getItem("supplier_id");
    const sname = localStorage.getItem("supplier_name");
    if (sid) {
      setIsLoggedIn(true);
      setSupplierName(sname || "Operator");
      if (pathname === "/login" || pathname === "/landing" || pathname === "/")
        router.replace("/dashboard");
    } else {
      setIsLoggedIn(false);
      if (pathname !== "/login" && pathname !== "/landing" && pathname !== "/")
        router.replace("/landing");
    }
  }, [pathname, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setDrawerOpen(false);
    router.replace("/login");
  };

  const isMoreActive = moreItems.some((i) => i.href === pathname);

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.className} text-[#F9FAFB] selection:bg-[#3B82F6]/30 selection:text-[#F9FAFB] antialiased bg-[#0B0F14]`}
      >
        {!mounted ? (
          <div className="h-screen w-full bg-[#0B0F14] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          </div>
        ) : (
          <>
            {!isLoggedIn || pathname === "/login" || pathname === "/landing" ? (
              <div className="w-full min-h-screen bg-[#0B0F14]">{children}</div>
            ) : (
              <div className="flex h-screen overflow-hidden bg-[#0B0F14]">
                {/* ─── DESKTOP SIDEBAR (lg+) ─── */}
                <aside className="hidden lg:flex w-60 bg-[#0B0F14] text-[#F9FAFB] flex-col border-r border-[#1F2937] flex-shrink-0">
                  <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                    <h1 className="text-xl font-semibold mb-8 text-[#F9FAFB]">
                      Zypher
                    </h1>
                    <div className="mb-8">
                      <p className="text-xs text-[#9CA3AF] mb-1">Workspace</p>
                      <p className="font-medium text-sm text-[#F9FAFB] truncate">
                        {supplierName}
                      </p>
                    </div>
                    <nav className="flex flex-col space-y-1">
                      {[...navItems, ...moreItems].map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium ${isActive ? "bg-[#111827] text-[#F9FAFB]" : "text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827]/50"}`}
                          >
                            <Icon
                              size={18}
                              className={
                                isActive ? "text-[#F9FAFB]" : "text-[#9CA3AF]"
                              }
                            />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="p-6 border-t border-[#1F2937]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 text-[#9CA3AF] p-2 rounded-md transition-all text-sm font-medium hover:bg-[#111827] hover:text-[#F9FAFB] border border-transparent hover:border-[#374151]"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </aside>

                {/* ─── MAIN CONTENT ─── */}
                <main className="flex-1 overflow-y-auto bg-[#0B0F14] relative">
                  {/* Mobile top bar — just branding, no hamburger */}
                  <div className="lg:hidden sticky top-0 z-30 bg-[#0B0F14]/95 backdrop-blur-sm border-b border-[#1F2937] px-4 h-14 flex items-center justify-between">
                    <h1 className="text-base font-semibold text-[#F9FAFB]">
                      Zypher
                    </h1>
                    <p className="text-xs text-[#9CA3AF] font-medium truncate max-w-[160px]">
                      {supplierName}
                    </p>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto min-h-full pb-24 lg:pb-8">
                    {children}
                  </div>
                </main>

                {/* ─── MOBILE BOTTOM NAV ─── */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F14]/95 backdrop-blur-md border-t border-[#1F2937]">
                  <div className="flex items-stretch h-16">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[56px] ${isActive ? "text-[#3B82F6]" : "text-[#6B7280]"}`}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-medium">
                            {item.name}
                          </span>
                        </Link>
                      );
                    })}
                    {/* MORE button */}
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[56px] ${isMoreActive ? "text-[#3B82F6]" : "text-[#6B7280]"}`}
                    >
                      <MoreHorizontal size={20} />
                      <span className="text-[10px] font-medium">More</span>
                    </button>
                  </div>
                </nav>

                {/* ─── MOBILE SLIDE-IN DRAWER (More) ─── */}
                {drawerOpen && (
                  <>
                    {/* backdrop */}
                    <div
                      className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                      onClick={() => setDrawerOpen(false)}
                    />
                    {/* drawer */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F14] border-t border-[#1F2937] rounded-t-2xl animate-slide-up">
                      {/* handle */}
                      <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-[#374151] rounded-full" />
                      </div>

                      <div className="flex items-center justify-between px-5 pb-3">
                        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                          More
                        </p>
                        <button
                          onClick={() => setDrawerOpen(false)}
                          className="text-[#6B7280] p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="px-4 pb-4 space-y-1">
                        {moreItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${isActive ? "bg-[#111827] text-[#F9FAFB]" : "text-[#9CA3AF] hover:bg-[#111827] hover:text-[#F9FAFB]"}`}
                            >
                              <Icon size={20} />
                              <span className="text-sm font-medium flex-1">
                                {item.name}
                              </span>
                              <ChevronRight
                                size={16}
                                className="text-[#4B5563]"
                              />
                            </Link>
                          );
                        })}
                      </div>

                      {/* sign out */}
                      <div className="px-4 pb-6 pt-2 border-t border-[#1F2937] mt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#EF4444] hover:bg-rose-500/10 transition-all"
                        >
                          <LogOut size={20} />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </body>
    </html>
  );
}
