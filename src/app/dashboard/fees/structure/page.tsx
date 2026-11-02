"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, CourseData } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  UPCOMING: "bg-blue-100 text-blue-700",
};

export default function FeeStructurePage() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
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

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await api.courses.list(search, programFilter, "ACTIVE", page);
      setCourses(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCourses(); }, [search, programFilter, page]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fee Structure</h1>
          <p className="text-slate-500 text-sm mt-1">Course-wise fee breakdown for all active programs</p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by course name, code or program…"
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
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading…</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No courses found</p>
          <Link href="/dashboard/courses/new" className="mt-2 inline-block text-indigo-600 text-sm hover:underline">
            Add a course →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Course header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.courseCode}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    </div>
                    <p className="text-base font-semibold text-slate-800 mt-1">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.program} · {c.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-400">Per Semester</p>
                    <p className="text-lg font-bold text-slate-800">{c.totalFeePerSemester > 0 ? fmt(c.totalFeePerSemester) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Per Year</p>
                    <p className="text-lg font-bold text-slate-800">{c.totalFeePerYear > 0 ? fmt(c.totalFeePerYear) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">One-time</p>
                    <p className="text-lg font-bold text-slate-800">{c.totalOneTime > 0 ? fmt(c.totalOneTime) : "—"}</p>
                  </div>
                  <Link
                    href={`/dashboard/courses/${c.courseCode}`}
                    className="ml-2 text-xs text-indigo-600 hover:underline font-medium"
                  >
                    Edit →
                  </Link>
                </div>
              </div>

              {/* Fee components */}
              {c.feeComponents.length > 0 && (
                <div className="px-6 py-3 bg-slate-50">
                  <div className="flex flex-wrap gap-3">
                    {c.feeComponents.map((fc) => (
                      <div key={fc.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
                        <span className="text-slate-500">{fc.feeType}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-semibold text-slate-700">{fmt(fc.amount)}</span>
                        <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-xs ml-1">{fc.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">{totalElements} courses</span>
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
  );
}
