import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, LayoutDashboard, ArrowLeftRight, Landmark, Target, Bot, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { path: "/Setup", label: "Setup", icon: Settings },
  { path: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/Transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/NetWorth", label: "Net Worth", icon: Landmark },
  { path: "/Goals", label: "Goals", icon: Target },
  { path: "/AIAdvisor", label: "AI Advisor", icon: Bot },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{ background: "#0b0e13", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#4ade80" }}>
            <span className="text-sm font-bold" style={{ color: "#0b0e13" }}>B</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Budget Lab</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2" style={{ color: "#94a3b8" }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-56 flex flex-col transition-transform duration-300
          lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#0b0e13", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="h-16 flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#4ade80" }}>
            <span className="text-sm font-bold" style={{ color: "#0b0e13" }}>B</span>
          </div>
          <span className="font-semibold" style={{ color: "#f1f5f9" }}>Budget Lab</span>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "rgba(74,222,128,0.1)" : "transparent",
                  color: active ? "#4ade80" : "#94a3b8",
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 text-xs" style={{ color: "#64748b" }}>
          v2.0 · Madrid, ES
        </div>
      </aside>
    </>
  );
}