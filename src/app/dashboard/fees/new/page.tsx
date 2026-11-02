"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const FEE_TYPES = ["Tuition Fee", "Hostel Fee", "Library Fee", "Exam Fee", "Lab Fee", "Sports Fee", "Transport Fee", "Miscellaneous"];

export default function NewFeePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    admissionId: searchParams.get("admissionId") ?? "",
    feeType: "",
    amount: "",
    dueDate: "",
    remarks: "",
  });

  // keep admissionId in sync if query param arrives after hydration
  useEffect(() => {
    const id = searchParams.get("admissionId");
    if (id) setForm(f => ({ ...f, admissionId: id }));
  }, [searchParams]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [lookingUp, setLookingUp]     = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const lookupAdmission = async (id: string) => {
    if (!id.trim()) { setStudentName(null); return; }
    setLookingUp(true);
    try {
      const adm = await api.admissions.get(id.trim());
      setStudentName(`${adm.firstName} ${adm.lastName} · ${adm.program}`);
    } catch {
      setStudentName(null);
    } finally {
      setLookingUp(false);
    }
  };

  // auto-lookup when pre-filled from query param
  useEffect(() => {
    if (form.admissionId) lookupAdmission(form.admissionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fee = await api.fees.create({
        admissionId: form.admissionId,
        feeType: form.feeType,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        remarks: form.remarks || null,
      });
      router.push(`/dashboard/fees/${fee.feeId}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to create fee record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/fees" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Fee Record</h1>
          <p className="text-gray-500 text-sm">Add a fee record for a student</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
        {/* Admission ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Admission ID <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. ADM-2026-0001"
              value={form.admissionId}
              onChange={(e) => { set("admissionId", e.target.value); setStudentName(null); }}
              onBlur={(e) => lookupAdmission(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 font-mono placeholder-gray-400"
            />
            {lookingUp && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
          </div>
          {studentName ? (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {studentName}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Enter the admission ID — student name will appear on verification</p>
          )}
        </div>

        {/* Fee Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Fee Type <span className="text-red-500">*</span></label>
          <select
            value={form.feeType}
            onChange={(e) => set("feeType", e.target.value)}
            required
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 bg-white"
          >
            <option value="">Select fee type…</option>
            {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Amount + Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 50000"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
          <textarea
            rows={3}
            placeholder="Optional notes…"
            value={form.remarks}
            onChange={(e) => set("remarks", e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 resize-none placeholder-gray-400"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {submitting ? "Creating…" : "Create Fee Record"}
          </button>
          <Link href="/dashboard/fees" className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
