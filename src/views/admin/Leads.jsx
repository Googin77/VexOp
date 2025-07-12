// src/views/admin/Leads.jsx

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(leadsQuery, (querySnapshot) => {
            const leadsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() // Convert Firestore Timestamp to JS Date
            }));
            setLeads(leadsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching leads:", error);
            setLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (leadId, newStatus) => {
        const leadRef = doc(db, 'leads', leadId);
        try {
            await updateDoc(leadRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating lead status:", error);
            alert("Failed to update status.");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading Leads...</div>;
    }

    return (
        <div className="p-6 md:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-brand-dark">Lead Management</h1>
                <p className="text-gray-500 mt-1">View and manage all incoming client leads.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                <div className="min-w-full">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Company</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Message</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">{lead.createdAt?.toLocaleDateString() || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.company}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div>{lead.name}</div>
                                        <div className="text-xs text-blue-600">{lead.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                            className="p-1 border border-gray-300 rounded-md bg-white"
                                        >
                                            <option>New</option>
                                            <option>Contacted</option>
                                            <option>Qualified</option>
                                            <option>Closed</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-sm truncate" title={lead.message}>
                                        {lead.message}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leads;