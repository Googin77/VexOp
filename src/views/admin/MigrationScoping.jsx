// src/views/admin/MigrationScoping.jsx

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse'; // --- IMPORT PAPAPARSE ---

const MigrationScoping = () => {
    const [csvFile, setCsvFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]); // --- NEW: State for data rows ---
    const [isProcessing, setIsProcessing] = useState(false);

    // --- UPDATED: This function now parses the CSV ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/csv") {
            setCsvFile(file);
            // Use Papaparse to read the CSV file
            Papa.parse(file, {
                header: true, // Treat the first row as headers
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.data.length > 0) {
                        // Get the headers from the first row of data
                        setHeaders(Object.keys(results.data[0]));
                        // Store the first 5 rows for preview
                        setRows(results.data.slice(0, 5));
                    }
                }
            });
        } else {
            alert("Please upload a valid CSV file.");
            setCsvFile(null);
            setHeaders([]);
            setRows([]);
        }
    };

    const handleImport = () => {
        if (!csvFile) {
            alert("Please upload a file first.");
            return;
        }
        setIsProcessing(true);
        // TODO: This will eventually call a Cloud Function to process the import.
        console.log("Starting import process...");
        setTimeout(() => {
            console.log("Import complete (simulated).");
            setIsProcessing(false);
        }, 2000);
    };

    return (
        <div>
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-bold text-brand-dark mb-4">1. Upload Client Data</h2>
                <p className="text-gray-600 mb-4">Upload the client's data export as a CSV file (e.g., customers, jobs, or items).</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                        type="file"
                        id="csv-upload"
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                        <FontAwesomeIcon icon={faUpload} className="text-4xl text-gray-400 mb-2" />
                        <p className="text-blue-600 font-semibold">Click to upload a file</p>
                        <p className="text-xs text-gray-500">CSV up to 10MB</p>
                    </label>
                </div>

                {csvFile && (
                    <div className="mt-4 bg-gray-100 p-3 rounded-md flex items-center">
                        <FontAwesomeIcon icon={faFileCsv} className="text-2xl text-green-600 mr-3" />
                        <span className="font-medium text-gray-800">{csvFile.name}</span>
                    </div>
                )}
            </div>

            {/* --- NEW: Data Preview Section --- */}
            {rows.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-xl font-bold text-brand-dark mb-4">Data Preview (First 5 Rows)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    {headers.map(header => (
                                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-600">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        {headers.map(header => (
                                            <td key={header} className="px-3 py-2 whitespace-nowrap text-gray-700">{row[header]}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {headers.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-brand-dark mb-4">2. Map Data Fields</h2>
                    <p className="text-gray-600 mb-6">Match the columns from the uploaded CSV file to the corresponding fields in VexOp+.</p>
                    
                    <div className="space-y-4">
                        {headers.map((header, index) => (
                            <div key={index} className="grid grid-cols-2 gap-4 items-center">
                                <div className="p-2 bg-gray-100 rounded-md text-gray-800 font-mono text-sm">
                                    {header}
                                </div>
                                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                                    <option value="">Select VexOp+ Field...</option>
                                    <option value="name">Customer Name</option>
                                    <option value="email">Contact Email</option>
                                    <option value="phone">Phone Number</option>
                                    <option value="address.billing">Billing Address</option>
                                    <option value="address.shipping">Shipping Address</option>
                                    <option value="notes">Notes</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <button 
                            onClick={handleImport}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-400"
                        >
                            {isProcessing ? 'Processing...' : 'Process Import'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MigrationScoping;
