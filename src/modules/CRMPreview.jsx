import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function CRMPreview({ company }) {
  const [crmItems, setCrmItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "crm"),
          where("company", "==", company),
          limit(3)
        );
        const snapshot = await getDocs(q);
        setCrmItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching preview CRM items:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [company]);

  if (loading) return <p>Loading CRM preview...</p>;

  return (
    <div>
      <h3>CRM</h3>
      {crmItems.length === 0 ? (
        <p>No CRM records found.</p>
      ) : (
        <ul>
          {crmItems.map(item => (
            <li key={item.id}>
              {/* Customize display */}
              <strong>{item.name || item.id}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
