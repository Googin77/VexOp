// === JobsModule.jsx ===

import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, query, where, getDocs, addDoc, orderBy, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

const colors = {
    richBlack: "#343434",
    oxfordBlue: "#1b263b",
    yinmnBlue: "#415a77",
    silverLakeBlue: "#778da9",
    platinum: "#d9d9d9",
};

export default function JobsModule({ company }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [newDueDate, setNewDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [sortKey, setSortKey] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [jobIdToEdit, setJobIdToEdit] = useState(null);
    const [jobBeingEdited, setJobBeingEdited] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        async function fetchJobs() {
            if (!company) return setLoading(false);
            try {
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
    }, [company, jobBeingEdited]);

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

    async function handleAddJob(e) {
        e.preventDefault();
        if (!newName || !assignedTo) return alert("Please complete all required fields");
        const newJob = {
            name: newName,
            status: newStatus || "Pending",
            dueDate: newDueDate,
            assignedTo,
            completed: false,
            notes: "",
            company,
            createdAt: new Date(),
        };
        try {
            setLoading(true);

            if (isEditing && jobIdToEdit) {
                // Update in Firestore
                const jobDocRef = doc(db, "jobs", jobIdToEdit);
                await setDoc(jobDocRef, newJob, { merge: true });

                // Update in local state
                setJobs(prevJobs =>
                    prevJobs.map(job => (job.id === jobIdToEdit ? { id: job.id, ...newJob } : job))
                );
            } else {
                // Save new in Firestore
                await addDoc(collection(db, "jobs"), newJob);
            }

            setNewName("");
            setNewStatus("");
            setNewDueDate("");
            setAssignedTo("");
            setIsEditing(false);
            setJobIdToEdit(null);
            setJobBeingEdited(null);

            const q = query(collection(db, "jobs"), where("company", "==", company), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setJobs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error adding/updating job:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteJob = async (jobId) => {
        try {
            await deleteDoc(doc(db, "jobs", jobId));
            setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
            console.log("Job deleted with ID: ", jobId);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const handleEditJob = (job) => {
        setNewName(job.name);
        setNewStatus(job.status);
        setNewDueDate(job.dueDate);
        setAssignedTo(job.assignedTo);
        setJobIdToEdit(job.id);
        setIsEditing(true);
        setMenuOpen(null);
        setJobBeingEdited(job);
    };

    const toggleMenu = (jobId) => {
        setMenuOpen(menuOpen === jobId ? null : jobId);
    };

    // Styles (Copied from QuotingCalculator)
    const pageStyle = {
        minHeight: "100vh",
        backgroundColor: colors.platinum,
        color: colors.richBlack,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    };

    const containerStyle = {
        maxWidth: "900px",
        margin: "2rem auto",
        padding: "2rem",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "12px",
        
    };

    const headerStyle = {
        fontSize: "2.2rem",
        fontWeight: "700",
        marginBottom: "1.5rem",
        color: colors.oxfordBlue,
        fontSize: "0.9rem",
    };

    const selectStyle = {
        width: "100%",
        padding: "0.75rem",
        marginBottom: "1.5rem",
        border: `1px solid ${colors.silverLakeBlue}`,
        borderRadius: "8px",
        backgroundColor: "white",
        color: colors.richBlack,
        fontSize: "1rem",
        outline: "none",
    };

    const tableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "1rem",
        
        borderRadius: "8px",
        overflow: "hidden",
    };

    const thStyle = {
        backgroundColor: colors.yinmnBlue,
        color: "white",
        fontWeight: "600",
        padding: "1rem",
        textAlign: "left",
        fontSize: "0.9rem",
    };

    const tdStyle = {
        padding: "1rem",
        borderBottom: `1px solid ${colors.silverLakeBlue}`,
        fontSize: "0.95rem",
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6rem",
        border: `1px solid ${colors.silverLakeBlue}`,
        borderRadius: "6px",
        backgroundColor: "white",
        color: colors.richBlack,
        fontSize: "0.9rem",
        outline: "none",
    };

    const totalsStyle = {
        marginTop: "2rem",
        fontSize: "1.1rem",
        color: colors.oxfordBlue,
    };

    const buttonStyle = {
        backgroundColor: colors.yinmnBlue,
        color: "white",
        padding: "0.75rem 1.5rem",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "600",
        marginTop: "1rem",
        transition: "background-color 0.2s ease",
        "&:hover": {
            backgroundColor: colors.oxfordBlue,
        },
    };

    const savedQuotesTableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "2rem",
        
        borderRadius: "8px",
        overflow: "hidden",
    };

    const savedQuotesThStyle = {
        backgroundColor: colors.oxfordBlue,
        color: "white",
        fontWeight: "600",
        padding: "0.75rem",
        textAlign: "left",
        fontSize: "0.8rem",
    };

    const savedQuotesTdStyle = {
        padding: "0.75rem",
        borderBottom: `1px solid ${colors.silverLakeBlue}`,
        fontSize: "0.85rem",
    };

    const inputTitle = {
        width: "100%",
        padding: "0.6rem",
        border: `1px solid ${colors.silverLakeBlue}`,
        borderRadius: "6px",
        backgroundColor: "white",
        color: colors.richBlack,
        fontSize: "0.9rem",
        outline: "none",
    };

    const kebabMenuStyle = {
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
    };

    const kebabButton = {
        background: 'none',
        border: 'none',
        padding: '10',
        width: '20px',   /* Adjust as needed */
        height: '20px',  /* Adjust as needed */
        marginLeft: '-5px', /* Adjust negative margin to compensate */
        marginRight: '-5px',
        cursor: 'pointer',
    };

    const menuContentStyle = {
        position: 'absolute',
        right: 0,
        top: '100%',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '5px 0',
        zIndex: 1,
        minWidth: '150px',
    };

    const menuItemStyle = {
        padding: '8px 15px',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        display: 'block',
        width: '100%',
        cursor: 'pointer',
        ':hover': {
            backgroundColor: '#f0f0f0',
        },
    };

    return (
        <div style={pageStyle}>
            <Navbar onLogout={() => navigate("/login")} />
            <div style={containerStyle}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold">Job Management</h1>
                    <button
                        onClick={() => navigate("/client")}
                        style={buttonStyle}
                    >
                        ← Back to Homepage
                    </button>
                </div>

                <h1 style={headerStyle}>Job Management</h1>

                <form onSubmit={handleAddJob}>
                    <label htmlFor="jobName" style={{ display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem", }}>
                        Job Name:
                    </label>
                    <input
                        type="text"
                        id="jobName"
                        style={inputTitle}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter job name"
                        required
                    />

                    <label htmlFor="assignedTo" style={{ display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem", }}>
                        Assigned To:
                    </label>
                    <input
                        type="text"
                        id="assignedTo"
                        style={inputTitle}
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="Assign to"
                        required
                    />

                    <label htmlFor="dueDate" style={{ display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem", }}>
                        Due Date:
                    </label>
                    <input
                        type="date"
                        id="dueDate"
                        style={inputTitle}
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                    />

                    <label htmlFor="status" style={{ display: "block", marginBottom: "0.5rem", color: colors.oxfordBlue, fontWeight: "500", fontSize: "0.9rem", }}>
                        Status:
                    </label>
                    <select
                        id="status"
                        style={selectStyle}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                    >
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <button style={buttonStyle} type="submit">
                        {isEditing ? "Update Job" : "Add Job"}
                    </button>
                </form>

                {loading ? (
                    <p>Loading jobs for {company}...</p>
                ) : jobs.length === 0 ? (
                    <p>No jobs found for this client.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table style={savedQuotesTableStyle}>
                            <thead>
                                <tr>
                                    <th style={savedQuotesThStyle} onClick={() => toggleSort("name")}>Job Name</th>
                                    <th style={savedQuotesThStyle} onClick={() => toggleSort("status")}>Status</th>
                                    <th style={savedQuotesThStyle} onClick={() => toggleSort("assignedTo")}>Assigned</th>
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
                                        <td style={savedQuotesTdStyle}>{job.dueDate}</td>
                                        <td style={savedQuotesTdStyle}>
                                            <div style={kebabMenuStyle} ref={menuRef}>
                                                <button
                                                    style={kebabButton}
                                                    onClick={() => toggleMenu(job.id)}
                                                >
                                                    <FontAwesomeIcon icon={faEllipsisV} />
                                                </button>
                                                {menuOpen === job.id && (
                                                    <div style={menuContentStyle}>
                                                        <button
                                                            style={menuItemStyle}
                                                            onClick={() => {
                                                                handleEditJob(job);
                                                                toggleMenu(null);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            style={menuItemStyle}
                                                            onClick={() => {
                                                                handleDeleteJob(job.id);
                                                                toggleMenu(null);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/client/jobs/${job.id}`)}
                                                className="text-blue-400 hover:underline"
                                            >
                                                View
                                            </button>
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
