"use client";

import Link from "next/link";
import ReportDetails from "./ReportDetails";
import {settingsApi,type FinanceSettings} from "@/lib/accountant/settings";
import ReportTrends from "./ReportTrends";
import {useEffect,useState} from "react";
import {request} from "@/lib/api";

type Totals={transactions:number;inflow:number;outflow:number;net:number};
type Report={from:string;until:string;totals:Totals;monthly:(Totals&{month:string})[];sources:(Totals&{source:string})[];categories:{code:string;name:string;kind:string;amount:number}[];previousPeriod:Totals&{from:string;until:string};previousYear:Totals&{from:string;until:string}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
const input="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";
export default function ReportsPage(){
 const [settings,setSettings]=useState<FinanceSettings|null>(null),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();settingsApi.read(c.signal).then(r=>{if(!c.signal.aborted)setSettings(r);}).catch(e=>{if(!c.signal.aborted)setError(e.message||'Could not load report preferences');});return()=>c.abort();},[]);
 if(error)return <p role="alert" className="text-sm text-red-700">{error}</p>;
 if(!settings)return <p role="status" className="text-sm text-gray-500">Loading report preferences?</p>;
 return <ReportsContent initialFrom={settings.reportFrom} initialUntil={settings.today} initialSection={settings.preferences.reportSection}/>;
}
function ReportsContent({initialFrom,initialUntil,initialSection}:{initialFrom:string;initialUntil:string;initialSection:string}){
 const [dates,setDates]=useState({from:initialFrom,until:initialUntil});
 const [filters,setFilters]=useState(dates);
 const [data,setData]=useState<Report|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();
 request<Report>(`/finance/reports?${new URLSearchParams(filters)}`,{signal:controller.signal}).then(r=>{if(!controller.signal.aborted)setData(r);}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load reports");}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
 },[filters]);
 function download(){if(!data)return;
  const rows:(string|number)[][]=[["Cash-basis finance report",data.from,data.until],["Section","Label","Transactions","Inflow INR","Outflow INR","Net INR"],["Total","All verified transactions",data.totals.transactions,data.totals.inflow,data.totals.outflow,data.totals.net],...[["Previous period",data.previousPeriod],["Previous year",data.previousYear]].map(([name,value])=>{const r=value as Totals&{from:string;until:string};return [name as string,`${r.from} to ${r.until}`,r.transactions,r.inflow,r.outflow,r.net];}),...data.monthly.map(r=>["Month",r.month,r.transactions,r.inflow,r.outflow,r.net]),...data.sources.map(r=>["Source",r.source,r.transactions,r.inflow,r.outflow,r.net]),["Category code","Category","Kind","Amount INR"],...data.categories.map(r=>[r.code,r.name,r.kind,r.amount])];
  const csv=rows.map(row=>row.map(value=>`"${(typeof value==="string"?value.replace(/^[=+@\-\t\r]/,"'$&"):String(value)).replaceAll('"','""')}"`).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`finance-report-${data.from}-${data.until}.csv`;a.click();URL.revokeObjectURL(url);
 }
 return <div className="space-y-6">
  <div><h1 className="text-2xl font-semibold text-gray-900">Reports &amp; Analytics</h1><p className="mt-1 text-sm text-gray-500">Verified cash movements from the shared General Ledger.</p></div>
  <form onSubmit={e=>{e.preventDefault();setLoading(true);setError("");setData(null);setFilters({...dates});}} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 print:hidden">
   <label className="text-sm text-gray-700">From<input aria-label="Report from" className={input} type="date" required value={dates.from} max={dates.until} onChange={e=>setDates({...dates,from:e.target.value})}/></label>
   <label className="text-sm text-gray-700">Until<input aria-label="Report until" className={input} type="date" required value={dates.until} min={dates.from} onChange={e=>setDates({...dates,until:e.target.value})}/></label>
   <button disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Run report</button>
   <button type="button" disabled={!data||loading} onClick={download} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">Export CSV</button>
   <button type="button" disabled={!data||loading} onClick={()=>window.print()} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">Print</button>
  </form>
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  {loading&&<p role="status" className="text-sm text-gray-500">Loading report…</p>}
  {data&&<>
   <p className="text-sm text-gray-600">Period: {data.from} to {data.until} · {data.totals.transactions} verified transactions</p>
   <div className="grid gap-4 sm:grid-cols-3">{([['Cash inflow',data.totals.inflow],['Cash outflow',data.totals.outflow],['Net cash movement',data.totals.net]] as const).map(([label,value])=><div key={label} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 break-all text-xl font-semibold text-gray-900">{money(value)}</p></div>)}</div>
   <ReportTrends monthly={data.monthly} current={data.totals} previous={data.previousPeriod} year={data.previousYear}/>
   <ReportDetails key={`${data.from}-${data.until}`} from={data.from} until={data.until} initialSection={initialSection}/>
   {data.totals.transactions===0&&<p className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700">No verified transactions in this period. Change the dates to see earlier activity.</p>}
   {([['Monthly cash movements',data.monthly.map(r=>({...r,label:r.month}))],['Cash movements by source',data.sources.map(r=>({...r,label:r.source}))]] as const).map(([title,rows])=><section key={title} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><h2 className="mb-3 font-semibold text-gray-900">{title}</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-gray-500"><tr>{['Period / source','Count','Inflow','Outflow','Net'].map(h=><th key={h} className="whitespace-nowrap p-2 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.label} className="border-b border-gray-100"><td className="p-2">{r.label}</td><td className="p-2">{r.transactions}</td>{[r.inflow,r.outflow,r.net].map((v,i)=><td key={i} className="whitespace-nowrap p-2 tabular-nums">{money(v)}</td>)}</tr>)}</tbody></table></div></section>)}
   <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><h2 className="mb-3 font-semibold text-gray-900">Income &amp; expense breakdown</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-gray-500"><tr>{['Account','Category','Type','Amount'].map(h=><th key={h} className="p-2 font-medium">{h}</th>)}</tr></thead><tbody>{data.categories.map(r=><tr key={r.code} className="border-b border-gray-100"><td className="p-2">{r.code}</td><td className="p-2">{r.name}</td><td className="p-2">{r.kind}</td><td className="whitespace-nowrap p-2 tabular-nums">{money(r.amount)}</td></tr>)}</tbody></table></div></section>
   <p className="text-xs text-gray-500">Cash basis: excludes unpaid fees and unsettled requests. Refunds reduce income. Payroll reflects net payouts, not total employment costs. This is not an accrual financial statement.</p>
  </>}
  <nav aria-label="Detailed finance registers" className="flex flex-wrap gap-4 text-sm text-indigo-600 print:hidden">{[['General Ledger','ledger'],['Student fee balances','fees'],['Pending fees','defaulters'],['Budget monitoring','budgets'],['Payroll & vendor payments','payroll']].map(([label,path])=><Link key={path} href={`/accountant/${path}`}>{label} →</Link>)}</nav>
 </div>;
}
