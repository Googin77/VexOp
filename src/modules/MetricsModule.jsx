import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // adjust path if needed

export default function MetricsModule({ company }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMetrics() {
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "metrics"), where("company", "==", company));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [company]);

  if (loading) return <p>Loading metrics for {company}...</p>;

  return (
    <div>
      <Navbar onLogout={() => navigate("/login")} />
      <button onClick={() => navigate("/client")} style={{ marginBottom: "1rem" }}>
        ← Back to Dashboard
      </button>

      <h2>Metrics</h2>
      {metrics.length === 0 ? (
        <p>No metrics found for this client.</p>
      ) : (
        <ul>
          {metrics.map((metric) => (
            <li key={metric.id}>
              {/* Customize display here */}
              {/* Example: <strong>{metric.metricName}</strong> — {metric.value} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
