import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // adjust path if needed

export default function HRDocumentsModule({ company }) {
  const [hrDocs, setHrDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHRDocs() {
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "hrdocuments"), where("company", "==", company));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHrDocs(data);
      } catch (error) {
        console.error("Error fetching HR documents:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHRDocs();
  }, [company]);

  if (loading) return <p>Loading HR documents for {company}...</p>;

  return (
    <div>
      <Navbar onLogout={() => navigate("/login")} />
      <button onClick={() => navigate("/client")} style={{ marginBottom: "1rem" }}>
        ← Back to Dashboard
      </button>

      <h2>HR Documents</h2>
      {hrDocs.length === 0 ? (
        <p>No HR documents found for this client.</p>
      ) : (
        <ul>
          {hrDocs.map((doc) => (
            <li key={doc.id}>
              {/* Customize display here */}
              {/* Example: <strong>{doc.title}</strong> — {doc.status} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
