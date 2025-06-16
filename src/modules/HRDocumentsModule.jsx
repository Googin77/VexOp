import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Calculator from "../calculator";

const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9a",
  platinum: "#d9d9d9",
};

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
    <div
      className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white"
    >
      <Navbar onLogout={() => navigate("/login")} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">HR Documents</h1>
          <button
            onClick={() => navigate("/client")}
            className="text-sm font-medium px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition"
          >
            ← Back to Homepage
          </button>
        </div>

        {/* HR Documents */}
        <h2>HR Documents</h2>
        {hrDocs.length === 0 ? (
          <p>No HR documents found for this client.</p>
        ) : (
          <ul>
            {hrDocs.map((doc) => (
              <li key={doc.id}>
                Document Title: {doc.title} - Status: {doc.status}
              </li>
            ))}
          </ul>
        )}

        {/* Calculator Component */}
        <Calculator colors={colors} />
      </div>
    </div>
  );
}
