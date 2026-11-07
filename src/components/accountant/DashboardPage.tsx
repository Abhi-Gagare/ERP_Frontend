"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { accountantApi } from "@/lib/accountant/api";
import type { FinanceDashboard, FeeStatus } from "@/lib/accountant/types";
import FinanceIcon from "@/components/accountant/FinanceIcon";
import FinanceStatCard from "@/components/accountant/FinanceStatCard";
import DashboardAttention from "@/components/accountant/DashboardAttention";
import FeeStatusBadge from "@/components/accountant/FeeStatusBadge";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const count = new Intl.NumberFormat("en-IN");
function date(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }

export default function AccountantDashboard() {
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 20000);
    accountantApi.dashboard(controller.signal).then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted || controller.signal.reason === "timeout") setError("Financial records could not be loaded. Please try again."); })
      .finally(() => { clearTimeout(timeout); if (!controller.signal.aborted || controller.signal.reason === "timeout") setLoading(false); });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [refresh]);

  function reload() { setLoading(true); setError(""); setRefresh(value => value + 1); }
  const collectible = data ? data.totalCollected + data.outstanding : 0;
  const collectionRate = collectible > 0 && data ? Math.min(100, data.totalCollected / collectible * 100) : 0;
  const statuses: { status: FeeStatus; label: string; value: number; color: string }[] = data ? [
    { status: "PAID", label: "Settled", value: data.paid, color: "bg-emerald-500" },
    { status: "PENDING", label: "Pending", value: data.pending, color: "bg-amber-400" },
    { status: "PARTIAL", label: "Partial", value: data.partial, color: "bg-blue-500" },
    { status: "OVERDUE", label: "Overdue", value: data.overdue, color: "bg-red-500" },
    { status: "WAIVED", label: "Waived", value: data.waived, color: "bg-slate-400" },
  ] : [];

  return <div className="mx-auto max-w-7xl space-y-6" aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">Accounts &amp; Finance</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Financial Overview</h1><p className="mt-1 text-sm text-gray-500">Fee-account balances, overdue aging and upcoming dues.</p></div><div className="flex items-center gap-3"><span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">All time</span><button type="button" onClick={reload} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"><FinanceIcon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />{loading ? "Refreshing…" : "Refresh"}</button></div></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={reload} disabled={loading} className="font-semibold underline">Try again</button></div>}
    {data && error && <p role="status" className="text-sm text-amber-800">Showing the last successful snapshot. Refresh to get current balances.</p>}
    {!data ? loading && <div role="status" aria-label="Loading financial overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(item => <div key={item} className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 motion-reduce:animate-none"><div className="h-3 w-24 rounded bg-gray-100" /><div className="mt-6 h-7 w-32 rounded bg-gray-100" /></div>)}</div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceStatCard label="Total billed" value={currency.format(data.totalBilled)} detail={`${count.format(data.totalRecords)} records · ${currency.format(data.totalConcessions)} concessions`} icon="receipt" tone="indigo" />
        <FinanceStatCard label="Net collected" value={currency.format(data.totalCollected)} detail="Recorded payments less paid refunds" icon="payment" tone="green" />
        <FinanceStatCard label="Outstanding fees" value={currency.format(data.outstanding)} detail="Unpaid balances, excluding waivers" icon="clock" tone="amber" />
        <FinanceStatCard label="Overdue fees" value={currency.format(data.overdueAmount)} detail={`${count.format(data.overdue)} overdue records · included in outstanding`} icon="alert" tone="red" />
      </div>
      {data.totalRecords === 0 && <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600"><FinanceIcon name="receipt" className="h-6 w-6" /></span><div><h2 className="font-semibold text-gray-900">Your financial overview is ready</h2><p className="mt-1 text-sm text-gray-500">There are no fee records yet. Collections and balances will appear here once fees are recorded.</p></div></section>}
      <DashboardAttention data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><FinanceIcon name="budget" className="h-5 w-5 text-indigo-500" /><h2 className="text-sm font-semibold text-gray-900">Collection progress</h2></div><div className="mt-5 flex items-end justify-between"><span className="text-3xl font-bold text-gray-900">{collectionRate.toFixed(1)}<span className="ml-0.5 text-lg text-gray-400">%</span></span><span className="text-xs text-gray-500">of collectible fees</span></div><div role="progressbar" aria-label="Fee collection progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(collectionRate.toFixed(1))} className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${collectionRate}%` }} /></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-gray-500">Net collected</dt><dd className="font-medium text-gray-900">{currency.format(data.totalCollected)}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Paid refunds</dt><dd className="font-medium text-gray-900">{currency.format(data.totalRefunded)}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Posted concessions</dt><dd className="font-medium text-indigo-700">{currency.format(data.totalConcessions)}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Still outstanding</dt><dd className="font-medium text-gray-900">{currency.format(data.outstanding)}</dd></div><div className="flex justify-between gap-4 border-t border-gray-100 pt-3"><dt className="text-gray-500">Waived unpaid balance</dt><dd className="font-medium text-gray-600">{currency.format(data.waivedBalance)}</dd></div></dl></section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><FinanceIcon name="reports" className="h-5 w-5 text-indigo-500" /><h2 className="text-sm font-semibold text-gray-900">Fee status breakdown</h2></div><span className="text-xs text-gray-400">{count.format(data.totalRecords)} records</span></div><div aria-hidden="true" className="mt-6 flex h-3 overflow-hidden rounded-full bg-gray-100">{statuses.map(item => <span key={item.status} className={item.color} style={{ width: `${data.totalRecords ? item.value / data.totalRecords * 100 : 0}%` }} />)}</div><dl className="mt-5 space-y-3">{statuses.map(item => <div key={item.status} className="flex items-center justify-between gap-3 text-sm"><dt className="flex items-center gap-2 text-gray-600"><span className={`h-2 w-2 rounded-full ${item.color}`} />{item.label}</dt><dd className="font-medium text-gray-900">{count.format(item.value)}</dd></div>)}</dl></section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4"><FinanceIcon name="history" className="h-5 w-5 text-indigo-500" /><h2 className="text-sm font-semibold text-gray-900">Recent fee records</h2><span className="ml-auto text-xs text-gray-400">Latest 8</span><Link href="/accountant/fees" className="text-xs font-medium text-indigo-700 hover:underline">View fees</Link></div>{data.recentFees.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">No fee records to display.</p> : <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Most recently created student fee records</caption><thead className="bg-gray-50 text-xs font-medium text-gray-500"><tr>{["Fee / Student", "Fee type", "Billed", "Net collected", "Balance", "Due date", "Status"].map(label => <th key={label} scope="col" className="px-6 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{data.recentFees.map(fee => <tr key={fee.feeId} className="hover:bg-gray-50/60"><td className="px-6 py-4"><p className="font-medium text-gray-900">{fee.studentName}</p><p className="mt-1 text-xs text-gray-400">{fee.feeId} · {fee.program}</p></td><td className="px-6 py-4 text-gray-600">{fee.feeType}</td><td className="px-6 py-4 text-gray-700">{currency.format(fee.amount)}{fee.concessionAmount>0&&<p className="mt-1 text-xs text-indigo-700">Concession {currency.format(fee.concessionAmount)}</p>}</td><td className="px-6 py-4 text-emerald-700">{currency.format(fee.amountPaid)}</td><td className="px-6 py-4 font-medium text-gray-900">{currency.format(fee.balance)}</td><td className="px-6 py-4 text-gray-500">{date(fee.dueDate)}</td><td className="px-6 py-4"><FeeStatusBadge status={fee.status} /></td></tr>)}</tbody></table></div>}</section>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2"><div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4"><FinanceIcon name="clock" className="h-5 w-5 text-indigo-500" /><h2 className="text-sm font-semibold text-gray-900">Due in the next 7 days</h2></div>{data.upcomingDues.length === 0 ? <div className="flex items-center gap-3 p-6 text-sm text-gray-500"><FinanceIcon name="check" className="h-5 w-5 text-emerald-500" />No upcoming dues in this period.</div> : <ul className="divide-y divide-gray-100">{data.upcomingDues.map(fee => <li key={fee.feeId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"><div><p className="text-sm font-medium text-gray-900">{fee.studentName}</p><p className="mt-1 text-xs text-gray-500">{fee.feeType} · {fee.feeId}</p></div><div className="text-right"><p className="text-sm font-semibold text-gray-900">{currency.format(fee.balance)}</p><p className="mt-1 text-xs text-gray-500">Due {date(fee.dueDate)}</p></div></li>)}</ul>}</section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-sm font-semibold text-gray-900">Finance workspace</h2><div className="mt-4 space-y-2">{[{ label: "Student fees", href: "/accountant/fees", icon: "students" as const }, { label: "Collections & receipts", href: "/accountant/collections", icon: "payment" as const }, { label: "Pending fees", href: "/accountant/defaulters", icon: "clock" as const }].map(link => <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600"><FinanceIcon name={link.icon} /><span className="flex-1">{link.label}</span><FinanceIcon name="arrow" className="h-4 w-4 text-gray-400" /></Link>)}</div></section>
      </div>
      <p className="text-right text-xs text-gray-400">As of {date(data.asOf)} · All-time fee totals · Updated {new Date(data.generatedAt).toLocaleTimeString("en-IN")}</p>
    </>}
  </div>;
}
