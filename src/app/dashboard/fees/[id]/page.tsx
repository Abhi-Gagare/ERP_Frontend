"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, FeeData } from "@/lib/api";

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

export default function FeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [fee, setFee]     = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pay modal
  const [paying, setPaying]         = useState(false);
  const [payAmount, setPayAmount]   = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState<string | null>(null);

  // Waive
  const [waiving, setWaiving]       = useState(false);

  useEffect(() => {
    api.fees.get(id)
      .then(setFee)
      .catch(() => setError("Fee record not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayLoading(true);
    setPayError(null);
    try {
      const updated = await api.fees.pay(id, parseFloat(payAmount), payRemarks || undefined);
      setFee(updated);
      setPaying(false);
      setPayAmount("");
      setPayRemarks("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPayError(e?.message || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  const handleWaive = async () => {
    if (!confirm("Mark this fee as waived?")) return;
    setWaiving(true);
    try {
      const updated = await api.fees.waive(id, "Waived by admin");
      setFee(updated);
    } finally {
      setWaiving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-5 h-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  if (error || !fee) return <div className="text-center py-20 text-gray-500">{error ?? "Not found"}</div>;

  const canPay   = fee.status === "PENDING" || fee.status === "PARTIAL" || fee.status === "OVERDUE";
  const canWaive = fee.status !== "PAID" && fee.status !== "WAIVED";
  const pct      = fee.amount > 0 ? Math.round((fee.amountPaid / fee.amount) * 100) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/fees" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{fee.feeType}</h1>
          <p className="text-gray-500 text-sm">{fee.studentName} · {fee.admissionId}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusStyle[fee.status]}`}>
          {fee.status}
        </span>
      </div>

      {/* Progress card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">{fmt(fee.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Balance Due</p>
            <p className={`text-2xl font-bold ${fee.balance > 0 ? "text-red-500" : "text-green-600"}`}>{fmt(fee.balance)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${fee.status === "PAID" ? "bg-green-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Paid: {fmt(fee.amountPaid)} ({pct}%)</span>
          <span>Due: {new Date(fee.dueDate).toLocaleDateString("en-IN")}</span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Fee Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Fee ID",      fee.feeId],
            ["Student",     fee.studentName],
            ["Admission ID", fee.admissionId],
            ["Program",     fee.program],
            ["Fee Type",    fee.feeType],
            ["Due Date",    new Date(fee.dueDate).toLocaleDateString("en-IN")],
            ["Paid Date",   fee.paidDate ? new Date(fee.paidDate).toLocaleDateString("en-IN") : "—"],
            ["Remarks",     fee.remarks || "—"],
            ["Created",     new Date(fee.createdAt).toLocaleDateString("en-IN")],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start gap-2">
              <span className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
              <span className="text-gray-800 font-medium text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {(canPay || canWaive) && (
        <div className="flex gap-3">
          {canPay && (
            <button
              onClick={() => setPaying(true)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Record Payment
            </button>
          )}
          {canWaive && (
            <button
              onClick={handleWaive}
              disabled={waiving}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
            >
              {waiving ? "Waiving…" : "Waive Fee"}
            </button>
          )}
        </div>
      )}

      {/* Pay modal */}
      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Record Payment</h2>
            <p className="text-gray-500 text-sm mb-6">Balance due: <strong className="text-red-500">{fmt(fee.balance)}</strong></p>

            {payError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{payError}</div>
            )}

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  max={fee.balance}
                  step="0.01"
                  placeholder={`Max ${fmt(fee.balance)}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cash payment"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={payLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {payLoading ? "Processing…" : "Confirm Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPaying(false); setPayError(null); }}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
