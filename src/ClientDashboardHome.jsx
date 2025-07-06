// src/ClientDashboardHome.jsx (Corrected)
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

import JobsPreview from "./modules/JobsPreview";
import HRDocumentsPreview from "./modules/HRDocumentsPreview";
import InvoicesPreview from "./modules/InvoicesPreview";
import CRMPreview from "./modules/CRMPreview";
import WidgetCard from './components/WidgetCard';

export default function ClientDashboardHome() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const companyName = currentUser?.company || "Your Company";

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-brand-dark">
          {companyName} Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's a snapshot of your operations.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        <WidgetCard title="Key Metrics" className="lg:col-span-2 xl:col-span-4">
            <div className="flex flex-wrap justify-around text-center gap-4 py-4">
                <div className="flex-1 min-w-[120px]">
                    <p className="text-4xl font-bold text-brand-accent">15</p>
                    <p className="text-sm text-gray-500 mt-1">Active Jobs</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                    <p className="text-4xl font-bold text-brand-accent-secondary">$12,450</p>
                    <p className="text-sm text-gray-500 mt-1">Pending Invoices</p>
                </div>
                <div className="flex-1 min-w-[120px]">
                    <p className="text-4xl font-bold text-red-500">8</p>
                    <p className="text-sm text-gray-500 mt-1">Overdue Tasks</p>
                </div>
                 <div className="flex-1 min-w-[120px]">
                    <p className="text-4xl font-bold text-green-500">5</p>
                    <p className="text-sm text-gray-500 mt-1">New Leads</p>
                </div>
            </div>
        </WidgetCard>

        <div onClick={() => handleNavigate('/client/jobs')} className="cursor-pointer transition-transform duration-200 hover:-translate-y-1">
            <WidgetCard title="Recent Jobs">
                <JobsPreview company={currentUser?.company} />
            </WidgetCard>
        </div>

        <div onClick={() => handleNavigate('/client/quotecalculator')} className="cursor-pointer transition-transform duration-200 hover:-translate-y-1">
            <WidgetCard title="Recent Quotes">
                <HRDocumentsPreview company={currentUser?.company} />
            </WidgetCard>
        </div>

        <div onClick={() => handleNavigate('/client/invoices')} className="cursor-pointer transition-transform duration-200 hover:-translate-y-1">
            <WidgetCard title="Recent Invoices">
                <InvoicesPreview company={currentUser?.company} />
            </WidgetCard>
        </div>

        <div onClick={() => handleNavigate('/client/crm')} className="cursor-pointer transition-transform duration-200 hover:-translate-y-1">
            <WidgetCard title="CRM Activity">
                <CRMPreview company={currentUser?.company} />
            </WidgetCard>
        </div>
      </div>
    </div>
  );
}