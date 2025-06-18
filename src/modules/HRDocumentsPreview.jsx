import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const colors = {
    richBlack: "#343434",
    oxfordBlue: "#1b263b",
    yinmnBlue: "#415a77",
    silverLakeBlue: "#778da9a",
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
                    limit(3) // Limiting to 3 instead of 5 to allign with projects
                );
                const previewSnapshot = await getDocs(previewQuery);
                const previewQuotes = previewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const totalQuery = query(
                    collection(db, "quotes"),
                    where("company", "==", company)
                );
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

    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem",
        maxHeight: "180px",
        overflowY: "auto",
    };

    const itemStyle = {
        backgroundColor: "rgba(27, 38, 59, 0.1)", // oxfordBlue translucent
        borderRadius: "10px",
        padding: "0.8rem 1rem",
        boxShadow: "inset 0 0 8px rgba(27, 38, 59, 0.15)",
        color: colors.richBlack,
        fontWeight: "600",
        cursor: "default",
        transition: "background-color 0.2s ease",
    };

    const itemHoverStyle = {
        backgroundColor: "rgba(27, 38, 59, 0.15)",
    };

    const seeMoreStyle = {
        marginTop: "1rem",
        fontSize: "0.9rem",
        color: colors.yinmnBlue,
        cursor: "pointer",
        fontWeight: "600",
        userSelect: "none",
        alignSelf: "flex-start",
    };

    const skeletonStyle = {
        backgroundColor: "rgba(224, 225, 221, 0.4)", // platinum translucent for skeleton
        borderRadius: "10px",
        height: "24px",
        marginBottom: "0.7rem",
        animation: "pulse 1.5s infinite ease-in-out",
    };

    return (
        <div style={{ width: "100%" }}>
            <h3
                style={{
                    marginBottom: "1rem",
                    fontWeight: "700",
                    fontSize: "1.3rem",
                    color: colors.oxfordBlue,
                }}
            >
                Previous Quotes
            </h3>

            {loading ? (
                <>
                    <div style={skeletonStyle} />
                    <div style={skeletonStyle} />
                    <div style={skeletonStyle} />
                    <style>{`
                        @keyframes pulse {
                            0% { opacity: 1; }
                            50% { opacity: 0.4; }
                            100% { opacity: 1; }
                        }
                    `}</style>
                </>
            ) : quotes.length === 0 ? (
                <p style={{ color: colors.silverLakeBlue, fontStyle: "italic" }}>No quotes found.</p>
            ) : (
                <>
                    <div style={containerStyle}>
                        {quotes.map((quote) => (
                            <div
                                key={quote.id}
                                style={itemStyle}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = itemHoverStyle.backgroundColor)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = itemStyle.backgroundColor)}
                                title={quote.quoteTitle ? `${quote.quoteTitle} - Total: $${quote.total?.toFixed(2) || 0}` : `Total: $${quote.total?.toFixed(2) || 0}`}
                            >
                                {quote.quoteTitle ? `${quote.quoteTitle} - Total: $${quote.total?.toFixed(2) || 0}` : `Total: $${quote.total?.toFixed(2) || 0}`}
                            </div>
                        ))}
                    </div>

                    {totalCount > 3 && (
                        <div
                            style={seeMoreStyle}
                            onClick={() => navigate("/client/quotecalculator")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") navigate("/client/quotecalculator");
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label="See more quotes"
                        >
                            See more quotes &rarr;
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
