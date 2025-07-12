// src/views/client/QuoteDetails.jsx

import React, { useState } from 'react';
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
    const [isLoading, setIsLoading] = useState(false);

    // --- Placeholder Data ---
    // In a real app, this data would come from props or a Firestore query.
    const quote = {
        id: "quote-123",
        companyId: "acme-construction", // The company this quote belongs to
        quoteNumber: "Q-001",
        clientName: "John Doe",
        description: "Supply and install new fixtures.",
        totalAmount: "1500.00"
    };
    // --- End Placeholder Data ---

    const handleDownloadPdf = async () => {
        setIsLoading(true);
        try {
            const generatePdf = httpsCallable(functions, 'generatePdf');
            const result = await generatePdf({
                companyId: quote.companyId,
                docId: quote.id,
                type: 'quotes' // Specify the collection type
            });

            if (result.data.status === 'success') {
                downloadPdf(result.data.pdfBase64, `Quote-${quote.quoteNumber}.pdf`);
            } else {
                throw new Error('PDF generation failed on the server.');
            }

        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Could not download PDF. " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark">Quote Details</h1>
                    <p className="text-gray-500">Quote #{quote.quoteNumber}</p>
                </div>
                <button
                    onClick={handleDownloadPdf}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400"
                >
                    {isLoading ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            <div className="mt-8 border-t pt-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-bold text-gray-700">Client:</p>
                        <p>{quote.clientName}</p>
                    </div>
                    <div>
                        <p className="font-bold text-gray-700">Total Amount:</p>
                        <p className="text-xl font-semibold">${quote.totalAmount}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <p className="font-bold text-gray-700">Description:</p>
                    <p>{quote.description}</p>
                </div>
            </div>
        </div>
    );
};

export default QuoteDetails;