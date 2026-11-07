"use client";
import { useEffect,useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { accountantApi,type StudentFeeAccount } from "@/lib/accountant/api";
import { feeMoney } from "@/components/accountant/StudentFeeDirectory";
import FeeStatusBadge from "@/components/accountant/FeeStatusBadge";

export default function StudentFeeAccountPage(){
  const {id}=useParams<{id:string}>(); const [page,setPage]=useState(0);
  const [data,setData]=useState<StudentFeeAccount|null>(null); const [loading,setLoading]=useState(true);
  const [error,setError]=useState(""); const [version,setVersion]=useState(0);
  useEffect(()=>{const c=new AbortController();
    accountantApi.studentAccount(id,page,c.signal).then(result=>{if(!c.signal.aborted)setData(result);})
      .catch(()=>{if(!c.signal.aborted)setError("Fee account could not be loaded. Check the admission ID or try again.");})
      .finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();
  },[id,page,version]);
  const go=(next:number)=>{setLoading(true);setError("");setPage(next);};
  return <div className="mx-auto max-w-7xl space-y-6" aria-busy={loading}>
    <Link href="/accountant/fees" className="text-sm font-medium text-indigo-700">← Student fee accounts</Link>
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Student fee account</h1><p className="mt-2 text-sm text-gray-500">Admission {id} · All-time fee balances</p></div><button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm disabled:opacity-50" disabled={loading} onClick={()=>{setLoading(true);setError("");setVersion(v=>v+1);}}>Refresh</button></header>
    {error?<p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p>:loading?<p role="status" className="p-8 text-gray-500">Loading fee account…</p>:data&&<>
      <section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-semibold text-gray-900">{data.summary.studentName}</h2><p className="mt-2 text-sm text-gray-500">{data.summary.program} · Semester {data.summary.semester} · Batch {data.summary.batchYear}</p><p className="mt-2 text-xs text-gray-500">Admission status: {data.summary.admissionStatus} · {data.summary.feeCount} fee records</p></section>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[["Billed",data.summary.billed],["Concessions",data.summary.concessions],["Paid",data.summary.paid],["Outstanding",data.summary.outstanding],["Overdue",data.summary.overdue],["Waived balance",data.summary.waived]].map(([label,value])=><div key={label} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5"><dt className="text-sm text-gray-500">{label}</dt><dd className="mt-3 break-words text-xl font-bold text-gray-900">{feeMoney(Number(value))}</dd></div>)}</dl>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white"><h2 className="border-b border-gray-100 p-5 font-semibold">Charges</h2>{!data.charges.content.length?<p className="p-8 text-gray-500">{data.summary.feeCount===0?"Fees not assigned to this account yet.":"No charges on this page."}</p>:<div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Fee ID","Fee head","Amount","Concession","Paid","Balance","Due date","Status"].map(h=><th scope="col" key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{data.charges.content.map(f=><tr key={f.feeId}><td className="px-5 py-4">{f.feeId}</td><td className="px-5 py-4">{f.feeType}</td><td className="px-5 py-4">{feeMoney(f.amount)}</td><td className="px-5 py-4">{feeMoney(f.concessionAmount)}</td><td className="px-5 py-4">{feeMoney(f.amountPaid)}</td><td className="px-5 py-4">{feeMoney(f.balance)}</td><td className="px-5 py-4">{new Date(`${f.dueDate}T00:00:00`).toLocaleDateString("en-IN")}</td><td className="px-5 py-4"><FeeStatusBadge status={f.status}/></td></tr>)}</tbody></table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-5 text-sm"><span className="text-gray-500">Page {page+1} of {Math.max(1,data.charges.totalPages)}</span><div className="flex gap-3"><button disabled={page===0} onClick={()=>go(page-1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page+1>=data.charges.totalPages} onClick={()=>go(page+1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div></div></section>
      <p className="text-xs text-gray-500">As of {data.asOf}. Outstanding = original billed charges − posted concessions − payments, excluding waived charges. Overdue is included in outstanding. Waived unpaid balances are excluded from outstanding.</p>
    </>}
  </div>;
}
