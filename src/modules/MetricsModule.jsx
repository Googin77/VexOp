// src/modules/MetricsModule.jsx

import React, { useEffect, useState, useContext } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// --- Reusable Card for displaying a single metric ---
const StatCard = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-brand-accent">
        <h3 className="text-sm font-bold text-gray-500 uppercase">{title}</h3>
        <p className="text-3xl font-extrabold text-brand-dark mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
);

const MetricsModule = () => {
    const { currentUser } = useContext(AuthContext);
    const [metrics, setMetrics] = useState({
        totalQuotes: 0,
        totalJobs: 0,
        conversionRate: 0,
        totalQuotedValue: 0,
        totalJobValue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.company) {
            setLoading(false);
            return;
        }

        const fetchMetricsData = async () => {
            setLoading(true);
            try {
                const companyId = currentUser.company;

                // Fetch all quotes for the company
                const quotesQuery = query(collection(db, "quotes"), where("company", "==", companyId));
                const quotesSnapshot = await getDocs(quotesQuery);
                const quotesData = quotesSnapshot.docs.map(doc => doc.data());

                // Fetch all jobs for the company
                const jobsQuery = query(collection(db, "jobs"), where("company", "==", companyId));
                const jobsSnapshot = await getDocs(jobsQuery);
                const jobsData = jobsSnapshot.docs.map(doc => doc.data());
                
                // --- Perform Calculations ---
                const totalQuotes = quotesData.length;
                const totalJobs = jobsData.length;
                const conversionRate = totalQuotes > 0 ? ((totalJobs / totalQuotes) * 100).toFixed(1) : 0;
                
                const totalQuotedValue = quotesData.reduce((sum, quote) => sum + (quote.total || 0), 0);
                // Assuming jobs also have a 'total' or similar value field. Add one if it doesn't exist.
                const totalJobValue = jobsData.reduce((sum, job) => sum + (job.total || 0), 0);


                setMetrics({
                    totalQuotes,
                    totalJobs,
                    conversionRate: `${conversionRate}%`,
                    totalQuotedValue,
                    totalJobValue,
                });

            } catch (error) {
                console.error("Error fetching metrics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetricsData();
    }, [currentUser]);

    // Data for the charts
    const comparisonData = [
        { name: 'Quotes', count: metrics.totalQuotes, value: metrics.totalQuotedValue },
        { name: 'Jobs', count: metrics.totalJobs, value: metrics.totalJobValue },
    ];

    const pieData = [
        { name: 'Jobs Won', value: metrics.totalJobs },
        { name: 'Quotes Not Won', value: metrics.totalQuotes - metrics.totalJobs },
    ];

    const COLORS = ['#3B82F6', '#E5E7EB']; // Blue for jobs, Gray for others

    if (loading) {
        return <div className="p-8 text-center">Calculating Metrics...</div>;
    }

    return (
        <div className="p-6 md:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-brand-dark">Business Metrics</h1>
                <p className="text-gray-500 mt-1">An overview of your company's performance.</p>
            </header>

            {/* Key Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Quotes" value={metrics.totalQuotes} description="All quotes created." />
                <StatCard title="Total Jobs" value={metrics.totalJobs} description="All jobs created." />
                <StatCard title="Conversion Rate" value={metrics.conversionRate} description="From quote to job." />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-brand-dark mb-4">Quotes vs. Jobs (Count)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#ffbd08" name="Total Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-brand-dark mb-4">Quote to Job Conversion</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MetricsModule;
