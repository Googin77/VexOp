import React from "react";
import Navbar from "./components/Navbar"; // adjust path if needed

export default function AdminDashboard({ onLogout }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome, Admin! Here you can manage all your clients.</p>
      <div className="space-y-2">
        <p><strong>Total Clients:</strong> 12</p>
        <p><strong>Pending Invoices:</strong> 7</p>
        <p><strong>Monthly Revenue:</strong> $75,000</p>
      </div>
      <button
        onClick={onLogout}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Logout
      </button>
    </div>
  );
}

