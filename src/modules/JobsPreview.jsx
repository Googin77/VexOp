import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs, addDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9",
  platinum: "#d9d9d9",
};

export default function JobsPreview({ company }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      if (!company) return setLoading(false);

      try {
        const previewQuery = query(
          collection(db, "jobs"),
          where("company", "==", company),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const previewSnapshot = await getDocs(previewQuery);
        const previewJobs = previewSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const totalQuery = query(collection(db, "jobs"), where("company", "==", company));
        const totalSnapshot = await getDocs(totalQuery);

        setJobs(previewJobs);
        setTotalCount(totalSnapshot.size);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [company]);

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newName || !assignedTo) return alert("Fill in required fields");

    const newJob = {
      name: newName,
      status: newStatus,
      assignedTo,
      dueDate,
      company,
      createdAt: new Date(),
      completed: false,
      notes: "",
    };

    try {
      await addDoc(collection(db, "jobs"), newJob);
      setNewName("");
      setNewStatus("Pending");
      setAssignedTo("");
      setDueDate("");
      setShowForm(false);
      // Refresh preview
      const updated = query(
        collection(db, "jobs"),
        where("company", "==", company),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const snapshot = await getDocs(updated);
      setJobs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to add job:", err);
    }
  };

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: "0.2rem 0.5rem",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "white",
    };

    let bg = "#999";
    if (status === "Pending") bg = "#eab308";
    if (status === "In Progress") bg = "#3b82f6";
    if (status === "Completed") bg = "#10b981";

    return { ...baseStyle, backgroundColor: bg };
  };

  return (
    <div style={{ width: "100%" }}>
      <h3 style={{ fontWeight: "700", fontSize: "1.3rem", color: colors.oxfordBlue, marginBottom: "0.5rem" }}>
        Recent Jobs
      </h3>

      {loading ? (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
          <style>{`
            .skeleton {
              height: 24px;
              border-radius: 10px;
              background-color: rgba(224, 225, 221, 0.4);
              margin-bottom: 0.7rem;
              animation: pulse 1.5s infinite ease-in-out;
            }
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
          `}</style>
        </>
      ) : jobs.length === 0 ? (
        <p style={{ color: colors.silverLakeBlue }}>No jobs yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: "rgba(27, 38, 59, 0.1)",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  boxShadow: "inset 0 0 8px rgba(27, 38, 59, 0.15)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600" }}>{job.name}</div>
                  <div style={{ fontSize: "0.8rem", color: colors.silverLakeBlue }}>
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}
                  </div>
                </div>
                <span style={getStatusBadge(job.status)}>{job.status}</span>
              </div>
            ))}
          </div>

          {totalCount > 3 && (
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: colors.yinmnBlue,
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => navigate("/client/jobs")}
            >
              See more jobs →
            </div>
          )}
        </>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginTop: "1rem",
          fontSize: "0.85rem",
          color: "#fff",
          backgroundColor: colors.yinmnBlue,
          padding: "0.5rem 0.9rem",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {showForm ? "Cancel" : "+ Add Job"}
      </button>

      {showForm && (
        <form onSubmit={handleAddJob} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Job name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <input
            type="text"
            placeholder="Assigned to"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              backgroundColor: colors.oxfordBlue,
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Add Job
          </button>
        </form>
      )}
    </div>
  );
}
