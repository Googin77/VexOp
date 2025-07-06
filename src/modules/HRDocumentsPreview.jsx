// src/modules/HRDocumentsPreview.jsx (Corrected)
import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function HRDocumentsPreview({ company }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPreview() {
      if (!company) { setLoading(false); return; }
      try {
        const q = query(collection(db, "quotes"), where("company", "==", company), orderBy("createdAt", "desc"), limit(3));
        const snapshot = await getDocs(q);
        setQuotes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error fetching preview quotes:", error); } 
      finally { setLoading(false); }
    }
    fetchPreview();
  }, [company]);

  if (loading) {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-slate-200 rounded-md"></div>
            <div className="h-10 bg-slate-200 rounded-md"></div>
            <div className="h-10 bg-slate-200 rounded-md"></div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        {quotes.length === 0 ? (
            <p className="text-gray-500">No quotes found.</p>
        ) : (
            <div className="space-y-3">
            {quotes.map((quote) => (
                <div key={quote.id} className="bg-brand-bg p-3 rounded-lg border border-brand-border">
                    <p className="font-semibold text-brand-dark">{quote.quoteTitle}</p>
                    <p className="text-xs text-gray-600">
                        Total: ${quote.total?.toFixed(2) || '0.00'}
                    </p>
                </div>
            ))}
            </div>
        )}
      </div>
      <div
        className="mt-auto pt-4 text-sm text-brand-dark font-bold cursor-pointer hover:text-brand-accent transition-colors duration-200"
        onClick={() => navigate("/client/quotecalculator")}
      >
        See more quotes →
      </div>
    </div>
  );
}