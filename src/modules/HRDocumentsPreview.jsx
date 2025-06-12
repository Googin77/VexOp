import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function HRDocumentsPreview({ company }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "hrdocuments"),
          where("company", "==", company),
          limit(3)
        );
        const snapshot = await getDocs(q);
        setDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching preview HR documents:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [company]);

  if (loading) return <p>Loading HR documents preview...</p>;

  return (
    <div>
      <h3>HR Documents</h3>
      {docs.length === 0 ? (
        <p>No HR documents found.</p>
      ) : (
        <ul>
          {docs.map(doc => (
            <li key={doc.id}>
              {/* Customize display */}
              <strong>{doc.title || doc.id}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
