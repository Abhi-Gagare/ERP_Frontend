"use client";
import {useEffect,useState} from 'react';
import {request} from '@/lib/api';
interface Edit {previous_version:number;previous_scheme:string;previous_amount:string;changed_by:string;note:string;created_at:string}
export default function ScholarshipEditHistory({id}:{id:string}){
 const [rows,setRows]=useState<Edit[]>([]),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();request<Edit[]>(`/finance/scholarships/${id}/edits`,{signal:c.signal,cache:'no-store'}).then(setRows).catch(()=>{if(!c.signal.aborted)setError('Correction history could not be loaded. Reopen the application to retry.');});return()=>c.abort();},[id]);
 return <details className="mt-4 rounded-xl border p-3 text-sm"><summary className="cursor-pointer font-medium">Application correction history</summary>{error&&<p role="alert">{error}</p>}{!error&&!rows.length&&<p className="mt-2 text-gray-500">No saved corrections.</p>}{rows.map(r=><p key={r.previous_version} className="mt-3 whitespace-pre-wrap break-words">{new Date(r.created_at).toLocaleString('en-IN')} · {r.changed_by}<br/>{r.note}<br/>Before correction: {r.previous_scheme} · Requested {r.previous_amount} · Version {r.previous_version}</p>)}</details>;
}
