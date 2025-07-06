// src/modules/JobDetail.jsx (Updated)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const jobDocRef = doc(db, "jobs", id);
    getDoc(jobDocRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setJob({ 
            id: snapshot.id, 
            ...data,
            // Ensure dueDate is a Date object for the DatePicker
            dueDate: data.dueDate ? new Date(data.dueDate) : null
        });
      } else {
        setError("Job not found");
      }
    }).catch(err => {
      setError("Failed to fetch job");
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const jobRef = doc(db, "jobs", job.id);
      // Format dueDate back to a string if it exists
      const dataToUpdate = {
        ...job,
        dueDate: job.dueDate ? job.dueDate.toISOString().split('T')[0] : ""
      };
      await updateDoc(jobRef, dataToUpdate);
      navigate("/client/jobs");
    } catch (err) {
      alert("Failed to update job");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await deleteDoc(doc(db, "jobs", id));
        navigate("/client/jobs");
      } catch (err) { alert("Failed to delete job"); }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJob(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (loading) return <div className="p-8">Loading job...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!job) return null;

  return (
    <div className="p-6 md:p-8 font-sans">
      <header className="mb-8">
        <button onClick={() => navigate("/client/jobs")} className="text-sm text-brand-dark hover:text-brand-accent mb-2">
          &larr; Back to All Jobs
        </button>
        <h1 className="text-3xl font-extrabold text-brand-dark">Edit Job Details</h1>
        <p className="text-gray-500 mt-1">Update information for: <span className="font-bold">{job.name}</span></p>
      </header>

      <div className="max-w-4xl">
        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-brand-accent space-y-4">
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Job Name</label>
              <input type="text" id="name" name="name" value={job.name} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
              <input type="text" id="assignedTo" name="assignedTo" value={job.assignedTo} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" name="status" value={job.status} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white">
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
              <DatePicker id="dueDate" selected={job.dueDate} onChange={(date) => setJob(prev => ({ ...prev, dueDate: date }))} dateFormat="dd/MM/yyyy" className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea id="notes" name="notes" rows="4" value={job.notes || ""} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="completed" name="completed" checked={job.completed || false} onChange={handleInputChange} className="h-4 w-4 text-brand-accent border-gray-300 rounded"/>
            <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">Mark as Completed</label>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button type="submit" disabled={isUpdating} className="bg-brand-dark text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-400">
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 font-medium">
              Delete Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}