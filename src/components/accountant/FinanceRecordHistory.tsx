"use client";
import {useEffect,useState} from 'react';
import {request} from '@/lib/api';
interface Event {action:string;actor:string;note:string;created_at:string}
export default function FinanceRecordHistory({kind,id,version=0}:{kind:'ENTRY'|'BUDGET'|'VENDOR';id:string;version?:number}){
 const [rows,setRows]=useState<Event[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();request<Event[]>(`/finance/workspace/history/${kind}/${id}`,{signal:c.signal,cache:'no-store'}).then(setRows).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[kind,id,version]);
 return <details className="mt-4 rounded-xl border p-4 text-sm"><summary className="cursor-pointer font-medium">Activity &amp; correction history</summary><p className="mt-2 text-xs text-gray-500">Latest 100 recorded events. History starts when workflow recording was added; earlier actions are not reconstructed.</p>{error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}{rows===null&&!error&&<p role="status">Loading history...</p>}{rows?.length===0&&<p className="mt-3 text-gray-500">No recorded workflow events.</p>}{rows?.map((e,i)=><p key={i} className="mt-3 whitespace-pre-wrap break-words border-t pt-3">{e.action} · {new Date(e.created_at).toLocaleString('en-IN')} · {e.actor}<br/>{e.note}</p>)}</details>;
}
