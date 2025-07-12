// src/components/AdminLayout.jsx

import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AdminNav = () => (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8">
        <ul className="flex space-x-6">
            <li><Link to="/admin" className="font-bold text-blue-600 hover:underline">Provisioning</Link></li>
            <li><Link to="/admin/leads" className="font-bold text-blue-600 hover:underline">Leads</Link></li>
        </ul>
    </nav>
);

const AdminLayout = () => {
    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
            <AdminNav />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
