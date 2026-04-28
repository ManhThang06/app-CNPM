import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

import { Icon } from "../../components/UI";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ─── Giữ nguyên resize handler ─── */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="app-layout">
      {/* ─── Desktop Sidebar ─── */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* ─── Mobile Sidebar overlay ─── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
        className="md:hidden"
      >
        {/* Slide-in sidebar */}
        <div
          style={{
            width: 260,
            height: "100vh",
            background: "var(--surface-container-lowest)",
            boxShadow: "4px 0 32px rgba(25,28,30,0.15)",
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
          }}
        >
          <Sidebar />
        </div>

        {/* Backdrop */}
        <div
          style={{
            flex: 1,
            background: "rgba(25,28,30,0.4)",
            opacity: mobileOpen ? 1 : 0,
            transition: "opacity 0.25s ease",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        />
      </div>

      {/* ─── Main area ─── */}
      <main className="main-content" style={{ display: "flex", flexDirection: "column" }}>
        {/* Mobile hamburger */}
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 100,
          }}
        >
          <button
            className="btn btn-secondary"
            style={{ padding: 8, borderRadius: 8, boxShadow: "0 2px 8px rgba(25,28,30,0.1)" }}
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
