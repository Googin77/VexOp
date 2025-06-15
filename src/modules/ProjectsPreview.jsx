import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9a",
  platinum: "#d9d9d9",
};

export default function ProjectsPreview({ company }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPreview() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const previewQuery = query(
          collection(db, "projects"),
          where("company", "==", company),
          limit(3)
        );
        const previewSnapshot = await getDocs(previewQuery);
        const previewProjects = previewSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const totalQuery = query(collection(db, "projects"), where("company", "==", company));
        const totalSnapshot = await getDocs(totalQuery);

        setProjects(previewProjects);
        setTotalCount(totalSnapshot.size);
      } catch (error) {
        console.error("Error fetching preview projects:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [company]);

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
    maxHeight: "180px",
    overflowY: "auto",
  };

  const itemStyle = {
    backgroundColor: "rgba(27, 38, 59, 0.1)", // oxfordBlue translucent
    borderRadius: "10px",
    padding: "0.8rem 1rem",
    boxShadow: "inset 0 0 8px rgba(27, 38, 59, 0.15)",
    color: colors.richBlack,
    fontWeight: "600",
    cursor: "default",
    transition: "background-color 0.2s ease",
  };

  const itemHoverStyle = {
    backgroundColor: "rgba(27, 38, 59, 0.15)",
  };

  const seeMoreStyle = {
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: colors.yinmnBlue,
    cursor: "pointer",
    fontWeight: "600",
    userSelect: "none",
    alignSelf: "flex-start",
  };

  const skeletonStyle = {
    backgroundColor: "rgba(224, 225, 221, 0.4)", // platinum translucent for skeleton
    borderRadius: "10px",
    height: "24px",
    marginBottom: "0.7rem",
    animation: "pulse 1.5s infinite ease-in-out",
  };

  return (
    <div style={{ width: "100%" }}>
      <h3
        style={{
          marginBottom: "1rem",
          fontWeight: "700",
          fontSize: "1.3rem",
          color: colors.oxfordBlue,
        }}
      >
        Projects
      </h3>

      {loading ? (
        <>
          <div style={skeletonStyle} />
          <div style={skeletonStyle} />
          <div style={skeletonStyle} />
          <style>{`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
          `}</style>
        </>
      ) : projects.length === 0 ? (
        <p style={{ color: colors.silverLakeBlue, fontStyle: "italic" }}>No projects found.</p>
      ) : (
        <>
          <div style={containerStyle}>
            {projects.map((p) => (
              <div
                key={p.id}
                style={itemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = itemHoverStyle.backgroundColor)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = itemStyle.backgroundColor)}
                title={p.name}
              >
                {p.name}
              </div>
            ))}
          </div>

          {totalCount > 3 && (
            <div
              style={seeMoreStyle}
              onClick={() => navigate("/client/projects")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/client/projects");
              }}
              tabIndex={0}
              role="button"
              aria-label="See more projects"
            >
              See more projects &rarr;
            </div>
          )}
        </>
      )}
    </div>
  );
}
