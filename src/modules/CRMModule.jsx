import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // adjust path if needed

export default function CRMModule({ company }) {
  const [crmData, setCrmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCRM() {
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "crm"), where("company", "==", company));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCrmData(data);
      } catch (error) {
        console.error("Error fetching CRM data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCRM();
  }, [company]);

  if (loading) return <p>Loading CRM data for {company}...</p>;

  return (
    <div>
      <Navbar onLogout={() => navigate("/login")} />
      <button onClick={() => navigate("/client")} style={{ marginBottom: "1rem" }}>
        ← Back to Dashboard
      </button>

      <h2>CRM Data</h2>
      {crmData.length === 0 ? (
        <p>No CRM data found for this client.</p>
      ) : (
        <ul>
          {crmData.map((item) => (
            <li key={item.id}>
              {/* Customize display here */}
              {/* Example: <strong>{item.clientName}</strong> — {item.status} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
