"use client";
import {useEffect,useState} from "react";
import {accountantApi,type StudentFeeSummary} from "@/lib/accountant/api";
import type {PageResponse} from "@/lib/api";
import FinanceIcon from "@/components/accountant/FinanceIcon";
import CollectionHistory from "@/components/accountant/CollectionHistory";
import CollectPaymentForm from "@/components/accountant/CollectPaymentForm";
export default function CollectionsPage(){
 const [search,setSearch]=useState("");const [page,setPage]=useState(0);const [data,setData]=useState<PageResponse<StudentFeeSummary>|null>(null);
 const [student,setStudent]=useState<StudentFeeSummary|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{const c=new AbortController();const timer=setTimeout(()=>{setLoading(true);setError("");accountantApi.studentAccounts(search,"","","",page,c.signal).then(result=>{if(!c.signal.aborted)setData(result);}).catch(()=>{if(!c.signal.aborted)setError("Student fee accounts could not be loaded.");}).finally(()=>{if(!c.signal.aborted)setLoading(false);});},250);return()=>{clearTimeout(timer);c.abort();};},[search,page]);
 return <div className="mx-auto max-w-7xl space-y-6"><header><h1 className="flex items-center gap-3 text-2xl font-bold"><FinanceIcon name="payment"/>Fee Collection &amp; Receipts</h1><p className="mt-2 text-sm text-gray-500">Record verified money received, allocate it to charges and issue a receipt.</p></header>
 {student?<CollectPaymentForm key={student.admissionId} student={student} close={()=>setStudent(null)}/>:<section className="rounded-2xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">Select student fee account</h2><input aria-label="Find collection account" maxLength={100} placeholder="Search student name or admission ID" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"/>{error?<p role="alert" className="mt-4 text-red-700">{error}</p>:loading?<p role="status" className="py-6 text-gray-500">Loading accounts…</p>:!data?.content.length?<p className="py-6 text-gray-500">No matching student accounts.</p>:<><ul className="mt-4 divide-y divide-gray-100">{data.content.map(s=><li key={s.admissionId}><button onClick={()=>setStudent(s)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-left hover:bg-indigo-50"><span className="text-sm font-medium">{s.studentName}<span className="mt-1 block text-xs text-gray-500">{s.admissionId} · {s.program}</span></span><span className="text-sm text-indigo-700">Select account →</span></button></li>)}</ul><div className="mt-4 flex items-center justify-between text-sm text-gray-500"><span>Page {page+1} of {data.totalPages}</span><div className="flex gap-4"><button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="disabled:opacity-40">Previous</button><button disabled={page+1>=data.totalPages} onClick={()=>setPage(p=>p+1)} className="disabled:opacity-40">Next</button></div></div></>}</section>}
 <CollectionHistory/>
 </div>;
}
