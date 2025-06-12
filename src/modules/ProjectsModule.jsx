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

  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

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
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProjects(data);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [company]);

  const sortedProjects = [...projects].sort((a, b) => {
    const aVal = a[sortKey]?.toLowerCase?.() || a[sortKey] || "";
    const bVal = b[sortKey]?.toLowerCase?.() || b[sortKey] || "";
    return sortOrder === "asc"
      ? aVal > bVal ? 1 : -1
      : aVal < bVal ? 1 : -1;
  });

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  async function handleAddProject(e) {
    e.preventDefault();
    if (!newName) return alert("Please enter a project name");

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Projects</h1>
          <button
            onClick={() => navigate("/client")}
            className="text-sm font-medium px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition"
          >
            ← Back to Homepage
          </button>
        </div>

        {loading ? (
          <p>Loading projects for {company}...</p>
        ) : projects.length === 0 ? (
          <p>No projects found for this client.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow mb-10">
            <table className="min-w-full table-auto border border-gray-600 bg-[#0f172a] text-sm">
              <thead className="bg-[#1e293b] text-gray-300 text-left">
                <tr>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white"
                    onClick={() => toggleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      <span className="w-4 inline-block">
                        {sortKey === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white"
                    onClick={() => toggleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <span className="w-4 inline-block">
                        {sortKey === "status" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-white"
                    onClick={() => toggleSort("targetdate")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Target Date</span>
                      <span className="w-4 inline-block">
                        {sortKey === "targetdate" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p) => (
                  <tr key={p.id} className="border-t border-gray-700 hover:bg-[#1e293b] transition">
                    <td className="px-4 py-3">{p.name || "-"}</td>
                    <td className="px-4 py-3">{p.status || "-"}</td>
                    <td className="px-4 py-3">{p.targetdate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
