"use client";

import { useEffect, useState } from "react";
import { structureApi, type StructureCourse, type StructureDetail } from "@/lib/accountant/structures";
import type { PageResponse } from "@/lib/api";
import FinanceIcon from "./FinanceIcon";

const input = "mt-2 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50";
const money = (cents: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cents / 100);
type Head = { id: string; feeHead: string; amount: string };
type Installment = { id: string; name: string; dueDate: string; heads: Head[] };
const newHead = (): Head => ({ id: crypto.randomUUID(), feeHead: "", amount: "" });
const newInstallment = (number: number): Installment => ({ id: crypto.randomUUID(), name: `Installment ${number}`, dueDate: "", heads: [newHead()] });
const cents = (amount: string) => Math.round(Number(amount || 0) * 100);

export default function StructureForm({ close, saved }: { close: () => void; saved: (s: StructureDetail) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [courses, setCourses] = useState<PageResponse<StructureCourse> | null>(null);
  const [course, setCourse] = useState<StructureCourse | null>(null);
  const [installments, setInstallments] = useState<Installment[]>(() => [newInstallment(1)]);
  const [semester, setSemester] = useState("1");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [batchScope, setBatchScope] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setCourseError("");
      structureApi.courses(search, page, controller.signal)
        .then(result => { if (!controller.signal.aborted) setCourses(result); })
        .catch(() => { if (!controller.signal.aborted) setCourseError("Courses could not be loaded."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page, retry]);

  const lineCount = installments.reduce((sum, i) => sum + i.heads.length, 0);
  const total = installments.reduce((sum, i) => sum + i.heads.reduce((subtotal, h) => subtotal + cents(h.amount), 0), 0);
  const changeInstallment = (id: string, patch: Partial<Installment>) => setInstallments(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  function importCourse() {
    if (!course) return;
    if (installments.some(i => i.heads.some(h => h.feeHead || h.amount)) && !window.confirm("Replace the current installment lines with the selected course fees?")) return;
    const first = newInstallment(1);
    first.heads = course.components.map(h => ({ id: crypto.randomUUID(), feeHead: h.feeHead, amount: String(h.amount) }));
    setInstallments([first]);
  }

  return <section className="rounded-2xl border border-indigo-100 bg-white shadow-sm" aria-labelledby="structure-form-title">
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5 sm:px-6"><h2 id="structure-form-title" className="flex items-center gap-2 font-semibold text-gray-900"><FinanceIcon name="structure" />Create fee structure</h2><button type="button" disabled={busy} onClick={close} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">Cancel</button></div>
    <form className="space-y-6 p-5 sm:p-6" onSubmit={async e => {
      e.preventDefault(); if (busy) return;
      if (!course) { setError("Select an active course before saving."); return; }
      if ((start && !end) || (!start && end)) { setError("Enter both schedule dates or leave both blank."); return; }
      const names = installments.map(i => i.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) { setError("Each installment needs a unique name."); return; }
      const form = new FormData(e.currentTarget); setBusy(true); setError("");
      try {
        saved(await structureApi.create({ name: String(form.get("name")).trim(), courseId: course.id, academicYear: Number(year), semester: Number(semester),
          batchYear: batchScope === "specific" ? Number(form.get("batchYear")) : null,
          effectiveFrom: start || null, effectiveUntil: end || null, notes: String(form.get("notes")).trim(),
          lines: installments.flatMap(i => i.heads.map(h => ({ feeHead: h.feeHead.trim(), installment: i.name.trim(), amount: Number(h.amount), dueDate: i.dueDate }))) }));
      } catch (e) { setError((e as { message?: string }).message || "Unable to save structure."); setBusy(false); }
    }}>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <section className="space-y-4" aria-labelledby="applicability-title">
          <h3 id="applicability-title" className="text-sm font-semibold text-gray-900">1. Course &amp; applicability</h3>
          <label className="block text-sm text-gray-600">Find active course <span className="text-red-600">*</span><input className={input} maxLength={100} placeholder="Search course name or program" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100" aria-busy={loading}>
            {courseError ? <div role="alert" className="p-4 text-sm text-red-700">{courseError}<button type="button" onClick={() => setRetry(v => v + 1)} className="ml-3 underline">Retry</button></div>
              : loading ? <p role="status" className="p-4 text-sm text-gray-500">Loading courses…</p>
              : courses?.content.length ? courses.content.map(c => <button type="button" key={c.id} aria-pressed={course?.id === c.id} onClick={() => {
                if (course && course.id !== c.id && installments.some(i => i.heads.some(h => h.feeHead || h.amount))) {
                  if (!window.confirm("Changing course clears existing fee lines. Continue?")) return;
                  setInstallments([newInstallment(1)]);
                }
                setCourse(c);
              }} className={`flex w-full items-center justify-between gap-3 border-b border-gray-100 p-3 text-left text-sm last:border-0 ${course?.id === c.id ? "bg-indigo-50 text-indigo-800" : "hover:bg-gray-50"}`}><span><span className="font-medium">{c.name}</span><span className="mt-1 block text-xs text-gray-500">{c.program}</span></span>{course?.id === c.id && <FinanceIcon name="check" />}</button>)
                : <div className="p-5 text-sm"><p className="font-medium text-gray-700">{search ? "No matching active courses" : "No active courses available"}</p><p className="mt-2 text-gray-500">{search ? "Try another search or clear the search field." : "Ask your Admin to add or activate a course in the shared course catalog."}</p><button type="button" onClick={() => { setSearch(""); setPage(0); setRetry(v => v + 1); }} className="mt-3 font-medium text-indigo-700">{search ? "Clear search" : "Refresh courses"}</button></div>}
          </div>
          {(courses?.totalPages || 0) > 1 && <div className="flex items-center gap-4 text-xs text-gray-500"><button type="button" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40">Previous courses</button><span>Page {page + 1} of {courses?.totalPages}</span><button type="button" disabled={!courses || page + 1 >= courses.totalPages || loading} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40">Next courses</button></div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm text-gray-600">Selected course<input readOnly value={course?.name || "Select a course above"} className={`${input} bg-gray-50`} /></label>
            <label className="text-sm text-gray-600">Program / department (from course)<input readOnly value={course?.program || "—"} className={`${input} bg-gray-50`} /></label>
            <label className="text-sm text-gray-600">Eligible batch<select name="batchScope" value={batchScope} onChange={e => setBatchScope(e.target.value)} className={input}><option value="all">All batches</option><option value="specific">Specific admission batch</option></select></label>
            {batchScope === "specific" && <label className="text-sm text-gray-600">Admission batch year <span className="text-red-600">*</span><input name="batchYear" type="number" required min={2000} max={2200} placeholder="e.g. 2026" className={input} /></label>}
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-6" aria-labelledby="period-title">
          <h3 id="period-title" className="text-sm font-semibold text-gray-900">2. Structure &amp; academic period</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm text-gray-600">Structure name <span className="text-red-600">*</span><input name="name" required maxLength={120} placeholder="e.g. B.Tech Semester 3 · 2026–27" className={input} /></label>
            <label className="text-sm text-gray-600">Academic starting year <span className="text-red-600">*</span><input name="year" type="number" min={2000} max={2200} required value={year} onChange={e => setYear(e.target.value)} className={input} /><span className="mt-1 block text-xs text-gray-400">{year ? `${year}–${Number(year) + 1}` : "Enter starting year"}</span></label>
            <label className="text-sm text-gray-600">Semester <span className="text-red-600">*</span><input name="semester" type="number" min={1} max={100} required value={semester} onChange={e => setSemester(e.target.value)} className={input} /></label>
            <label className="text-sm text-gray-600">Study year (from semester)<input readOnly value={semester ? `Year ${Math.ceil(Number(semester) / 2)}` : "—"} className={`${input} bg-gray-50`} /><span className="mt-1 block text-xs text-gray-400">For courses with two semesters per year.</span></label>
            <label className="text-sm text-gray-600">Schedule start (optional)<input name="effectiveFrom" type="date" value={start} max={end || undefined} onChange={e => setStart(e.target.value)} className={input} /></label>
            <label className="text-sm text-gray-600">Schedule end (optional)<input name="effectiveUntil" type="date" value={end} min={start || undefined} onChange={e => setEnd(e.target.value)} className={input} /></label>
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-6" aria-labelledby="installments-title">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="installments-title" className="text-sm font-semibold text-gray-900">3. Fee heads &amp; installment schedule</h3><span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500">Currency: INR (₹)</span></div>
          {course && <div className="rounded-xl bg-indigo-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-indigo-900">{course.components.length ? `${course.components.length} fee heads available from Admin course setup` : "No fee heads configured for this course. Add fee heads below."}</p>{course.components.length > 0 && <button type="button" onClick={importCourse} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-indigo-700">Import course fees</button>}</div>{course.components.length > 0 && <details className="mt-3 text-xs text-indigo-800"><summary className="cursor-pointer">Review source amounts and frequency</summary><ul className="mt-2 space-y-1">{course.components.map((h, i) => <li key={i}>{h.feeHead}: {money(cents(String(h.amount)))} · {h.frequency}</li>)}</ul><p className="mt-2">Review amounts for this academic period. Import places the amounts in one installment; split them before adding additional installments.</p></details>}</div>}
          {installments.map((installment, index) => {
            const subtotal = installment.heads.reduce((sum, h) => sum + cents(h.amount), 0);
            return <div key={installment.id} className="min-w-0 rounded-xl border border-gray-200">
              <div className="grid gap-4 rounded-t-xl bg-gray-50 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
                <label className="text-xs font-medium text-gray-500">Installment name <span className="text-red-600">*</span><input aria-label={`Installment name ${index + 1}`} required maxLength={60} value={installment.name} onChange={e => changeInstallment(installment.id, { name: e.target.value })} className={input} /></label>
                <label className="text-xs font-medium text-gray-500">Due date <span className="text-red-600">*</span><input aria-label={`Installment due date ${index + 1}`} type="date" required min={start || undefined} max={end || undefined} value={installment.dueDate} onChange={e => changeInstallment(installment.id, { dueDate: e.target.value })} className={input} /></label>
                <button type="button" disabled={installments.length === 1} onClick={() => setInstallments(rows => rows.filter(i => i.id !== installment.id))} className="self-end rounded-lg px-3 py-2.5 text-sm text-red-700 disabled:opacity-40">Remove installment</button>
              </div>
              <div className="space-y-3 p-4">{installment.heads.map((head, headIndex) => <div key={head.id} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <label className="min-w-0 text-xs text-gray-500">Fee head <span className="text-red-600">*</span><input aria-label={`Fee head ${index + 1}.${headIndex + 1}`} required maxLength={60} placeholder="e.g. Tuition, Exam, Hostel" value={head.feeHead} onChange={e => changeInstallment(installment.id, { heads: installment.heads.map(h => h.id === head.id ? { ...h, feeHead: e.target.value } : h) })} className={input} /></label>
                <label className="text-xs text-gray-500">Amount (₹) <span className="text-red-600">*</span><input aria-label={`Amount ${index + 1}.${headIndex + 1}`} type="number" required min="0.01" max="9999999999.99" step="0.01" value={head.amount} onChange={e => changeInstallment(installment.id, { heads: installment.heads.map(h => h.id === head.id ? { ...h, amount: e.target.value } : h) })} className={input} /></label>
                <button type="button" aria-label={`Remove fee head ${index + 1}.${headIndex + 1}`} disabled={installment.heads.length === 1} onClick={() => changeInstallment(installment.id, { heads: installment.heads.filter(h => h.id !== head.id) })} className="self-end rounded-lg px-3 py-2.5 text-sm text-red-700 disabled:opacity-40">Remove</button>
              </div>)}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3"><button type="button" disabled={lineCount >= 200} onClick={() => changeInstallment(installment.id, { heads: [...installment.heads, newHead()] })} className="text-sm font-medium text-indigo-700 disabled:opacity-40">+ Add fee head</button><p className="text-sm font-semibold text-gray-900">Installment total: {money(subtotal)}</p></div></div>
            </div>;
          })}
          <button type="button" disabled={lineCount >= 200} onClick={() => setInstallments(rows => [...rows, newInstallment(rows.length + 1)])} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-medium text-indigo-700 disabled:opacity-40"><FinanceIcon name="structure" className="h-4 w-4" />Add installment</button>
        </section>

        <section className="border-t border-gray-100 pt-6"><label className="block text-sm text-gray-600">Notes (optional)<textarea name="notes" maxLength={1000} rows={3} placeholder="Internal notes about this fee structure" className={input} /></label></section>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"><div><p className="text-xs text-gray-500">{installments.length} installments · {lineCount} fee lines · Draft</p><p className="mt-1 text-xl font-bold text-gray-900">Structure total: {money(total)}</p></div><button disabled={!course || busy || !!courseError} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40">{busy ? "Saving…" : "Save draft structure"}</button></div>
      </fieldset>
    </form>
  </section>;
}
