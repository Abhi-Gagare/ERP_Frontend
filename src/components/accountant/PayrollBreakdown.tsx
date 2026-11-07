"use client";
import {useEffect,useState} from "react";
import {payrollSetupApi,type PayrollSnapshot} from "@/lib/accountant/payrollSetup";
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(n);
export default function PayrollBreakdown({entry}:{entry:string}){
 const [data,setData]=useState<PayrollSnapshot|null>(null);const [error,setError]=useState("");
 useEffect(()=>{const c=new AbortController();payrollSetupApi.snapshot(entry,c.signal).then(r=>{if(!c.signal.aborted)setData(r);}).catch(e=>{if(!c.signal.aborted)setError(e.status===404?"Manual net payout: no salary breakdown was recorded.":e.message||"Unable to load payroll breakdown");});return()=>c.abort();},[entry]);
 if(!data)return <p className="mt-4 text-sm text-gray-500">{error||"Loading salary breakdown…"}</p>;
 return <section className="mt-5 rounded-xl border border-gray-100 p-4"><h3 className="font-semibold">Saved payroll breakdown</h3><p className="mt-2 break-words text-sm text-gray-500">{data.employee_code} · {data.designation}{data.department_name&&` · ${data.department_name}`}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[["Basic",data.basic],["Fixed allowances",data.allowances],["Gross",data.gross],["Fixed deductions",data.deductions],["Net payout",data.net]].map(([label,value])=><div key={label}><dt className="text-gray-500">{label}</dt><dd className="font-medium">{money(Number(value))}</dd></div>)}</dl><p className="mt-3 text-xs text-gray-500">Full-month fixed amounts saved with this request. Not a statutory payslip; no attendance or tax computation.</p></section>;
}
