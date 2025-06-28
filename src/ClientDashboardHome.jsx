// ClientDashboardHome Component
import React, { useContext } from "react"; // Import useContext
import { useNavigate } from "react-router-dom";

import JobsPreview from "./modules/JobsPreview";
import InvoicesPreview from "./modules/InvoicesPreview";
import CRMPreview from "./modules/CRMPreview";
import MetricsPreview from "./modules/MetricsPreview";
import HRDocumentsPreview from "./modules/HRDocumentsPreview";
import Navbar from "./components/Navbar";

import { AuthContext } from "./AuthContext"; // Import the AuthContext


const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9a",
  platinum: "#d9d9d9",
};

export default function ClientDashboardHome() {
  // Remove user prop
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext); // Use the AuthContext to get company
  const company = currentUser?.company;

  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: colors.platinum,
    color: colors.richBlack,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle = {
    padding: "2rem 3rem",
    borderBottom: `2px solid ${colors.silverLakeBlue}`,
    fontWeight: "700",
    fontSize: "2.4rem",
    letterSpacing: "1.2px",
    color: colors.oxfordBlue,
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
    backgroundColor: "rgba(27, 38, 59, 0.05)", // oxfordBlue with low opacity
    borderRadius: "16px",
    padding: "1.5rem 1.5rem 2rem",
    width: "320px",
    height: "320px",
    cursor: "pointer",
    boxShadow: `0 8px 20px rgba(27, 38, 59, 0.12), inset 0 0 60px rgba(27, 38, 59, 0.03)`,
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease, boxShadow 0.3s ease, background-color 0.3s ease",
    color: colors.richBlack,
    border: `1px solid ${colors.silverLakeBlue}`,
  };

  const cardHoverStyle = {
    transform: "translateY(-6px)",
    boxShadow: `0 20px 40px rgba(27, 38, 59, 0.2), inset 0 0 80px rgba(27, 38, 59, 0.05)`,
    backgroundColor: "rgba(27, 38, 59, 0.1)",
  };

  const cards = [
    {
      id: "Jobs",
      comp: <JobsPreview company={company} />,
      path: "/client/jobs",
    },
    {
      id: "quotecalculator",
      comp: <HRDocumentsPreview company={company} />,
      path: "/client/quotecalculator",
      
    },
    { id: "crm", comp: <CRMPreview company={company} />, path: "/client/crm" },
    {
      id: "metrics",
      comp: <MetricsPreview company={company} />,
      path: "/client/metrics",
    },
    {
      id: "invoices",
      comp: <InvoicesPreview company={company} />,
      path: "/client/invoices",
    }, // Pass user prop
  ];

  return (
    <div style={pageStyle}>
      <Navbar onLogout={() => navigate("/login")} />

      <header style={headerStyle}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            marginBottom: "1rem",
            color: colors.oxfordBlue,
          }}
        >
          {company || "Your Company"}
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
