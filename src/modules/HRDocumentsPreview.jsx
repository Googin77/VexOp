import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9",
  platinum: "#d9d9d9",
};

export default function HRDocumentsPreview({ company }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPreview() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const previewQuery = query(
          collection(db, "quotes"),
          where("company", "==", company),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const previewSnapshot = await getDocs(previewQuery);
        const previewQuotes = previewSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const totalQuery = query(collection(db, "quotes"), where("company", "==", company));
        const totalSnapshot = await getDocs(totalQuery);

        setQuotes(previewQuotes);
        setTotalCount(totalSnapshot.size);
      } catch (error) {
        console.error("Error fetching preview quotes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [company]);

  return (
    <div style={{ width: "100%" }}>
      <h3 style={{ fontWeight: "700", fontSize: "1.3rem", color: colors.oxfordBlue, marginBottom: "0.5rem" }}>
        Previous Quotes
      </h3>

      {loading ? (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
          <style>{`
            .skeleton {
              height: 24px;
              border-radius: 10px;
              background-color: rgba(224, 225, 221, 0.4);
              margin-bottom: 0.7rem;
              animation: pulse 1.5s infinite ease-in-out;
            }
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
          `}</style>
        </>
      ) : quotes.length === 0 ? (
        <p style={{ color: colors.silverLakeBlue }}>No quotes yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {quotes.map((quote) => (
              <div
                key={quote.id}
                style={{
                  backgroundColor: "rgba(27, 38, 59, 0.1)",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  boxShadow: "inset 0 0 8px rgba(27, 38, 59, 0.15)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600" }}>{quote.quoteTitle}</div>
                  <div style={{ fontSize: "0.8rem", color: colors.silverLakeBlue }}>
                    Total: ${quote.total?.toFixed(2) || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalCount > 3 && (
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: colors.yinmnBlue,
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => navigate("/client/quotecalculator")}
            >
              See more quotes →
            </div>
          )}
        </>
      )}
    </div>
  );
}
