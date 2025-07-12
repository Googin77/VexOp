// src/modules/QuoteDetails.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

// Initialize Firebase Functions
const functions = getFunctions(getApp(), 'australia-southeast1');

// This is a helper function to trigger the download
const downloadPdf = (base64String, fileName) => {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const QuoteDetails = () => {
    const { quoteId } = useParams();
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [quote, setQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!currentUser?.company || !quoteId) return;

        const fetchQuote = async () => {
            setIsLoading(true);
            // The document path is directly to the 'quotes' collection
            const docRef = doc(db, "quotes", quoteId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().company === currentUser.company) {
                setQuote({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("No such document or permission denied!");
                setQuote(null);
            }
            setIsLoading(false);
        };

        fetchQuote();
    }, [quoteId, currentUser]);

    const handleDownloadPdf = async () => {
        if (!quote) return;
        setIsDownloading(true);
        try {
            const generatePdf = httpsCallable(functions, 'generatePdf');
            // The 'type' should be 'quotes' to match the collection name
            const result = await generatePdf({
                companyId: quote.company,
                docId: quote.id,
                type: 'quotes' 
            });

            if (result.data.status === 'success') {
                downloadPdf(result.data.pdfBase64, `Quote-${quote.quoteTitle || quote.id}.pdf`);
            } else {
                throw new Error('PDF generation failed on the server.');
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Could not download PDF. " + error.message);
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading Quote...</div>;
    }

    if (!quote) {
        return <div className="p-8 text-center">Quote not found or you do not have permission to view it.</div>;
    }

    return (
        <div className="p-6 md:p-8 font-sans">
            <header className="mb-8">
                <button onClick={() => navigate("/client/quotecalculator")} className="text-sm text-brand-dark hover:text-brand-accent mb-4">
                    &larr; Back to All Quotes
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-brand-dark">{quote.quoteTitle}</h1>
                        <p className="text-gray-500">Quote #{quote.id}</p>
                    </div>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400"
                    >
                        {isDownloading ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>
            </header>
            
            <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-brand-accent">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="font-bold text-gray-500 uppercase text-xs">Total Amount</p>
                        <p className="text-2xl font-semibold text-brand-dark">${quote.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                        <p className="font-bold text-gray-500 uppercase text-xs">Date Created</p>
                        <p className="text-lg text-gray-800">{quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                    </div>
                 </div>
                 {/* You can add more details here by mapping over quote.quantities if needed */}
            </div>
        </div>
    );
};

export default QuoteDetails;
