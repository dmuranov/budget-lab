import React from "react";

export default function StatCard({ title, value, subtitle, color = "#4ade80", icon }) {
  return (
    <div
      className="rounded-xl p-5 transition-all"
      style={{
        background: "#151a22",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
          {title}
        </span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}