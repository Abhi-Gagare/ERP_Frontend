"use client";

import { useEffect, useState } from "react";
import { api, StudentData } from "@/lib/api";

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [programOptions, setProgramOptions] = useState<string[]>([]);

  useEffect(() => {
    api.programs.list("", "ACTIVE", 0).then((res) => {
      const progs = res.content.flatMap((d) => d.programs ?? []);
      setProgramOptions([...new Set(progs)].sort());
    }).catch(() => {});
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const active = activeFilter === "" ? undefined : activeFilter === "true";
      const res = await api.students.list(search, programFilter, active, page);
      setStudents(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudents(); }, [search, programFilter, activeFilter, page]);

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Enrolled students — provisioned from approved admissions</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
          {totalElements} total
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, email, roll no…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={programFilter}
          onChange={(e) => { setProgramFilter(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Programs</option>
          {programOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as "" | "true" | "false"); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-lg">No students found</p>
            <p className="text-slate-400 text-sm mt-1">Students appear here when an admission is approved</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Roll No.", "Name", "Email", "Program", "Sem", "Batch", "Enrolled", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{s.rollNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.fullName}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.email}</td>
                  <td className="px-4 py-3 text-slate-600">{s.program}</td>
                  <td className="px-4 py-3 text-slate-600">{s.semester}</td>
                  <td className="px-4 py-3 text-slate-600">{s.batchYear}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.enrollmentDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        // expand a quick detail row inline — simple approach
                      }}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page + 1} of {totalPages} · {totalElements} students
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                ← Prev
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
