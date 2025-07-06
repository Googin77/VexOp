// src/modules/JobsModule.jsx (Complete and Corrected)
import React, {
  useEffect,
  useState,
  useContext,
  useRef,
} from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase"; 
import { getIdToken } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper function for styling status badges
const getStatusBadgeClass = (status) => {
    switch (status) {
        case "Pending": return "bg-yellow-100 text-yellow-800";
        case "In Progress": return "bg-blue-100 text-blue-800";
        case "Completed": return "bg-green-100 text-green-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "Invalid Date";
  }
};

const CLOUD_FUNCTION_URL = 'https://buildops-places-proxy-255481704627.australia-southeast1.run.app';

export default function JobsModule({ company }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");
  const [newDueDate, setNewDueDate] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [autocompletePredictions, setAutocompletePredictions] = useState([]);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [jobIdToEdit, setJobIdToEdit] = useState(null);

  // Table State
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  
  const navigate = useNavigate();

  // Fetching and Sorting Logic...
  useEffect(() => {
    if (!company) { setLoading(false); return; }
    async function fetchJobs() {
      try {
        setLoading(true);
        const q = query(collection(db, "jobs"), where("company", "==", company), orderBy(sortKey, sortOrder));
        const snapshot = await getDocs(q);
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error("Error fetching jobs:", err); } 
      finally { setLoading(false); }
    }
    fetchJobs();
  }, [company, sortKey, sortOrder]);

  // **THE MISSING FUNCTION IS HERE**
  const toggleSort = (key) => {
    // If clicking the same key, reverse the order
    if (key === sortKey) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new key, set it and default to ascending
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getAuthenticatedFetch = async (url) => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await getIdToken(user);
    return fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  };

  const handleStreetAddressChange = async (e) => {
    const value = e.target.value;
    setStreetAddress(value);
    setIsAddressSelected(false);
    if (value.length > 2) {
      try {
        const response = await getAuthenticatedFetch(`${CLOUD_FUNCTION_URL}?endpoint=autocomplete&input=${encodeURIComponent(value)}`);
        const data = await response.json();
        setAutocompletePredictions(data.predictions || []);
      } catch (error) { console.error("Error fetching address predictions:", error); }
    } else { setAutocompletePredictions([]); }
  };
  
  const handlePredictionSelect = (prediction) => {
    setStreetAddress(prediction.description);
    setIsAddressSelected(true);
    setAutocompletePredictions([]);
  };

  const resetForm = () => {
    setNewName("");
    setNewStatus("Pending");
    setNewDueDate(null);
    setAssignedTo("");
    setStreetAddress("");
    setIsEditing(false);
    setJobIdToEdit(null);
    setIsAddressSelected(false);
  };

  async function handleAddJob(e) {
    e.preventDefault();
    if (!isAddressSelected && !isEditing) return alert("Please select a valid address from the dropdown list.");
    if (!newName || !assignedTo) return alert("Please fill out all required fields.");
    
    setIsSubmitting(true);
    const newJobData = {
      name: newName,
      status: newStatus,
      dueDate: newDueDate ? newDueDate.toISOString().split('T')[0] : "",
      assignedTo,
      streetAddress,
      address: streetAddress,
      completed: false,
      notes: "",
      company,
      createdAt: isEditing ? jobs.find(j => j.id === jobIdToEdit).createdAt : new Date(),
    };

    try {
      if (isEditing && jobIdToEdit) {
        await setDoc(doc(db, "jobs", jobIdToEdit), newJobData, { merge: true });
        setJobs(prev => prev.map(j => j.id === jobIdToEdit ? { id: j.id, ...newJobData } : j));
      } else {
        const docRef = await addDoc(collection(db, "jobs"), newJobData);
        setJobs(prev => [{ id: docRef.id, ...newJobData }, ...prev]);
      }
      resetForm();
    } catch (error) { console.error("Error saving job:", error); } 
    finally { setIsSubmitting(false); }
  }

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await deleteDoc(doc(db, "jobs", jobId));
        setJobs(prev => prev.filter((job) => job.id !== jobId));
      } catch (error) { console.error("Error deleting document: ", error); }
    }
  };

  const handleEditJob = (job) => {
    setNewName(job.name);
    setNewStatus(job.status);
    setNewDueDate(job.dueDate ? new Date(job.dueDate) : null);
    setAssignedTo(job.assignedTo);
    setStreetAddress(job.streetAddress);
    setIsEditing(true);
    setJobIdToEdit(job.id);
    setIsAddressSelected(true);
    setMenuOpen(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 md:p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-dark">Job Management</h1>
        <p className="text-gray-500 mt-1">Add, view, and manage all ongoing and completed jobs.</p>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-brand-accent">
        <h2 className="text-xl font-bold text-brand-dark mb-4">{isEditing ? 'Edit Job' : 'Add a New Job'}</h2>
        <form onSubmit={handleAddJob} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobName" className="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
              <input type="text" id="jobName" className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input type="text" id="assignedTo" className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input type="text" id="streetAddress" className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent" value={streetAddress} onChange={handleStreetAddressChange} placeholder="Start typing a street address..." required autoComplete="off" />
            {autocompletePredictions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {autocompletePredictions.map((p) => (
                  <li key={p.place_id} className="p-2 hover:bg-brand-accent hover:text-black cursor-pointer" onClick={() => handlePredictionSelect(p)}>
                    {p.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <DatePicker id="dueDate" selected={newDueDate} onChange={(date) => setNewDueDate(date)} dateFormat="dd/MM/yyyy" className="w-full p-2 border border-gray-300 rounded-md" placeholderText="Select a date" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" className="w-full p-2 border border-gray-300 rounded-md bg-white" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button type="submit" disabled={isSubmitting} className="bg-brand-dark text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-400">
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Job' : 'Add Job')}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="text-gray-600 hover:text-black">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
        <h2 className="text-xl font-bold text-brand-dark mb-4">Current Jobs</h2>
        {loading ? ( <p>Loading...</p> ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-2">
                        Job Name
                        {sortKey === 'name' ? (sortOrder === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />) : <FontAwesomeIcon icon={faSort} className="text-gray-300" />}
                    </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-2">
                        Status
                        {sortKey === 'status' ? (sortOrder === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />) : <FontAwesomeIcon icon={faSort} className="text-gray-300" />}
                    </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('assignedTo')} className="flex items-center gap-2">
                        Assigned To
                        {sortKey === 'assignedTo' ? (sortOrder === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />) : <FontAwesomeIcon icon={faSort} className="text-gray-300" />}
                    </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('dueDate')} className="flex items-center gap-2">
                        Due Date
                        {sortKey === 'dueDate' ? (sortOrder === 'asc' ? <FontAwesomeIcon icon={faSortUp} /> : <FontAwesomeIcon icon={faSortDown} />) : <FontAwesomeIcon icon={faSort} className="text-gray-300" />}
                    </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{job.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(job.status)}`}>
                          {job.status}
                      </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{job.assignedTo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{job.address}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(job.dueDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => navigate(`/client/jobs/${job.id}`)} className="text-brand-dark hover:text-brand-accent mr-4">View/Edit</button>
                    <button onClick={() => handleDeleteJob(job.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}