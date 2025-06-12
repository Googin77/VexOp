import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function InvoicesPreview({ company }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "invoices"),
          where("company", "==", company),
          limit(3)
        );
        const snapshot = await getDocs(q);
        setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching preview invoices:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [company]);

  if (loading) return <p>Loading invoices preview...</p>;

  return (
    <div>
      <h3>Invoices</h3>
      {invoices.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <ul>
          {invoices.map(inv => (
            <li key={inv.id}>
              {/* Customize display */}
              <strong>{inv.name || inv.id}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
