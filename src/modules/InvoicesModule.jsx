import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // adjust path if needed

export default function InvoicesModule({ company }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInvoices() {
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "invoices"), where("company", "==", company));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvoices(data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [company]);

  if (loading) return <p>Loading invoices for {company}...</p>;

  return (
    <div>
      <Navbar onLogout={() => navigate("/login")} />
      <button onClick={() => navigate("/client")} style={{ marginBottom: "1rem" }}>
        ← Back to Dashboard
      </button>

      <h2>Invoices</h2>
      {invoices.length === 0 ? (
        <p>No invoices found for this client.</p>
      ) : (
        <ul>
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              {/* Customize display here */}
              {/* Example: <strong>{invoice.invoiceNumber}</strong> — {invoice.status} */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
