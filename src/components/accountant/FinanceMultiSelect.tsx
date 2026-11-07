"use client";
import {useState} from 'react';
export interface Choice {value:string;label:string;description?:string}
export default function FinanceMultiSelect({label,allLabel,options,values,all,onChange,onAll,loading=false,error='',search,onSearch,onOpen,onRefresh,onMore,hasMore=false,disabled=false}:{label:string;allLabel:string;options:Choice[];values:string[];all:boolean;onChange:(v:string[])=>void;onAll:()=>void;loading?:boolean;error?:string;search?:string;onSearch?:(v:string)=>void;onOpen?:()=>void;onRefresh?:()=>void;onMore?:()=>void;hasMore?:boolean;disabled?:boolean}){
 const [localSearch,setLocalSearch]=useState('');
 const query=search??localSearch;
 const visible=options.filter(o=>`${o.label} ${o.description||''}`.toLowerCase().includes(query.toLowerCase()));
 const toggle=(value:string)=>onChange(values.includes(value)?values.filter(v=>v!==value):[...values,value]);
 return <div className="min-w-0 space-y-2"><p className="text-sm font-medium text-gray-700">{label}</p><details onToggle={e=>{if(e.currentTarget.open)onOpen?.();}} className="rounded-xl border border-gray-200 bg-white">
  <summary aria-label={`Choose ${label}`} aria-disabled={disabled} className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-gray-700 focus-visible:outline-2 focus-visible:outline-indigo-600">{all?allLabel:values.length?`${values.length} selected`:`Select ${label.toLowerCase()}`}</summary>
  <fieldset disabled={disabled} className="space-y-2 border-t border-gray-100 p-3">
   <div className="flex items-center gap-2"><input aria-label={`Search ${label}`} value={query} maxLength={100} onChange={e=>onSearch?onSearch(e.target.value):setLocalSearch(e.target.value)} placeholder={`Search ${label.toLowerCase()}`} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"/>{onRefresh&&<button type="button" onClick={onRefresh} className="rounded-lg border border-gray-200 px-2 py-2 text-xs">Refresh</button>}</div>
   <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-indigo-50 p-3 text-sm font-medium text-indigo-800"><input type="checkbox" checked={all} onChange={()=>{if(all)onChange([]);else onAll();}}/>{allLabel}</label>
   {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
   <div className="max-h-56 overflow-y-auto">{visible.map(o=><label key={o.value} className="flex cursor-pointer items-start gap-3 rounded-lg p-3 text-sm hover:bg-gray-50"><input type="checkbox" className="mt-0.5" checked={!all&&values.includes(o.value)} onChange={()=>toggle(o.value)}/><span className="min-w-0 break-words">{o.label}{o.description&&<span className="mt-1 block text-xs text-gray-500">{o.description}</span>}</span></label>)}{loading&&<p role="status" className="p-3 text-xs text-gray-500">Loading options...</p>}{!loading&&!visible.length&&<p className="p-3 text-xs text-gray-500">No matching options. Check the academic setup or refresh.</p>}</div>
   {hasMore&&<button type="button" disabled={loading} onClick={onMore} className="px-3 py-2 text-sm text-indigo-700 disabled:opacity-50">Load more options</button>}
  </fieldset>
 </details>{!all&&values.length>0&&<div className="flex flex-wrap gap-2" aria-label={`Selected ${label}`}>{values.map(value=><button key={value} type="button" disabled={disabled} aria-label={`Remove ${label} ${options.find(o=>o.value===value)?.label||value}`} onClick={()=>toggle(value)} className="max-w-full break-words rounded-lg bg-indigo-50 px-3 py-2 text-left text-xs text-indigo-800">{options.find(o=>o.value===value)?.label||value} <span aria-hidden="true">×</span></button>)}</div>}</div>;
}
