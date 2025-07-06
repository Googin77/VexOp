// src/modules/JobsPreview.jsx (Updated)
import React, { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const getStatusBadgeClass = (status) => {
    switch (status) {
        case "Pending": return "bg-yellow-100 text-yellow-800";
        case "In Progress": return "bg-blue-100 text-blue-800";
        case "Completed": return "bg-green-100 text-green-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

export default function JobsPreview({ company }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    
    async function fetchJobs() {
      try {
        const previewQuery = query(collection(db, "jobs"), where("company", "==", company), orderBy("createdAt", "desc"), limit(3));
        const snapshot = await getDocs(previewQuery);
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error fetching jobs:", error); } 
      finally { setLoading(false); }
    }
    fetchJobs();
  }, [company]);
  
  const stopAndNavigate = (e) => {
    e.stopPropagation();
    navigate("/client/jobs");
  };

  if (loading) {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-slate-200 rounded-md"></div>
            <div className="h-10 bg-slate-200 rounded-md"></div>
            <div className="h-10 bg-slate-200 rounded-md"></div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs found.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-brand-bg p-3 rounded-lg border border-brand-border">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-brand-dark">{job.name}</div>
                        <div className="text-xs text-gray-500">
                            Added: {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                    {/* FIX: Added 'whitespace-nowrap' to prevent the badge from breaking into two lines */}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getStatusBadgeClass(job.status)}`}>
                        {job.status}
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div 
        onClick={stopAndNavigate}
        className="mt-auto pt-4 text-sm text-brand-dark font-bold cursor-pointer hover:text-brand-accent transition-colors duration-200"
      >
        Add or View Jobs →
      </div>
    </div>
  );
}