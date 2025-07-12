// src/modules/JobDetail.jsx (Updated with File Uploads)
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc, onSnapshot, query, deleteDoc as deleteFileDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { AuthContext } from '../AuthContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';

export default function JobDetail() {
  const { id: jobId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW: State for file management ---
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [jobFiles, setJobFiles] = useState([]);

  useEffect(() => {
    const jobDocRef = doc(db, "jobs", jobId);
    const unsubscribeJob = onSnapshot(jobDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setJob({ 
            id: snapshot.id, 
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate) : null
        });
      } else {
        setError("Job not found");
      }
      setLoading(false);
    }, (err) => {
      setError("Failed to fetch job");
      console.error(err);
      setLoading(false);
    });

    // --- NEW: Listener for job files ---
    const filesQuery = query(collection(db, "jobs", jobId, "files"));
    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
        const filesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobFiles(filesData);
    });

    return () => {
        unsubscribeJob();
        unsubscribeFiles();
    };
  }, [jobId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const jobRef = doc(db, "jobs", job.id);
      const dataToUpdate = {
        ...job,
        dueDate: job.dueDate ? job.dueDate.toISOString().split('T')[0] : ""
      };
      await updateDoc(jobRef, dataToUpdate);
      alert("Job updated successfully!");
    } catch (err) {
      alert("Failed to update job");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteJob = async () => {
    if (window.confirm("Are you sure you want to delete this job and all its files?")) {
      try {
        // Note: Deleting associated files from storage should be handled here
        // or via a Cloud Function Trigger for robustness.
        await deleteDoc(doc(db, "jobs", jobId));
        navigate("/client/jobs");
      } catch (err) { alert("Failed to delete job"); }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJob(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- NEW: File upload handler ---
  const handleFileUpload = () => {
    if (!fileToUpload || !currentUser?.company || !jobId) return;

    setIsUploading(true);
    const storagePath = `jobs/${currentUser.company}/${jobId}/${fileToUpload.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload failed:", error);
        alert("File upload failed.");
        setIsUploading(false);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          const filesCollectionRef = collection(db, "jobs", jobId, "files");
          await addDoc(filesCollectionRef, {
            name: fileToUpload.name,
            url: downloadURL,
            path: storagePath,
            uploadedAt: new Date(),
          });
          setFileToUpload(null);
          setIsUploading(false);
          setUploadProgress(0);
        });
      }
    );
  };

  // --- NEW: File delete handler ---
  const handleFileDelete = async (file) => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
        try {
            const fileStorageRef = ref(storage, file.path);
            await deleteObject(fileStorageRef);
            
            const fileDocRef = doc(db, "jobs", jobId, "files", file.id);
            await deleteFileDoc(fileDocRef);
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Failed to delete file.");
        }
    }
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
        <h1 className="text-3xl font-extrabold text-brand-dark">Job Details</h1>
        <p className="text-gray-500 mt-1">Manage information and files for: <span className="font-bold">{job.name}</span></p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Details Form */}
        <div className="lg:col-span-2">
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
                    <button type="button" onClick={handleDeleteJob} className="text-red-600 hover:text-red-800 font-medium">
                    Delete Job
                    </button>
                </div>
            </form>
        </div>

        {/* Right Column: File Management */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-brand-dark mb-4">Job Files</h2>
                
                {/* File Upload Input */}
                <div className="mb-4">
                    <input type="file" id="file-input" className="hidden" onChange={(e) => setFileToUpload(e.target.files[0])} />
                    <label htmlFor="file-input" className="w-full text-center cursor-pointer bg-gray-100 p-4 rounded-md border border-dashed border-gray-300 hover:bg-gray-200 block">
                        <FontAwesomeIcon icon={faUpload} className="mr-2" />
                        {fileToUpload ? fileToUpload.name : 'Select a file'}
                    </label>
                </div>

                {/* Upload Button & Progress Bar */}
                {fileToUpload && (
                    <div className="mb-4">
                        <button onClick={handleFileUpload} disabled={isUploading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400">
                            {isUploading ? `Uploading ${uploadProgress.toFixed(0)}%` : 'Upload File'}
                        </button>
                        {isUploading && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                )}

                {/* List of Uploaded Files */}
                <div className="space-y-2">
                    {jobFiles.length > 0 ? jobFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-700 hover:underline truncate">
                                <FontAwesomeIcon icon={faFile} className="mr-2 flex-shrink-0" />
                                <span className="truncate">{file.name}</span>
                            </a>
                            <button onClick={() => handleFileDelete(file)} className="text-red-500 hover:text-red-700 ml-4">
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-500 text-center">No files uploaded for this job.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
