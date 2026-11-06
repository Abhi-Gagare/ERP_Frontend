"use client";

import { useEffect, useState } from "react";
import type { FeeStats } from "@/lib/api";
import { accountantApi } from "@/lib/accountant/api";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function AccountantDashboard() {
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    accountantApi.overview().then(data => { if (active) setStats(data); })
      .catch(() => { if (active) setError("Unable to load financial records. Please refresh to try again."); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900">Financial overview</h1>
      <p className="mt-2 text-sm text-gray-500">All-time totals from university fee records.</p>
      {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : !stats ? <p role="status" className="mt-6 text-gray-500">Loading fee records…</p> : <>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total billed", currency.format(stats.totalAmount)],
            ["Total collected", currency.format(stats.totalCollected)],
            ["Fee records", String(stats.total)],
            ["Fully paid records", String(stats.paid)],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p></div>)}
        </div>
        {stats.total === 0 && <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6"><h2 className="font-semibold text-gray-900">No fee records yet</h2><p className="mt-2 text-sm text-gray-500">Financial totals will update when fee records and payments are recorded in the ERP.</p></div>}
      </>}
    </div>
  );
}
