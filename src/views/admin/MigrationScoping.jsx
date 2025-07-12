// src/views/admin/MigrationScoping.jsx

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileCsv, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx'; // --- IMPORT XLSX LIBRARY ---

const MigrationScoping = () => {
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- UPDATED: This function now handles CSV, XLS, and XLSX files ---
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const reader = new FileReader();

        // Check file type and use the appropriate parser
        if (selectedFile.name.endsWith('.csv')) {
            // Use Papaparse for CSV files
            reader.onload = (e) => {
                Papa.parse(e.target.result, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        if (results.data.length > 0) {
                            setHeaders(Object.keys(results.data[0]));
                            setRows(results.data.slice(0, 5));
                        }
                    }
                });
            };
            reader.readAsText(selectedFile);
        } else if (selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx')) {
            // Use xlsx (SheetJS) for Excel files
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length > 0) {
                    setHeaders(Object.keys(json[0]));
                    setRows(json.slice(0, 5));
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        } else {
            alert("Please upload a valid CSV or Excel file (.xls, .xlsx).");
            setFile(null);
            setHeaders([]);
            setRows([]);
        }
    };

    const handleImport = () => {
        if (!file) {
            alert("Please upload a file first.");
            return;
        }
        setIsProcessing(true);
        console.log("Starting import process...");
        setTimeout(() => {
            console.log("Import complete (simulated).");
            setIsProcessing(false);
        }, 2000);
    };

    const getFileIcon = () => {
        if (!file) return faUpload;
        if (file.name.endsWith('.csv')) return faFileCsv;
        return faFileExcel;
    };

    const getIconColor = () => {
        if (!file) return 'text-gray-400';
        if (file.name.endsWith('.csv')) return 'text-green-600';
        return 'text-green-700';
    }

    return (
        <div>
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-bold text-brand-dark mb-4">1. Upload Client Data</h2>
                <p className="text-gray-600 mb-4">Upload the client's data export as a CSV or Excel file.</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        // --- UPDATED: Accept CSV and Excel formats ---
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <FontAwesomeIcon icon={faUpload} className="text-4xl text-gray-400 mb-2" />
                        <p className="text-blue-600 font-semibold">Click to upload a file</p>
                        <p className="text-xs text-gray-500">CSV, XLS, or XLSX up to 10MB</p>
                    </label>
                </div>

                {file && (
                    <div className="mt-4 bg-gray-100 p-3 rounded-md flex items-center">
                        <FontAwesomeIcon icon={getFileIcon()} className={`text-2xl ${getIconColor()} mr-3`} />
                        <span className="font-medium text-gray-800">{file.name}</span>
                    </div>
                )}
            </div>

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
                    <p className="text-gray-600 mb-6">Match the columns from the uploaded file to the corresponding fields in VexOp+.</p>
                    
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
