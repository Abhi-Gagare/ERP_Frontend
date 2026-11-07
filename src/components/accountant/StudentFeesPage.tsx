"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { accountantApi, type AdmissionOption, type FeeDetail } from "@/lib/accountant/api";
import type { DashboardFee, FeeStatus } from "@/lib/accountant/types";
import type { PageResponse } from "@/lib/api";
import FeeStatusBadge from "@/components/accountant/FeeStatusBadge";
import FinanceIcon from "@/components/accountant/FinanceIcon";
import StudentFeeDirectory from "@/components/accountant/StudentFeeDirectory";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN");
const errorMessage = (error: unknown) => (error as { message?: string })?.message || "Unable to load fees. Please try again.";
const input = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100";
const button = "rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50";

export default function StudentFeesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"students" | "charges">("students");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<PageResponse<DashboardFee> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (view !== "charges") return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      accountantApi.fees(search, status, page, controller.signal).then(result => { if (!controller.signal.aborted) setResult(result); })
        .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, status, page, version, view]);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900"><FinanceIcon name="students" className="h-7 w-7 text-violet-600" />Student Fee Management</h1><p className="mt-1 text-sm text-gray-500">Manage fees linked to existing admissions.</p></div>
      <button className={button} onClick={() => { setNotice(""); setAssigning(true); }}>+ Assign fee</button>
    </div>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    <div className="flex gap-2" role="group" aria-label="Fee management view">{([ ["students","Student accounts"], ["charges","Fee records"] ] as const).map(([key,label])=><button key={key} onClick={()=>setView(key)} aria-pressed={view===key} className={`rounded-xl px-4 py-2.5 text-sm font-medium ${view===key?"bg-indigo-600 text-white":"border border-gray-200 bg-white text-gray-600"}`}>{label}</button>)}</div>
    {view === "students" && <StudentFeeDirectory key={version} />}
    {view === "charges" && <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-[1fr_200px_auto]">
        <input aria-label="Search fees" maxLength={100} className={input} placeholder="Search student, admission ID, fee ID or program" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select aria-label="Fee status" className={input} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">All statuses</option>{["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"].map(s => <option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</option>)}</select>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm" onClick={() => setVersion(v => v+1)}><FinanceIcon name="refresh" className="h-4 w-4" />Refresh</button>
      </div>
      {error ? <div role="alert" className="p-8 text-center text-red-700">{error}<button onClick={() => setVersion(v => v+1)} className="ml-3 underline">Retry</button></div> : loading ? <p role="status" className="p-10 text-center text-gray-500">Loading fee records…</p> : !result?.content.length ? <div className="p-12 text-center"><FinanceIcon name="receipt" className="mx-auto mb-3 h-10 w-10 text-violet-300" /><h2 className="font-semibold text-gray-900">No fees found</h2><p className="mt-2 text-sm text-gray-500">Change your filters or assign a fee to an approved admission.</p></div> : <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{["Student", "Fee", "Amount", "Concession", "Paid", "Balance", "Due date", "Status", "Action"].map(h => <th key={h} className="whitespace-nowrap px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{result.content.map(f => <tr key={f.feeId} className="hover:bg-gray-50/70"><td className="px-5 py-4"><p className="font-medium text-gray-900">{f.studentName}</p><p className="text-xs text-gray-500">{f.admissionId} · {f.program}</p></td><td className="px-5 py-4">{f.feeType}<p className="text-xs text-gray-500">{f.feeId}</p></td><td className="whitespace-nowrap px-5 py-4">{money(f.amount)}</td><td className="whitespace-nowrap px-5 py-4 text-indigo-700">{money(f.concessionAmount)}</td><td className="whitespace-nowrap px-5 py-4 text-emerald-700">{money(f.amountPaid)}</td><td className="whitespace-nowrap px-5 py-4 font-medium">{money(f.balance)}</td><td className="whitespace-nowrap px-5 py-4">{date(f.dueDate)}</td><td className="px-5 py-4"><FeeStatusBadge status={f.status as FeeStatus} /></td><td className="px-5 py-4"><button className="font-medium text-violet-700 hover:underline" aria-label={`View fee ${f.feeId}`} onClick={() => setSelected(f.feeId)}>View</button></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-gray-100 p-5 text-sm"><span className="text-gray-500">{result.totalElements} records · Page {page+1} of {result.totalPages}</span><div className="flex gap-2"><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page === 0} onClick={() => setPage(p => p-1)}>Previous</button><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page+1 >= result.totalPages} onClick={() => setPage(p => p+1)}>Next</button></div></div>
      </>}
    </section>}
    {assigning && <AssignFeePanel close={() => setAssigning(false)} saved={id => { setAssigning(false); setSearch(""); setStatus(""); setPage(0); setVersion(v => v+1); setNotice(`Fee ${id} assigned successfully.`); }} />}
    {selected && <FeeDetails key={selected} id={selected} close={() => setSelected(null)} />}
  </div>;
}

