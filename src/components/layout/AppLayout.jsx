import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: "#0b0e13", color: "#f1f5f9" }}>
      <Sidebar />
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}