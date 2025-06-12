import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function MetricsPreview({ company }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "metrics"),
          where("company", "==", company),
          limit(3)
        );
        const snapshot = await getDocs(q);
        setMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching preview metrics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [company]);

  if (loading) return <p>Loading metrics preview...</p>;

  return (
    <div>
      <h3>Metrics</h3>
      {metrics.length === 0 ? (
        <p>No metrics found.</p>
      ) : (
        <ul>
          {metrics.map(metric => (
            <li key={metric.id}>
              {/* Customize display */}
              <strong>{metric.name || metric.id}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
