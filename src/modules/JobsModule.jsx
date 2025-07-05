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
import { db } from "../firebase";
import { getAuth } from "firebase/auth"; // <-- 1. IMPORT getAuth
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Style and utility constants ---
const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9",
  platinum: "#d9d9d9",
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = String(adjustedDate.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  } catch (error) {
    return "Invalid Date";
  }
};

const CLOUD_FUNCTION_URL = 'https://places-api-proxy-secure-927846386659.australia-southeast1.run.app';

export default function JobsModule({ company }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [jobIdToEdit, setJobIdToEdit] = useState(null);
  const streetAddressInputRef = useRef(null);
  const [autocompletePredictions, setAutocompletePredictions] = useState([]);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  useEffect(() => {
    async function fetchJobs() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const q = query(collection(db, "jobs"), where("company", "==", company), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setJobs(data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [company]);

  // --- REVISED: Securely authenticates requests using the user's Firebase ID token ---
  const getAuthenticatedFetch = async (url) => {
    const auth = getAuth();
    const user = auth.currentUser; // <-- 2. GET THE LIVE USER OBJECT

    if (!user) {
      console.error("Authentication error: No user is signed in.");
      throw new Error("User is not authenticated.");
    }
    
    // This will now work correctly as 'user' is the full Firebase user instance
    const token = await user.getIdToken();

    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const handleStreetAddressChange = async (e) => {
    const value = e.target.value;
    setStreetAddress(value);

    if (value.length > 3) {
      try {
        const response = await getAuthenticatedFetch(`${CLOUD_FUNCTION_URL}?endpoint=autocomplete&input=${encodeURIComponent(value)}`);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        setAutocompletePredictions(data.predictions || []);
      } catch (error) {
        console.error("Error fetching address predictions:", error);
        setAutocompletePredictions([]);
      }
    } else {
      setAutocompletePredictions([]);
    }
  };
  
  const handlePredictionSelect = async (prediction) => {
    setAutocompletePredictions([]);
    try {
      const response = await getAuthenticatedFetch(`${CLOUD_FUNCTION_URL}?endpoint=details&place_id=${prediction.place_id}`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setStreetAddress(data.result?.formatted_address || prediction.description);
    } catch (error) {
      console.error("Error fetching place details:", error);
      setStreetAddress(prediction.description);
    }
  };

  async function handleAddJob(e) {
    e.preventDefault();
    if (!newName || !assignedTo || !streetAddress) return alert("Please complete all required fields");

    const newJobData = {
      name: newName,
      status: newStatus || "Pending",
      dueDate: newDueDate,
      assignedTo,
      streetAddress: streetAddress,
      address: streetAddress,
      completed: false,
      notes: "",
      company,
      createdAt: new Date(),
    };

    try {
      setLoading(true);
      if (isEditing && jobIdToEdit) {
        const jobDocRef = doc(db, "jobs", jobIdToEdit);
        await setDoc(jobDocRef, newJobData, { merge: true });
        setJobs((prevJobs) => prevJobs.map((job) => (job.id === jobIdToEdit ? { id: job.id, ...newJobData } : job)));
      } else {
        const docRef = await addDoc(collection(db, "jobs"), newJobData);
        setJobs((prevJobs) => [{ id: docRef.id, ...newJobData }, ...prevJobs]);
      }
      setNewName("");
      setNewStatus("");
      setNewDueDate("");
      setAssignedTo("");
      setStreetAddress("");
      setIsEditing(false);
      setJobIdToEdit(null);
    } catch (error) {
      console.error("Error adding/updating job:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- No changes to other handlers or JSX rendering ---
  const sortedJobs = [...jobs].sort((a, b) => {
    const aVal = a[sortKey]?.toLowerCase?.() || a[sortKey] || "";
    const bVal = b[sortKey]?.toLowerCase?.() || b[sortKey] || "";
    return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleEditJob = (job) => {
    setNewName(job.name);
    setNewStatus(job.status);
    setNewDueDate(job.dueDate || "");
    setAssignedTo(job.assignedTo);
    setStreetAddress(job.streetAddress);
    setIsEditing(true);
    setJobIdToEdit(job.id);
    setMenuOpen(null);
    window.scrollTo(0, 0);
  };

  const toggleMenu = (jobId, event) => {
    if (menuOpen === jobId) {
      setMenuOpen(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 80;
    const spaceBelow = window.innerHeight - rect.bottom;
    const style = { position: "absolute", right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px", padding: "5px 0", zIndex: 100, minWidth: "150px" };
    if (spaceBelow < menuHeight) { style.bottom = "100%"; } else { style.top = "100%"; }
    setMenuStyle(style);
    setMenuOpen(jobId);
  };
  
  const getMapLink = (address) => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  // Styles
  const pageStyle = { minHeight: "100vh", backgroundColor: colors.platinum, color: colors.richBlack, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" };
  const containerStyle = { maxWidth: "900px", margin: "2rem auto", padding: "2rem", backgroundColor: "rgba(255, 255, 255, 0.8)", borderRadius: "12px" };
  const headerStyle = { fontSize: "2.2rem", fontWeight: "700", marginBottom: "1.5rem", color: colors.oxfordBlue };
  const selectStyle = { width: "100%", padding: "0.75rem", border: `1px solid ${colors.silverLakeBlue}`, borderRadius: "8px", backgroundColor: "white", color: colors.richBlack, fontSize: "1rem", outline: "none" };
  const buttonStyle = { backgroundColor: colors.yinmnBlue, color: "white", padding: "0.75rem 1.5rem", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "600", marginTop: "1rem", transition: "backgroundColor 0.2s ease" };
  const savedQuotesTableStyle = { width: "100%", borderCollapse: "collapse", marginTop: "2rem", borderRadius: "8px", overflow: "hidden" };
  const savedQuotesThStyle = { backgroundColor: colors.oxfordBlue, color: "white", fontWeight: "600", padding: "0.75rem", textAlign: "left", fontSize: "0.8rem" };
  const savedQuotesTdStyle = { padding: "0.75rem", borderBottom: `1px solid ${colors.silverLakeBlue}`, fontSize: "0.85rem", position: 'relative' };
  const inputTitle = { width: "100%", padding: "0.6rem", border: `1px solid ${colors.silverLakeBlue}`, borderRadius: "6px", backgroundColor: "white", color: colors.richBlack, fontSize: "0.9rem", outline: "none" };
  const kebabButton = { background: "none", border: "none", padding: "10px", cursor: "pointer" };
  const menuItemStyle = { padding: "8px 15px", textAlign: "left", background: "none", border: "none", display: "block", width: "100%", cursor: "pointer" };
  const autocompleteContainerStyle = { position: 'relative', width: '100%' };
  const autocompleteListStyle = { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px", padding: 0, margin: 0, zIndex: 99, listStyleType: "none", maxHeight: '200px', overflowY: 'auto' };
  const autocompleteItemStyle = { padding: "8px 15px", textAlign: "left", cursor: "pointer" };
  const labelStyle = { display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem" };

  return (
    <div style={pageStyle}>
      <Navbar onLogout={() => navigate("/login")} />
      <div style={containerStyle}>
        <div className="flex justify-between items-center mb-6">
          <h1 style={headerStyle}>Job Management</h1>
          <button onClick={() => navigate("/client")} style={{...buttonStyle, marginTop: 0}}>
            ← Back to Homepage
          </button>
        </div>

        <form onSubmit={handleAddJob}>
          <label htmlFor="jobName" style={labelStyle}>Job Name:</label>
          <input type="text" id="jobName" style={inputTitle} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter job name" required />

          <label htmlFor="assignedTo" style={{...labelStyle, marginTop: '1rem'}}>Assigned To:</label>
          <input type="text" id="assignedTo" style={inputTitle} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Assign to" required />
          
          <div style={autocompleteContainerStyle}>
            <label htmlFor="streetAddress" style={{...labelStyle, marginTop: '1rem'}}>Street Address:</label>
            <input
              type="text"
              id="streetAddress"
              style={inputTitle}
              value={streetAddress}
              onChange={handleStreetAddressChange}
              placeholder="Start typing a street address..."
              ref={streetAddressInputRef}
              required
              autoComplete="off"
            />
            {autocompletePredictions.length > 0 && (
              <ul style={autocompleteListStyle}>
                {autocompletePredictions.map((prediction) => (
                  <li
                    key={prediction.place_id}
                    style={autocompleteItemStyle}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                    onClick={() => handlePredictionSelect(prediction)}
                  >
                    {prediction.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            
            <div style={{ flex: 1 }}>
              <label htmlFor="dueDate" style={labelStyle}>Due Date:</label>
              <DatePicker
                id="dueDate"
                selected={newDueDate ? new Date(newDueDate) : null}
                onChange={(date) => setNewDueDate(date ? date.toISOString().split('T')[0] : "")}
                dateFormat="dd.MM.yyyy"
                placeholderText="Select or type a date"
                wrapperClassName="w-full"
                customInput={<input style={inputTitle} />}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label htmlFor="status" style={labelStyle}>Status:</label>
              <select id="status" style={selectStyle} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <button style={buttonStyle} type="submit">{isEditing ? "Update Job" : "Add Job"}</button>
        </form>

        {loading ? (
          <p>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p>No jobs found for this client.</p>
        ) : (
          <div className="overflow-x-auto mt-8">
            <table style={savedQuotesTableStyle}>
              <thead>
                <tr>
                  <th style={savedQuotesThStyle} onClick={() => toggleSort("name")}>Job Name</th>
                  <th style={savedQuotesThStyle} onClick={() => toggleSort("status")}>Status</th>
                  <th style={savedQuotesThStyle} onClick={() => toggleSort("assignedTo")}>Assigned</th>
                  <th style={savedQuotesThStyle}>Address</th>
                  <th style={savedQuotesThStyle} onClick={() => toggleSort("dueDate")}>Due Date</th>
                  <th style={savedQuotesThStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map((job) => (
                  <tr key={job.id}>
                    <td style={savedQuotesTdStyle}>{job.name}</td>
                    <td style={savedQuotesTdStyle}>{job.status}</td>
                    <td style={savedQuotesTdStyle}>{job.assignedTo}</td>
                    <td style={savedQuotesTdStyle}>
                      {job.address ? (
                        <a href={getMapLink(job.address)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{job.address}</a>
                      ) : ("No Address")}
                    </td>
                    <td style={savedQuotesTdStyle}>{formatDate(job.dueDate)}</td>
                    <td style={savedQuotesTdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{position: 'relative'}}>
                          <button style={kebabButton} onClick={(e) => toggleMenu(job.id, e)}>
                            <FontAwesomeIcon icon={faEllipsisV} />
                          </button>
                          {menuOpen === job.id && (
                            <div style={menuStyle} ref={menuRef}>
                              <button style={{...menuItemStyle, width: '100%'}} onClick={() => handleEditJob(job)}>Edit</button>
                              <button style={{...menuItemStyle, width: '100%'}} onClick={() => handleDeleteJob(job.id)}>Delete</button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => navigate(`/client/jobs/${job.id}`)} className="text-blue-600 hover:underline ml-2">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}