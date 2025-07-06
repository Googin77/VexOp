// src/components/WidgetCard.jsx (Updated)
import React from 'react';

export default function WidgetCard({ title, children, className = '' }) {
  return (
    // Contrast Fix: Removed dark header, added a subtle yellow top border
    <div className={`bg-white rounded-xl shadow-md p-6 border-t-4 border-brand-accent ${className}`}>
      <h3 className="text-lg font-bold text-brand-dark mb-4">{title}</h3>
      <div className="h-full">
        {children}
      </div>
    </div>
  );
}