"use client";
import {useEffect,useRef,useState} from "react";
import {bulkApi,type AssignmentRun} from "@/lib/accountant/bulk";
import {structureApi,structureYears,structureSemesters,structureBatches,type StructureRow} from "@/lib/accountant/structures";
import FinanceIcon from "./FinanceIcon";
import FinanceMultiSelect from "./FinanceMultiSelect";
const input="mt-2 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm";
const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(v);
export default function BulkFeeAssignment({structure}:{structure:StructureRow}){
 const legacy=(structure.courseScope||"LEGACY")==="LEGACY";
 const [programSearch,setProgramSearch]=useState("");const [programs,setPrograms]=useState<string[]>([]);const [program,setProgram]=useState("");
 const [search,setSearch]=useState("");const [batches,setBatches]=useState<string[]>([]);const [batchAll,setBatchAll]=useState(true);const [batchOptions,setBatchOptions]=useState<number[]>([]);
 const [mode,setMode]=useState("all");const [ids,setIds]=useState("");const [run,setRun]=useState<AssignmentRun|null>(null);
 const [history,setHistory]=useState<AssignmentRun[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const paused=useRef(false);const active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;paused.current=true;};},[]);
 useEffect(()=>{const c=new AbortController();const timer=setTimeout(()=>{bulkApi.programs(programSearch,c.signal).then(setPrograms).catch(()=>{if(!c.signal.aborted)setError("Admission programs could not be loaded.");});},250);return()=>{clearTimeout(timer);c.abort();};},[programSearch]);
 useEffect(()=>{let mounted=true;bulkApi.history(structure.id).then(rows=>{if(mounted)setHistory(rows);}).catch(()=>{if(mounted)setError("Assignment history could not be loaded.");});return()=>{mounted=false;};},[structure.id]);
 useEffect(()=>{const c=new AbortController();structureApi.options(legacy?[]:structure.courseIds||[],c.signal).then(r=>setBatchOptions(r.batchYears.filter(y=>structure.batchYear?y===structure.batchYear:structure.batchYears?.length?structure.batchYears.includes(y):true))).catch(()=>{if(!c.signal.aborted)setError("Batch options could not be loaded. Refresh before previewing.");});return()=>c.abort();},[legacy,structure]);
 const fail=(e:unknown)=>setError((e as {message?:string}).message||"Assignment could not finish. Refresh its status before retrying.");
 async function process(){
  if(!run||busy)return;
  if(!window.confirm(`Assign ${run.structureName} to the ${run.ready} remaining eligible accounts in this preview?`))return;
  setBusy(true);setError("");paused.current=false;
  try{let current=run;while(current.status!=="COMPLETE"&&!paused.current&&active.current){current=await bulkApi.process(current.id);if(active.current)setRun(current);}if(active.current)setHistory(await bulkApi.history(structure.id));}
  catch(e){if(active.current)fail(e);}finally{if(active.current)setBusy(false);}
 }
 return <section className="mt-6 space-y-5 rounded-2xl border border-indigo-100 bg-white p-5" aria-labelledby="bulk-title">
 <h3 id="bulk-title" className="flex items-center gap-2 font-semibold"><FinanceIcon name="students"/>Bulk fee assignment</h3>
 <p className="text-sm text-gray-500">{legacy?"Choose the admission program explicitly for this existing single-course plan.":structure.courseScope==="UNIVERSITY"?"University-wide eligibility: all approved admissions, subject to this plan's year/batch filters.":`Courses: ${structure.courseName}. Only uniquely matched admissions qualify.`} {structureYears(structure)}{` / ${structureSemesters(structure)} / ${structureBatches(structure)}`}.</p>
 {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
 {structure.status!=="ACTIVE"?<p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Publish this structure before assigning fees. Archived structures cannot be assigned.</p>:<form onSubmit={async e=>{
  e.preventDefault();if(busy)return;setBusy(true);setError("");
  const selected=mode==="selected"?Array.from(new Set(ids.split(/[\s,]+/).filter(Boolean))):[];
  if(mode==="selected"&&(selected.length===0||selected.length>200)){setError("Enter between 1 and 200 admission IDs.");setBusy(false);return;}
  if(!batchAll&&!batches.length){setError("Choose batches or explicitly select all eligible batches.");setBusy(false);return;}
  try{const preview=await bulkApi.preview(structure.id,{program,batchYear:null,batchYears:batchAll?[]:batches.map(Number),search,admissionIds:selected});setRun(preview);setHistory(await bulkApi.history(structure.id));}catch(e){fail(e);}finally{setBusy(false);}
 }}><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
 <label className="text-sm text-gray-600">Find admission program<input className={input} maxLength={100} value={programSearch} placeholder="Search actual admission programs" onChange={e=>setProgramSearch(e.target.value)}/></label>
 <label className="text-sm text-gray-600">Admission program {legacy?"*":"(optional filter)"}<select required={legacy} className={input} value={program} onChange={e=>setProgram(e.target.value)}><option value="">{legacy?"Select program":"All eligible programs"}</option>{program&&!programs.includes(program)&&<option value={program}>{program}</option>}{programs.map(p=><option key={p}>{p}</option>)}</select></label>
 <FinanceMultiSelect label="Assignment batches" allLabel="All batches allowed by this plan" options={batchOptions.map(n=>({value:String(n),label:`Batch ${n}`}))} values={batches} all={batchAll} onAll={()=>{setBatchAll(true);setBatches([]);}} onChange={v=>{setBatchAll(false);setBatches(v);}} disabled={busy}/>
 <label className="text-sm text-gray-600">Student name or admission ID filter<input maxLength={100} className={input} value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <label className="text-sm text-gray-600">Selection scope<select className={input} value={mode} onChange={e=>setMode(e.target.value)}><option value="all">All matching admissions, across every page</option><option value="selected">Specific admission IDs</option></select></label>
 {mode==="selected"&&<label className="text-sm text-gray-600">Admission IDs (up to 200)<textarea required className={input} value={ids} onChange={e=>setIds(e.target.value)} placeholder="Separate IDs with commas or new lines" maxLength={6400}/></label>}
 <label className="flex items-start gap-2 text-sm text-gray-600 sm:col-span-2"><input type="checkbox" required className="mt-1"/>I checked the course, study-year and batch scope for this assignment.</label>
 <div><button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white disabled:opacity-40" disabled={legacy&&!program}>Create assignment preview</button></div>
 </fieldset></form>}
 {run&&<div className="space-y-4 border-t border-gray-100 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold">{run.status==="PREVIEW"?"Frozen assignment preview":"Assignment progress"}</h4><span className="text-xs text-gray-500">{run.status} · {run.id.slice(0,8)}</span></div>
 {run.mappingUnresolved>0&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{run.mappingUnresolved} candidate admissions have no unique active-course match. They cannot match course-specific or final-year targeting; university-wide explicit study-year/all-year rules may still include them. Check the student sample before confirming.</p>}
 <p className="text-sm text-gray-500">{run.program} · {run.batchYears?.length?`Batches ${run.batchYears.join(", ")}`:run.batchYear?`Batch ${run.batchYear}`:"All batches allowed by plan"} · {money(run.perStudent)} per account</p>
 <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[["Matched",run.matched],["Remaining",run.ready],["Assigned",run.assigned],["Duplicate skipped",run.skipped],["No longer eligible",run.ineligible]].map(([label,value])=><div key={label} className="rounded-xl bg-gray-50 p-3"><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-2 text-lg font-semibold">{value}</dd></div>)}</dl>
 <p className="text-sm font-medium">Remaining assignment value: {money(run.previewAmount)}</p><p className="text-xs text-gray-500">The preview freezes the matching admission IDs. It creates no charges until you confirm. The sample below shows up to 20 accounts; totals cover the complete selection. Preview expires after 30 minutes if processing has not started.</p>
 <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Admission ID","Student","Result","Reason"].map(h=><th scope="col" key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{run.sample.map(t=><tr key={t.admissionId}><td className="px-3 py-3">{t.admissionId}</td><td className="px-3 py-3">{t.studentName}</td><td className="px-3 py-3">{t.state}</td><td className="px-3 py-3">{t.reason||"—"}</td></tr>)}</tbody></table></div>
 <div className="flex flex-wrap gap-3">{run.ready>0&&structure.status==="ACTIVE"&&<button disabled={busy} onClick={process} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white disabled:opacity-40">{busy?"Processing…":run.status==="PREVIEW"?"Confirm assignment":"Resume remaining accounts"}</button>}{busy&&<button onClick={()=>{paused.current=true;}} className="rounded-xl border px-4 py-2.5 text-sm">Pause after current batch</button>}<button disabled={busy} onClick={async()=>{try{setRun(await bulkApi.get(run.id));}catch(e){fail(e);}}} className="rounded-xl border px-4 py-2.5 text-sm disabled:opacity-40">Refresh status</button></div>
 <p className="text-xs text-gray-500">Processes 25 accounts per transaction. Closing this panel stops further requests; an in-flight batch can still finish. Resume from history. Duplicate protection applies to this template, not separately created templates.</p>
 </div>}
 <div className="border-t border-gray-100 pt-4"><h4 className="text-sm font-semibold">Your recent assignment runs</h4>{!history.length?<p className="mt-2 text-sm text-gray-500">No assignment history yet.</p>:<ul className="mt-3 space-y-2">{history.map(h=><li key={h.id}><button disabled={busy} onClick={()=>setRun(h)} className="w-full rounded-xl border border-gray-100 p-3 text-left text-sm hover:bg-gray-50">{h.id.slice(0,8)} · {h.program} · {h.status}<span className="mt-1 block text-xs text-gray-500">{h.assigned} assigned · {h.ready} remaining · {h.skipped} duplicate skipped</span></button></li>)}</ul>}</div>
 </section>;
}
