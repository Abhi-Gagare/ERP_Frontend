"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, CourseData } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  UPCOMING: "bg-blue-100 text-blue-700",
};

const STATUS_OPTIONS = ["", "ACTIVE", "INACTIVE", "UPCOMING"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [status, setStatus] = useState("");
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

  const [stats, setStats] = useState({ total: 0, active: 0, upcoming: 0, totalSeats: 0 });

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await api.courses.list(search, programFilter, status, page);
      setCourses(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);

      const s = { total: res.totalElements, active: 0, upcoming: 0, totalSeats: 0 };
      res.content.forEach((c) => {
        if (c.status === "ACTIVE") s.active++;
        if (c.status === "UPCOMING") s.upcoming++;
        s.totalSeats += c.totalSeats;
      });
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCourses(); }, [search, programFilter, status, page]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic programs and fee structures</p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Courses", value: stats.total, color: "text-slate-700" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Upcoming", value: stats.upcoming, color: "text-blue-600" },
          { label: "Total Seats", value: stats.totalSeats, color: "text-indigo-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search courses…"
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
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-lg">No courses found</p>
            <Link href="/dashboard/courses/new" className="mt-3 inline-block text-indigo-600 text-sm hover:underline">
              Add your first course →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Course Code", "Name", "Program", "Credits", "Seats", "Fee/Sem", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{c.courseCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.level} · {c.mode}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.program}</td>
                  <td className="px-4 py-3 text-slate-600">{c.credits}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-800 font-medium">{c.availableSeats}</span>
                    <span className="text-slate-400">/{c.totalSeats}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {c.totalFeePerSemester > 0 ? fmt(c.totalFeePerSemester) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/courses/${c.courseCode}`}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      View →
                    </Link>
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
              Page {page + 1} of {totalPages} · {totalElements} courses
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
