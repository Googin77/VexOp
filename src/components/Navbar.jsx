import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  // Close drawer if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drawerOpen]);

  const menuItems = [
    { label: "🏠 Home", path: "/client" },
    { label: "📁 Projects", path: "/client/projects" },
    { label: "🧾 Invoices", path: "/client/invoices" },
    { label: "👥 HR Docs", path: "/client/hrdocuments" },
    { label: "📇 CRM", path: "/client/crm" },
    { label: "📊 Metrics", path: "/client/metrics" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between", // Logo left, buttons right
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "2px solid #4A90E2",
          background: "linear-gradient(90deg, #4A90E2, #357ABD)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#fff",
          position: "relative",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          zIndex: 1100,
        }}
      >
        {/* Logo + Text */}
        <div
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => navigate("/client")}
          aria-label="Go to Home"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/client");
          }}
        >
          {/* SVG Logo */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginRight: "10px" }}
          >
            <rect x="12" y="20" width="8" height="24" fill="#357ABD" />
            <rect x="28" y="12" width="8" height="32" fill="#2A5D9F" />
            <rect x="44" y="28" width="8" height="16" fill="#1E4473" />
            <polygon
              points="0,44 64,44 64,52 0,52"
              fill="#357ABD"
              opacity="0.7"
            />
            <rect x="18" y="14" width="2" height="6" fill="#A4C2F4" />
            <rect x="34" y="18" width="2" height="6" fill="#A4C2F4" />
            <rect x="50" y="32" width="2" height="6" fill="#A4C2F4" />
          </svg>
          <span
            style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              color: "#fff",
              userSelect: "none",
            }}
          >
            BuildOps
          </span>
        </div>

        {/* Buttons container with flex */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              backgroundColor: "#fff",
              color: "#357ABD",
              padding: "0.6rem 1.2rem",
              fontSize: "1.1rem",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(53,122,189,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              userSelect: "none",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e6f0fa")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            aria-label="Open navigation drawer"
          >
            Navigate <span style={{ fontSize: "0.8rem" }}>▶</span>
          </button>

          <button
            onClick={onLogout}
            style={{
              backgroundColor: "#e94e77",
              border: "none",
              padding: "0.6rem 1.3rem",
              borderRadius: "6px",
              color: "#fff",
              fontWeight: "600",
              fontSize: "1.1rem",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(233,78,119,0.4)",
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
              userSelect: "none",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#d93f68";
              e.target.style.boxShadow = "0 5px 15px rgba(217,63,104,0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#e94e77";
              e.target.style.boxShadow = "0 3px 8px rgba(233,78,119,0.4)";
            }}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Sliding Drawer */}
      <aside
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "25vw",
          maxWidth: "320px",
          backgroundColor: "#fff",
          boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          zIndex: 1200,
          display: "flex",
          flexDirection: "column",
          padding: "2rem 1.5rem",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
        aria-hidden={!drawerOpen}
      >
        {/* Close Button */}
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            fontSize: "1.8rem",
            cursor: "pointer",
            color: "#357ABD",
            marginBottom: "2rem",
            userSelect: "none",
          }}
          aria-label="Close navigation drawer"
        >
          ×
        </button>

        {/* Menu Items */}
        <nav style={{ flexGrow: 1 }}>
          {menuItems.map(({ label, path }) => (
            <div
              key={path}
              onClick={() => handleNavigate(path)}
              style={{
                padding: "1rem 1rem",
                marginBottom: "0.5rem",
                cursor: "pointer",
                color: "#357ABD",
                fontWeight: "600",
                borderRadius: "6px",
                userSelect: "none",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e6f0fa")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              role="menuitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleNavigate(path);
                }
              }}
            >
              {label}
            </div>
          ))}
        </nav>

        {/* Logout button at bottom */}
        <button
          onClick={onLogout}
          style={{
            marginTop: "auto",
            backgroundColor: "#e94e77",
            border: "none",
            padding: "0.8rem 1.3rem",
            borderRadius: "8px",
            color: "#fff",
            fontWeight: "700",
            fontSize: "1.1rem",
            cursor: "pointer",
            boxShadow: "0 3px 10px rgba(233,78,119,0.5)",
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            userSelect: "none",
            width: "100%",
            alignSelf: "center",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#d93f68";
            e.target.style.boxShadow = "0 5px 15px rgba(217,63,104,0.7)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#e94e77";
            e.target.style.boxShadow = "0 3px 10px rgba(233,78,119,0.5)";
          }}
          aria-label="Logout"
        >
          Logout
        </button>
      </aside>
    </>
  );
}
    