function AssignFeePanel({ close, saved }: { close: () => void; saved: (id: string) => void }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus(); }, []);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [options, setOptions] = useState<PageResponse<AdmissionOption> | null>(null);
  const [student, setStudent] = useState<AdmissionOption | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      accountantApi.admissions(search, page, controller.signal).then(setOptions)
        .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page]);
  return <section ref={panel} tabIndex={-1} className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm" aria-label="Assign fee">
    <div className="mb-5 flex justify-between"><h2 className="text-lg font-semibold">Assign fee</h2><button disabled={saving} onClick={close} className="text-sm text-gray-500">Cancel</button></div>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    <label className="mb-2 block text-sm font-medium" htmlFor="admission-search">Find approved admission</label><input id="admission-search" className={input} value={search} maxLength={100} placeholder="Name, admission ID or program" onChange={e => { setSearch(e.target.value); setPage(0); }} />
    <div className="my-3 max-h-48 overflow-y-auto rounded-xl border border-gray-100">{loading ? <p className="p-4 text-sm text-gray-500">Loading admissions…</p> : options?.content.length ? options.content.map(a => <button key={a.admissionId} disabled={saving} onClick={() => setStudent(a)} className={`block w-full border-b border-gray-100 p-3 text-left text-sm ${student?.admissionId === a.admissionId ? "bg-violet-50 text-violet-800" : "hover:bg-gray-50"}`} aria-pressed={student?.admissionId === a.admissionId}>{a.studentName}<span className="ml-2 text-xs text-gray-500">{a.admissionId} · {a.program}</span></button>) : <p className="p-4 text-sm text-gray-500">No approved admissions found.</p>}</div>
    <div className="mb-5 flex gap-3 text-sm"><button disabled={loading || saving || page===0} className="disabled:opacity-40" onClick={() => setPage(p=>p-1)}>Previous</button><button disabled={loading || saving || !options || page+1>=options.totalPages} className="disabled:opacity-40" onClick={() => setPage(p=>p+1)}>Next admissions</button></div>
    {student && <p className="mb-4 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">Selected: {student.studentName} ({student.admissionId})</p>}
    <form onSubmit={async e => {
      e.preventDefault(); if (!student || saving) return;
      const data = new FormData(e.currentTarget); setSaving(true); setError("");
      try { const fee = await accountantApi.assignFee({ admissionId: student.admissionId, feeType: String(data.get("feeType")).trim(), amount: Number(data.get("amount")), dueDate: String(data.get("dueDate")), remarks: String(data.get("remarks")).trim() }); saved(fee.feeId); }
      catch (e) { setError(errorMessage(e)); setSaving(false); }
    }} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Fee type<input name="feeType" required maxLength={60} placeholder="e.g. Tuition" className={`${input} mt-2`} disabled={saving} /></label>
      <label className="text-sm font-medium">Amount (₹)<input name="amount" type="number" min="0.01" max="9999999999.99" step="0.01" required className={`${input} mt-2`} disabled={saving} /></label>
      <label className="text-sm font-medium">Due date<input name="dueDate" type="date" required className={`${input} mt-2`} disabled={saving} /></label>
      <label className="text-sm font-medium">Remarks (optional)<input name="remarks" maxLength={255} className={`${input} mt-2`} disabled={saving} /></label>
      <div className="sm:col-span-2"><button className={button} disabled={!student || saving}>{saving ? "Assigning…" : "Assign fee"}</button></div>
    </form>
  </section>;
}

function FeeDetails({ id, close }: { id: string; close: () => void }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus(); }, []);
  const [detail, setDetail] = useState<FeeDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { const c = new AbortController(); accountantApi.fee(id, c.signal).then(setDetail).catch(e => { if (!c.signal.aborted) setError(errorMessage(e)); }); return () => c.abort(); }, [id]);
  return <section ref={panel} tabIndex={-1} aria-label="Fee details" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex justify-between"><h2 className="text-lg font-semibold">Fee details</h2><button onClick={close} className="text-sm text-violet-700">Close</button></div>{error ? <p role="alert" className="mt-4 text-red-700">{error}</p> : !detail ? <p role="status" className="mt-4 text-gray-500">Loading…</p> : <><p className="mt-3 text-sm text-gray-500">{detail.fee.feeId}</p><dl className="mt-5 grid gap-5 sm:grid-cols-3">{[["Student", detail.fee.studentName], ["Admission", detail.fee.admissionId], ["Program", detail.fee.program], ["Fee type", detail.fee.feeType], ["Amount", money(detail.fee.amount)], ["Concession", money(detail.fee.concessionAmount)], ["Paid", money(detail.fee.amountPaid)], ["Collectible balance", money(detail.fee.balance)], ["Due date", date(detail.fee.dueDate)], ["Last paid date", detail.paidDate ? date(detail.paidDate) : "—"], ["Remarks", detail.remarks || "—"]].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl><div className="mt-5"><FeeStatusBadge status={detail.fee.status as FeeStatus} /></div><Link href="/accountant/collections" className="mt-5 inline-block text-sm font-medium text-violet-700">Fee Collection & Receipts →</Link></>}</section>;
}
