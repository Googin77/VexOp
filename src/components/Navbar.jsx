import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Define your color palette
const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9a",
  platinum: "#d9d9d9",
  logoutPink: "#e94e77",
};

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
    { label: "Home", path: "/client" },
    { label: "Projects", path: "/client/projects" },
    { label: "Quote Calculator", path: "/client/quotecalculator" },
    { label: "Invoices", path: "/client/invoices" },
    { label: "CRM", path: "/client/crm" },
    { label: "Metrics", path: "/client/metrics" },
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
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 3rem",
          borderBottom: `2px solid ${colors.richBlack}`,
          backgroundColor: colors.richBlack,  // solid background, no gradient
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: colors.platinum,
          position: "relative",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          zIndex: 1100,
        }}
      >
       {/* Prominent Logo Only */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    margin: 0,
    lineHeight: 0,
  }}
  onClick={() => navigate("/client")}
  aria-label="Go to Home"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") navigate("/client");
  }}
>
  <img
    src="/zoomedlogo.png"
    alt="VexOp+ Logo"
    style={{
      height: "100px",
      width: "auto",
      objectFit: "contain",
      display: "block",
    }}
  />
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
              backgroundColor: colors.platinum,
              color: colors.yinmnBlue,
              padding: "0.6rem 1.2rem",
              fontSize: "1.1rem",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: `0 2px 8px ${colors.yinmnBlue}66`,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              userSelect: "none",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.silverLakeBlue)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.platinum)}
            aria-label="Open navigation drawer"
          >
            Navigate <span style={{ fontSize: "0.8rem" }}>▶</span>
          </button>
<button
  onClick={onLogout}
  style={{
    backgroundColor: colors.richBlack,      // dark background
    border: "none",
    padding: "0.6rem 1.3rem",
    borderRadius: "6px",
    color: colors.platinum,                  // light text
    fontWeight: "600",
    fontSize: "1.1rem",
    cursor: "pointer",
    boxShadow: `0 2px 8px ${colors.richBlack}cc`,
    userSelect: "none",
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = colors.oxfordBlue;  // slightly lighter dark on hover
    e.currentTarget.style.boxShadow = "0 5px 15px rgba(27,38,59,0.7)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = colors.richBlack;
    e.currentTarget.style.boxShadow = `0 2px 8px ${colors.richBlack}cc`;
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
          backgroundColor: colors.platinum,
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
            color: colors.yinmnBlue,
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
                color: colors.yinmnBlue,
                fontWeight: "900",
                borderRadius: "6px",
                userSelect: "none",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.silverLakeBlue)}
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
    backgroundColor: colors.richBlack,      // dark background
    border: "none",
    padding: "0.8rem 1.3rem",
    borderRadius: "8px",
    color: colors.platinum,                  // light text
    fontWeight: "700",
    fontSize: "1.1rem",
    cursor: "pointer",
    boxShadow: `0 3px 10px ${colors.richBlack}cc`,
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
    userSelect: "none",
    width: "100%",
    alignSelf: "center",
  }}
  onMouseOver={(e) => {
    e.target.style.backgroundColor = colors.oxfordBlue;  // lighter dark on hover
    e.target.style.boxShadow = "0 5px 15px rgba(27,38,59,0.7)";
  }}
  onMouseOut={(e) => {
    e.target.style.backgroundColor = colors.richBlack;
    e.target.style.boxShadow = `0 3px 10px ${colors.richBlack}cc`;
  }}
  aria-label="Logout"
>
  Logout
</button>

      </aside>
    </>
  );
}
