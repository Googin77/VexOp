// src/pages/TermsOfService.jsx
import React from 'react';

const TermsOfService = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto my-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-6">Terms of Service</h1>
      <div className="space-y-4 text-gray-700">
        <h2 className="text-2xl font-semibold mt-6">1. Terms</h2>
        <p>By accessing the website at Vexop.com.au, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
        <p>[...More content to be added here...]</p>
        <h2 className="text-2xl font-semibold mt-6">2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on VexOp+'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title...</p>
        <p>[...Content to be added here...]</p>
         <p className='mt-8 text-sm text-gray-500'>Last updated: 7 July 2025.</p>
      </div>
    </div>
  );
};

export default TermsOfService;