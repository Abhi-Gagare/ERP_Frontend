"use client";
import {useEffect,useState} from "react";
import {request,type PageResponse} from "@/lib/api";

type Detail={section:string;basis:string;from:string;until:string;columns:string[];totals:Record<string,number>;rows:PageResponse<Record<string,string|number|null>>};
const sections=[['collections','Fee collections'],['balances','Current fee balances'],['ageing','Outstanding ageing'],['defaulters','Defaulters'],['awards','Scholarships & concessions'],['refunds','Refund requests'],['budgets','Budget versus actual'],['payroll','Payroll'],['vendors','Vendor payments']];
const label=(key:string)=>key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const monetary=new Set(['collected','assessed','paid','outstanding','overdue','requested','posted','amount','allocated','actual','committed','variance','available','approved_unpaid','pending']);
function display(key:string,value:string|number|null){if(value===null)return '—';if(typeof value!=="number")return value;return monetary.has(key)?new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value):key.endsWith('percent')?`${value}%`:value.toLocaleString('en-IN');}
export default function ReportDetails({from,until,initialSection="collections"}:{from:string;until:string;initialSection?:string}){
 const [section,setSection]=useState(initialSection),[group,setGroup]=useState('program'),[page,setPage]=useState(0);
 const [data,setData]=useState<Detail|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{const c=new AbortController();const timer=setTimeout(()=>{setLoading(true);setData(null);setError('');request<Detail>(`/finance/reports/details?${new URLSearchParams({section,group,from,until,page:String(page)})}`,{signal:c.signal}).then(r=>{if(!c.signal.aborted)setData(r);}).catch(e=>{if(!c.signal.aborted)setError(e.message||'Could not load report');}).finally(()=>{if(!c.signal.aborted)setLoading(false);});},0);return()=>{clearTimeout(timer);c.abort();};},[section,group,page,from,until]);
 function exportPage(){if(!data||loading)return;const rows:(string|number|null)[][]=[[sections.find(s=>s[0]===section)?.[1]||section,from,until],[data.basis],[`Page ${page+1}; ${data.rows.totalElements} total groups. Export contains this page and full-report totals.`],['Summary','Value'],...Object.entries(data.totals),data.columns,...data.rows.content.map(r=>data.columns.map(c=>r[c]))];
 const csv=rows.map(r=>r.map(v=>`"${(typeof v==='string'?v.replace(/^[\s]*[=+@\-]/,"'$&"):String(v??'')).replaceAll('"','""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${section}-${from}-${until}-page-${page+1}.csv`;a.click();URL.revokeObjectURL(url);
 }
 return <section className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
  <h2 className="font-semibold text-gray-900">Detailed reports</h2>
  <div className="flex flex-wrap gap-3 print:hidden"><label className="text-sm text-gray-700">Report<select aria-label="Detailed report" value={section} onChange={e=>{setLoading(true);setSection(e.target.value);setPage(0);}} className="block w-full rounded-lg border border-gray-200 p-2">{sections.map(([key,title])=><option key={key} value={key}>{title}</option>)}</select></label>
   {section==='collections'&&<label className="text-sm text-gray-700">Group by<select aria-label="Collection grouping" value={group} onChange={e=>{setLoading(true);setGroup(e.target.value);setPage(0);}} className="block w-full rounded-lg border border-gray-200 p-2">{[['program','Program / course'],['year','Current student year'],['batch','Admission batch'],['head','Fee head'],['method','Payment method']].map(([key,title])=><option key={key} value={key}>{title}</option>)}</select></label>}
   <button type="button" disabled={!data||loading} onClick={exportPage} className="self-end rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50">Export page CSV</button>
  </div>
  {loading?<p role="status" className="text-sm text-gray-500">Loading detailed report…</p>:error?<p role="alert" className="text-sm text-red-700">{error}</p>:data&&<>
   <p className="text-sm text-gray-600">{data.basis}</p>
   <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(data.totals).map(([key,value])=><div key={key} className="min-w-0 rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">{label(key)}</dt><dd className="mt-1 break-all font-semibold text-gray-900">{display(key,value)}</dd></div>)}</dl>
   {data.rows.content.length===0?<p className="py-4 text-sm text-gray-500">No matching records.</p>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{data.columns.map(c=><th key={c} className="whitespace-nowrap border-b p-2 font-medium text-gray-500">{label(c)}</th>)}</tr></thead><tbody>{data.rows.content.map((row,i)=><tr key={i}>{data.columns.map(c=><td key={c} className="whitespace-nowrap border-b border-gray-100 p-2 tabular-nums">{display(c,row[c])}</td>)}</tr>)}</tbody></table></div>}
   <div className="flex flex-wrap items-center gap-3 text-sm"><span>Page {page+1} of {Math.max(1,data.rows.totalPages)} · {data.rows.totalElements} groups</span><button disabled={page===0} onClick={()=>{setLoading(true);setPage(p=>p-1);}} className="rounded border px-3 py-1 disabled:opacity-40 print:hidden">Previous</button><button disabled={page+1>=data.rows.totalPages} onClick={()=>{setLoading(true);setPage(p=>p+1);}} className="rounded border px-3 py-1 disabled:opacity-40 print:hidden">Next</button></div>
  </>}
  <p className="text-xs text-gray-500">Department grouping requires a shared department-to-admission mapping from the academic team. Current balances use today’s records. Exports are limited to the displayed page plus complete summary totals.</p>
 </section>;
}
