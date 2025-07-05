import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const colors = {
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9",
};

const getStatusBadge = (status) => {
    const baseStyle = {
      padding: "0.2rem 0.5rem",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "white",
      whiteSpace: 'nowrap',
    };
    let backgroundColor = "#999";
    if (status === "Pending") backgroundColor = "#eab308";
    if (status === "In Progress") backgroundColor = "#3b82f6";
    if (status === "Completed") backgroundColor = "#10b981";
    return { ...baseStyle, backgroundColor };
};

export default function JobsPreview({ company }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!company) {
      setLoading(false);
      return;
    }
    
    async function fetchJobs() {
      try {
        const previewQuery = query(collection(db, "jobs"), where("company", "==", company), orderBy("createdAt", "desc"), limit(3));
        const previewSnapshot = await getDocs(previewQuery);
        const previewJobs = previewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobs(previewJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [company]);
  
  const stopAndNavigate = (e) => {
    e.stopPropagation();
    navigate("/client/jobs");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontWeight: "700", fontSize: "1.3rem", color: colors.oxfordBlue, marginBottom: "0.5rem" }}>
        Recent Jobs
      </h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            {jobs.length === 0 ? (
              <p style={{ color: colors.silverLakeBlue }}>No jobs yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {jobs.map((job) => (
                  <div key={job.id} style={{
                    backgroundColor: "rgba(27, 38, 59, 0.1)",
                    padding: "0.75rem 1rem", 
                    borderRadius: "10px",
                    boxShadow: "inset 0 0 8px rgba(27, 38, 59, 0.15)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600" }}>{job.name}</div>
                      <div style={{ fontSize: "0.8rem", color: colors.silverLakeBlue }}>
                        Added: {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                    <span style={getStatusBadge(job.status)}>{job.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* This is the styled link at the bottom */}
          <div 
            onClick={stopAndNavigate}
            style={{
              marginTop: 'auto',        // Pushes to the bottom
              paddingTop: '1rem',       // Space from content above
              fontSize: "0.9rem",
              color: colors.yinmnBlue,  // Text color like the other preview
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "left",       // Aligns text to the right
            }}
          >
            Add or View Jobs →
          </div>
        </>
      )}
    </div>
  );
}