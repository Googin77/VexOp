import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function ProjectsModule({ company }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProjects() {
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "projects"), where("company", "==", company));
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [company]);

  async function handleAddProject(e) {
    e.preventDefault();

    if (!newName) {
      alert("Please enter a project name");
      return;
    }

    const newProject = {
      name: newName,
      status: newStatus,
      targetdate: newTargetDate,
      company,
    };

    try {
      setLoading(true);
      await addDoc(collection(db, "projects"), newProject);
      setNewName("");
      setNewStatus("");
      setNewTargetDate("");

      const q = query(collection(db, "projects"), where("company", "==", company));
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error adding project:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
      <Navbar onLogout={() => navigate("/login")} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Projects</h1>

        {loading ? (
          <p>Loading projects for {company}...</p>
        ) : projects.length === 0 ? (
          <p>No projects found for this client.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#0f172a] p-4 rounded-xl border border-gray-600 shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                <p className="text-sm text-gray-400 mb-1">Status: {project.status || "N/A"}</p>
                <p className="text-sm text-gray-400">Target Date: {project.targetdate || "N/A"}</p>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAddProject}
          className="bg-[#1e293b] p-6 rounded-xl shadow-xl space-y-4 border border-gray-600"
        >
          <h2 className="text-2xl font-semibold mb-4">Add New Project</h2>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Project Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="p-3 rounded bg-[#0f172a] border border-gray-600 text-white placeholder-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="p-3 rounded bg-[#0f172a] border border-gray-600 text-white placeholder-gray-400"
            />
            <input
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="p-3 rounded bg-[#0f172a] border border-gray-600 text-white"
            />
            <button
              type="submit"
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
