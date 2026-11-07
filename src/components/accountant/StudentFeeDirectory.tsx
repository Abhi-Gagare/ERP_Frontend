"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { accountantApi, type StudentFeeSummary } from "@/lib/accountant/api";
import type { PageResponse } from "@/lib/api";
import FinanceIcon from "./FinanceIcon";

export const feeMoney = (value: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(value);
const input = "min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-2 focus:outline-indigo-500";
export default function StudentFeeDirectory() {
  const [search,setSearch]=useState(""); const [program,setProgram]=useState("");
  const [semester,setSemester]=useState(""); const [batch,setBatch]=useState("");
  const [page,setPage]=useState(0); const [version,setVersion]=useState(0);
  const [data,setData]=useState<PageResponse<StudentFeeSummary>|null>(null);
  const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{
    const c=new AbortController();
    const timer=setTimeout(()=>{
      setLoading(true);setError("");
      accountantApi.studentAccounts(search,program,semester,batch,page,c.signal)
        .then(result=>{if(!c.signal.aborted)setData(result);})
        .catch(()=>{if(!c.signal.aborted)setError("Student fee accounts could not be loaded. Please retry.");})
        .finally(()=>{if(!c.signal.aborted)setLoading(false);});
    },300);
    return()=>{clearTimeout(timer);c.abort();};
  },[search,program,semester,batch,page,version]);
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" aria-label="Student fee directory" aria-busy={loading}>
    <div className="border-b border-gray-100 p-5"><h2 className="flex items-center gap-2 font-semibold text-gray-900"><FinanceIcon name="students"/>Student fee accounts</h2><p className="mt-2 text-sm text-gray-500">Approved admissions and existing fee accounts, including accounts with no fees assigned. IDs shown are admission IDs.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input className={input} aria-label="Search student accounts" placeholder="Student name or admission ID" maxLength={100} value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
        <input className={input} aria-label="Program filter" placeholder="Exact program name" maxLength={100} value={program} onChange={e=>{setProgram(e.target.value);setPage(0);}}/>
        <input className={input} aria-label="Semester filter" placeholder="Semester" type="number" min={1} max={100} value={semester} onChange={e=>{setSemester(e.target.value);setPage(0);}}/>
        <input className={input} aria-label="Batch filter" placeholder="Batch year" type="number" min={1} max={9999} value={batch} onChange={e=>{setBatch(e.target.value);setPage(0);}}/>
      </div><div className="mt-3 flex flex-wrap gap-4 text-sm"><button onClick={()=>{setSearch("");setProgram("");setSemester("");setBatch("");setPage(0);}} className="text-gray-600 underline">Clear filters</button><button onClick={()=>setVersion(v=>v+1)} className="text-indigo-700 underline">Refresh accounts</button></div>
    </div>
    {error?<p role="alert" className="p-6 text-red-700">{error}<button onClick={()=>setVersion(v=>v+1)} className="ml-3 underline">Retry</button></p>:loading?<p role="status" className="p-10 text-center text-gray-500">Loading student accounts…</p>:!data?.content.length?<p className="p-10 text-center text-gray-500">No matching fee accounts. Approved admissions will appear here even before fees are assigned.</p>:<>
      <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Student accounts and all-time fee balances</caption><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Student / Admission","Program","Billed","Concessions","Paid","Outstanding","Overdue","Account"].map(h=><th scope="col" key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{data.content.map(a=><tr key={a.admissionId} className="hover:bg-gray-50"><td className="px-5 py-4"><p className="font-medium text-gray-900">{a.studentName}</p><p className="mt-1 text-xs text-gray-500">{a.admissionId}</p></td><td className="px-5 py-4">{a.program}<p className="mt-1 text-xs text-gray-500">Semester {a.semester} · Batch {a.batchYear}</p></td><td className="px-5 py-4">{feeMoney(a.billed)}</td><td className="px-5 py-4 text-indigo-700">{feeMoney(a.concessions)}</td><td className="px-5 py-4 text-emerald-700">{feeMoney(a.paid)}</td><td className="px-5 py-4 font-medium">{feeMoney(a.outstanding)}</td><td className="px-5 py-4 text-red-700">{feeMoney(a.overdue)}</td><td className="px-5 py-4"><p className={`mb-2 text-xs ${a.feeCount===0?"text-amber-700":"text-gray-500"}`}>{a.feeCount===0?"Fees not assigned":`${a.feeCount} fee records`}</p><Link className="font-medium text-indigo-700 hover:underline" href={`/accountant/fees/accounts/${encodeURIComponent(a.admissionId)}`}>View account</Link></td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-5 text-sm"><span className="text-gray-500">{data.totalElements} accounts · Page {page+1} of {data.totalPages}</span><div className="flex gap-3"><button disabled={page===0} className="rounded-lg border px-3 py-2 disabled:opacity-40" onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={page+1>=data.totalPages} className="rounded-lg border px-3 py-2 disabled:opacity-40" onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
    </>}
  </section>;
}
