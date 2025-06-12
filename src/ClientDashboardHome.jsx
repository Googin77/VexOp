import React from "react";
import { useNavigate } from "react-router-dom";

import ProjectsPreview from "./modules/ProjectsPreview";
import InvoicesPreview from "./modules/InvoicesPreview";
import CRMPreview from "./modules/CRMPreview";
import MetricsPreview from "./modules/MetricsPreview";
import HRDocumentsPreview from "./modules/HRDocumentsPreview";
import Navbar from "./components/Navbar";

export default function ClientDashboardHome({ user, onLogout }) {
  const navigate = useNavigate();
  const company = user?.company;

  // Styles
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3c72, #2a5298)", // deep blue gradient
    color: "#fff",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle = {
    padding: "2rem 3rem",
    borderBottom: "2px solid rgba(255,255,255,0.15)",
    fontWeight: "700",
    fontSize: "2.4rem",
    letterSpacing: "1.2px",
    textShadow: "0 2px 4px rgba(0,0,0,0.35)",
  };

  const mainStyle = {
    flexGrow: 1,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "3rem 2rem",
    gap: "2.5rem",
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "1.5rem 1.5rem 2rem",
    width: "320px",
    minHeight: "240px",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.3), inset 0 0 60px rgba(255, 255, 255, 0.05)",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    color: "#fff",
  };

  const cardHoverStyle = {
    transform: "translateY(-8px)",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.6), inset 0 0 80px rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  };

  // State to track hovered card for styling
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  const cards = [
    { id: "projects", comp: <ProjectsPreview company={company} />, path: "/client/projects" },
    { id: "invoices", comp: <InvoicesPreview company={company} />, path: "/client/invoices" },
    { id: "crm", comp: <CRMPreview company={company} />, path: "/client/crm" },
    { id: "metrics", comp: <MetricsPreview company={company} />, path: "/client/metrics" },
    { id: "hrdocuments", comp: <HRDocumentsPreview company={company} />, path: "/client/hrdocuments" },
  ];

  return (
    <div style={pageStyle}>
      <Navbar onLogout={() => navigate("/login")} />

      <header style={headerStyle}>
        <h1 style={{
  fontSize: "2.5rem",
  fontWeight: "800",
  marginBottom: "1rem",
  color: "#ffffff",
}}>
  {user?.company || "Your Company"}
</h1>

      </header>

      <main style={mainStyle}>
        {cards.map(({ id, comp, path }, index) => (
          <div
            key={id}
            style={{
              ...cardStyle,
              ...(hoveredIndex === index ? cardHoverStyle : {}),
            }}
            onClick={() => navigate(path)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate(path);
              }
            }}
            aria-label={`Go to ${id}`}
          >
            {comp}
          </div>
        ))}
      </main>
    </div>
  );
}
