import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar";

const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9",
  platinum: "#d9d9d9",
};

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJob() {
      try {
        const docRef = doc(db, "jobs", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setJob({ id: snapshot.id, ...snapshot.data() });
        } else {
          setError("Job not found");
        }
      } catch (err) {
        setError("Failed to fetch job");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const jobRef = doc(db, "jobs", job.id);
      await updateDoc(jobRef, job);
      navigate("/client/jobs");
    } catch (err) {
      alert("Failed to update job");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteDoc(doc(db, "jobs", job.id));
      navigate("/client/jobs");
    } catch (err) {
      alert("Failed to delete job");
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: colors.platinum,
    color: colors.richBlack,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const containerStyle = {
    maxWidth: "900px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "12px",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    border: `1px solid ${colors.silverLakeBlue}`,
    borderRadius: "6px",
    backgroundColor: "white",
    color: colors.richBlack,
    fontSize: "0.9rem",
    outline: "none",
  };

  const buttonStyle = {
    padding: "0.7rem 1.4rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  };

  if (loading) return <div style={containerStyle}><p>Loading job...</p></div>;
  if (error) return <div style={containerStyle}><p style={{ color: "red" }}>{error}</p></div>;

  return (
    <div style={pageStyle}>
      <Navbar onLogout={() => navigate("/login")} />
      <div style={containerStyle}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Job Details</h1>
          <button
            onClick={() => navigate("/client/jobs")}
            style={{ ...buttonStyle, backgroundColor: colors.yinmnBlue, color: "white" }}
          >
            ← Back to Jobs
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <input
            type="text"
            style={inputStyle}
            value={job.name}
            onChange={(e) => setJob({ ...job, name: e.target.value })}
            placeholder="Job Name"
          />
          <input
            type="text"
            style={inputStyle}
            value={job.status}
            onChange={(e) => setJob({ ...job, status: e.target.value })}
            placeholder="Status"
          />
          <input
            type="text"
            style={inputStyle}
            value={job.assignedTo || ""}
            onChange={(e) => setJob({ ...job, assignedTo: e.target.value })}
            placeholder="Assigned To"
          />
          <input
            type="date"
            style={inputStyle}
            value={job.dueDate}
            onChange={(e) => setJob({ ...job, dueDate: e.target.value })}
          />
          <textarea
            rows={4}
            style={inputStyle}
            value={job.notes || ""}
            onChange={(e) => setJob({ ...job, notes: e.target.value })}
            placeholder="Notes"
          />
          <div>
            <label style={{ marginRight: "0.5rem", fontWeight: "500" }}>Completed:</label>
            <input
              type="checkbox"
              checked={job.completed}
              onChange={(e) => setJob({ ...job, completed: e.target.checked })}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleUpdate}
            disabled={updating}
            style={{
              ...buttonStyle,
              backgroundColor: colors.yinmnBlue,
              color: "white",
            }}
          >
            {updating ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleDelete}
            style={{
              ...buttonStyle,
              backgroundColor: "#e11d48",
              color: "white",
            }}
          >
            Delete Job
          </button>
        </div>
      </div>
    </div>
  );
}
