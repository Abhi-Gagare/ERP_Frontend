"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { api, FeeData, FeeStats, AdmissionFeeSummary } from "@/lib/api";

const statusStyle: Record<string, string> = {
  PAID:    "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  WAIVED:  "bg-gray-50 text-gray-500 border-gray-200",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const admissionStatusStyle: Record<string, string> = {
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  REVIEW:   "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function FeesPage() {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [fees, setFees]           = useState<FeeData[]>([]);
  const [stats, setStats]         = useState<FeeStats | null>(null);
  const [admSummaries, setAdmSummaries] = useState<AdmissionFeeSummary[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s, adm] = await Promise.all([
        api.fees.list(search, statusFilter, page),
        api.fees.stats(),
        api.fees.admissionsSummary(20),
      ]);
      setFees(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
      setStats(s);
      setAdmSummaries(adm);
    } catch {
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchFees, 300);
    return () => clearTimeout(t);
  }, [fetchFees]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fee Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage student fee payments</p>
        </div>
        <Link
          href="/dashboard/fees/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Fee Record
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Records", value: stats.total,     color: "text-gray-900",   sub: null },
            { label: "Paid",          value: stats.paid,      color: "text-green-600",  sub: null },
            { label: "Pending",       value: stats.pending,   color: "text-amber-600",  sub: null },
            { label: "Overdue",       value: stats.overdue,   color: "text-red-600",    sub: null },
            { label: "Total Billed",  value: fmt(stats.totalAmount),    color: "text-gray-900", sub: null },
            { label: "Collected",     value: fmt(stats.totalCollected), color: "text-indigo-600", sub: null },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Admissions panel */}
      {admSummaries.length > 0 && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900">Admissions — No Fee Records Yet</h2>
              <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {admSummaries.length}
              </span>
            </div>
            <Link href="/dashboard/admission" className="text-xs text-indigo-600 hover:underline font-medium">
              View all admissions →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {admSummaries.map((a) => (
              <div key={a.admissionId} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-600">
                    {a.studentName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Name + details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.studentName}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${admissionStatusStyle[a.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{a.program}</p>
                </div>

                {/* Admission ID */}
                <span className="font-mono text-xs text-gray-400 hidden md:block shrink-0">{a.admissionId}</span>

                {/* Fee summary */}
                <div className="text-right shrink-0 hidden lg:block">
                  {a.feeCount > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{fmt(a.totalBilled)} billed</p>
                      <p className="text-xs text-green-600">{fmt(a.totalPaid)} paid</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No fees added</p>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/dashboard/fees/new?admissionId=${a.admissionId}`}
                  className="shrink-0 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Fee
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search student, fee ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="WAIVED">Waived</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Fee ID", "Student", "Program", "Fee Type", "Amount", "Paid", "Balance", "Due Date", "Status", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center">
                  <svg className="w-5 h-5 animate-spin text-indigo-500 mx-auto" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </td></tr>
              ) : fees.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No fee records found. <Link href="/dashboard/fees/new" className="text-indigo-600 hover:underline">Add the first one →</Link>
                </td></tr>
              ) : fees.map((f) => {
                const overdue = f.status === "PENDING" && new Date(f.dueDate) < new Date();
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{f.feeId}</td>
                    <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{f.studentName}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{f.program}</td>
                    <td className="px-5 py-4 text-gray-700">{f.feeType}</td>
                    <td className="px-5 py-4 text-gray-900 font-medium">{fmt(f.amount)}</td>
                    <td className="px-5 py-4 text-green-600 font-medium">{fmt(f.amountPaid)}</td>
                    <td className={`px-5 py-4 font-medium ${f.balance > 0 ? "text-red-500" : "text-gray-400"}`}>{fmt(f.balance)}</td>
                    <td className={`px-5 py-4 text-xs whitespace-nowrap ${overdue ? "text-red-500 font-semibold" : "text-gray-500"}`}>
                      {new Date(f.dueDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle[f.status]}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/fees/${f.feeId}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{total} total records</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs">Previous</button>
              <span className="text-xs">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
