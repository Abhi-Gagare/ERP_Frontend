"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api, ProgramData, CourseData, SubjectData, TimetableData, TimetableSlot } from "@/lib/api";

/* ── constants ───────────────────────────────────────────────── */
const DAYS = ["MON","TUE","WED","THU","FRI","SAT"] as const;
type Day = typeof DAYS[number];
const DAY_LABEL: Record<Day,string> = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday" };
const DAY_SHORT: Record<Day,string> = { MON:"Mon", TUE:"Tue", WED:"Wed", THU:"Thu", FRI:"Fri", SAT:"Sat" };

const SLOT_TYPES = ["CLASS","LAB","BREAK","FREE"] as const;
type SlotType = typeof SLOT_TYPES[number];

const TYPE_CFG: Record<SlotType,{ label:string; bg:string; text:string; border:string; dot:string; printBg:string }> = {
  CLASS: { label:"Class",  bg:"bg-indigo-50",  text:"text-indigo-800",  border:"border-indigo-200", dot:"bg-indigo-500",  printBg:"#eef2ff" },
  LAB:   { label:"Lab",    bg:"bg-violet-50",  text:"text-violet-800",  border:"border-violet-200", dot:"bg-violet-500",  printBg:"#f5f3ff" },
  BREAK: { label:"Break",  bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",  dot:"bg-amber-400",   printBg:"#fffbeb" },
  FREE:  { label:"Free",   bg:"bg-slate-50",   text:"text-slate-400",   border:"border-slate-200",  dot:"bg-slate-300",   printBg:"#f8fafc" },
};
const SEMESTERS = [1,2,3,4,5,6,7,8];

interface EditSlot extends TimetableSlot { _key: string; day: Day; }
function makeKey() { return Math.random().toString(36).slice(2); }
function fmt(t: string) {
  if (!t) return "";
  const [h,m] = t.split(":").map(Number);
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`;
}
function blankSlot(day: Day, order: number): EditSlot {
  return { _key:makeKey(), day, startTime:"09:00", endTime:"10:00", type:"CLASS", slotOrder:order };
}

/* ── timetable grid table (read-only view) ───────────────────── */
function TimetableGrid({ tt }: { tt: TimetableData }) {
  const days = DAYS.filter(d => tt.slots.some(s => s.day === d));
  if (days.length === 0) return <p className="text-slate-400 text-sm p-6">No slots found.</p>;

  // collect all unique time-bands ordered by start
  const timeBands = Array.from(
    new Map(tt.slots.map(s => [`${s.startTime}-${s.endTime}`, { start: s.startTime, end: s.endTime }])).values()
  ).sort((a,b) => a.start.localeCompare(b.start));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 px-3 py-2.5 text-left text-slate-500 font-semibold w-28">Time</th>
            {days.map(d => (
              <th key={d} className="border border-slate-200 px-3 py-2.5 text-center text-slate-700 font-semibold">
                {DAY_LABEL[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeBands.map(band => (
            <tr key={`${band.start}-${band.end}`} className="hover:bg-slate-50/50">
              <td className="border border-slate-200 px-3 py-2 text-slate-500 font-mono whitespace-nowrap align-middle">
                <div>{fmt(band.start)}</div>
                <div className="text-slate-300">↓</div>
                <div>{fmt(band.end)}</div>
              </td>
              {days.map(d => {
                const slot = tt.slots.find(s => s.day === d && s.startTime === band.start && s.endTime === band.end);
                if (!slot) return (
                  <td key={d} className="border border-slate-200 px-2 py-2 text-center text-slate-200">—</td>
                );
                const cfg = TYPE_CFG[slot.type as SlotType];
                return (
                  <td key={d} className={`border border-slate-200 px-2 py-2 align-top ${cfg.bg}`}>
                    {slot.type === "CLASS" || slot.type === "LAB" ? (
                      <div className="space-y-0.5">
                        <div className={`font-semibold leading-tight ${cfg.text}`}>{slot.subjectName}</div>
                        {slot.subjectCode && <div className="text-slate-400 font-mono">{slot.subjectCode}</div>}
                        {slot.facultyName && <div className="text-slate-500">{slot.facultyName}</div>}
                        {slot.room && (
                          <span className="inline-block bg-white/70 text-slate-500 px-1.5 py-0.5 rounded text-xs mt-0.5">{slot.room}</span>
                        )}
                        <div className={`inline-flex items-center gap-1 mt-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          <span className={`text-xs ${cfg.text} opacity-70`}>{cfg.label}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center font-medium ${cfg.text} py-1`}>{cfg.label}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── download helper ─────────────────────────────────────────── */
function downloadTimetable(tt: TimetableData) {
  const days = DAYS.filter(d => tt.slots.some(s => s.day === d));
  const timeBands = Array.from(
    new Map(tt.slots.map(s => [`${s.startTime}-${s.endTime}`, { start: s.startTime, end: s.endTime }])).values()
  ).sort((a,b) => a.start.localeCompare(b.start));

  const fmtH = (t: string) => { if (!t) return ""; const [h,m]=t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`; };

  const rows = timeBands.map(band => `
    <tr>
      <td style="border:1px solid #e2e8f0;padding:8px 10px;font-size:11px;color:#64748b;white-space:nowrap;vertical-align:middle;text-align:center;background:#f8fafc">
        ${fmtH(band.start)}<br/><span style="color:#cbd5e1">↕</span><br/>${fmtH(band.end)}
      </td>
      ${days.map(d => {
        const slot = tt.slots.find(s => s.day === d && s.startTime === band.start && s.endTime === band.end);
        if (!slot) return `<td style="border:1px solid #e2e8f0;padding:8px;text-align:center;color:#cbd5e1">—</td>`;
        const bg = TYPE_CFG[slot.type as SlotType]?.printBg ?? "#fff";
        if (slot.type === "CLASS" || slot.type === "LAB") {
          return `<td style="border:1px solid #e2e8f0;padding:8px 10px;background:${bg};vertical-align:top">
            <div style="font-weight:600;font-size:11px;color:#1e293b">${slot.subjectName ?? ""}</div>
            ${slot.subjectCode ? `<div style="font-size:10px;color:#94a3b8;font-family:monospace">${slot.subjectCode}</div>` : ""}
            ${slot.facultyName ? `<div style="font-size:10px;color:#64748b">${slot.facultyName}</div>` : ""}
            ${slot.room ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">📍 ${slot.room}</div>` : ""}
            <div style="font-size:9px;color:#94a3b8;margin-top:3px;text-transform:uppercase">${slot.type}</div>
          </td>`;
        }
        return `<td style="border:1px solid #e2e8f0;padding:8px;background:${bg};text-align:center;color:#94a3b8;font-size:11px">${slot.type === "BREAK" ? "☕ Break" : "Free"}</td>`;
      }).join("")}
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Timetable — ${tt.course} Sem ${tt.semester}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; color: #1e293b; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1e293b; color: #fff; padding: 10px 12px; text-align: center; font-size: 12px; }
  th:first-child { text-align: left; }
  .legend { display: flex; gap: 16px; margin-top: 16px; font-size: 11px; color: #64748b; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
  @media print { body { padding: 12px; } }
</style>
</head><body>
<h1>${tt.course} — Semester ${tt.semester}</h1>
<div class="meta">${tt.program} &nbsp;·&nbsp; Batch ${tt.batchYear} &nbsp;·&nbsp; ${tt.academicYear ?? ""} &nbsp;·&nbsp;
  <span style="font-weight:600;color:${tt.status==="PUBLISHED"?"#059669":"#d97706"}">${tt.status}</span>
</div>
<table>
  <thead><tr>
    <th style="width:90px">Time</th>
    ${days.map(d => `<th>${DAY_LABEL[d]}</th>`).join("")}
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="legend">
  <span><span class="dot" style="background:#6366f1"></span>Class</span>
  <span><span class="dot" style="background:#8b5cf6"></span>Lab</span>
  <span><span class="dot" style="background:#f59e0b"></span>Break</span>
  <span><span class="dot" style="background:#cbd5e1"></span>Free</span>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Timetable_${tt.course.replace(/\s+/g,"_")}_Sem${tt.semester}.html`;
  a.click(); URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════════════════════════ */
export default function TimetablePage() {
  const [tab, setTab] = useState<"published"|"builder">("published");

  /* shared selectors */
  const [programs,   setPrograms]   = useState<ProgramData[]>([]);
  const [courses,    setCourses]    = useState<CourseData[]>([]);
  const [subjects,   setSubjects]   = useState<SubjectData[]>([]);
  const [selProgram, setSelProgram] = useState("");
  const [selCourse,  setSelCourse]  = useState("");
  const [selYear,    setSelYear]    = useState("");
  const [selSem,     setSelSem]     = useState("");

  /* published tab */
  const [pubList,    setPubList]    = useState<TimetableData[]>([]);
  const [pubLoading, setPubLoading] = useState(false);
  const [pubSel,     setPubSel]     = useState<TimetableData|null>(null);

  /* builder tab */
  const [timetable,  setTimetable]  = useState<TimetableData|null>(null);
  const [slots,      setSlots]      = useState<Record<Day,EditSlot[]>>({ MON:[],TUE:[],WED:[],THU:[],FRI:[],SAT:[] });
  const [ttStatus,   setTtStatus]   = useState<"DRAFT"|"PUBLISHED">("DRAFT");
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const [modal,      setModal]      = useState<{day:Day;key:string}|null>(null);
  const [form,       setForm]       = useState<Partial<EditSlot>>({});

  /* load programs */
  useEffect(() => {
    api.programs.list("","ACTIVE",0).then(r => setPrograms(r.content)).catch(()=>{});
  }, []);

  /* load courses */
  useEffect(() => {
    if (!selProgram) { setCourses([]); setSelCourse(""); return; }
    api.courses.list("",selProgram,"ACTIVE",0).then(r => setCourses(r.content)).catch(()=>{});
    setSelCourse("");
  }, [selProgram]);

  /* load subjects */
  useEffect(() => {
    if (!selCourse) { setSubjects([]); return; }
    api.subjects.list("",selCourse,undefined,undefined,"ACTIVE",0).then(r => setSubjects(r.content)).catch(()=>{});
  }, [selCourse]);

  /* ── published list (loads when program chosen or tab switched) ── */
  const loadPublished = useCallback(() => {
    if (!selProgram) { setPubList([]); return; }
    setPubLoading(true);
    api.timetables.listByProgram(selProgram)
      .then(list => { setPubList(list.filter(t => t.status === "PUBLISHED")); })
      .catch(() => setPubList([]))
      .finally(() => setPubLoading(false));
  }, [selProgram]);

  useEffect(() => { if (tab === "published") loadPublished(); }, [tab, loadPublished]);

  /* ── builder: load existing ── */
  const loadTimetable = useCallback(() => {
    if (!selProgram||!selCourse||!selYear||!selSem) { setTimetable(null); resetSlots(); return; }
    setLoading(true);
    api.timetables.getByBatch(selProgram,selCourse,Number(selYear),Number(selSem))
      .then(tt => {
        setTimetable(tt); setTtStatus(tt.status);
        const map: Record<Day,EditSlot[]> = { MON:[],TUE:[],WED:[],THU:[],FRI:[],SAT:[] };
        tt.slots.forEach(s => { const d=s.day as Day; map[d].push({...s,_key:makeKey(),day:d}); });
        DAYS.forEach(d => map[d].sort((a,b)=>(a.slotOrder??0)-(b.slotOrder??0)));
        setSlots(map);
      })
      .catch(() => { setTimetable(null); resetSlots(); })
      .finally(() => setLoading(false));
  }, [selProgram,selCourse,selYear,selSem]);

  useEffect(() => { if (tab==="builder") loadTimetable(); }, [tab, loadTimetable]);

  function resetSlots() { setSlots({ MON:[],TUE:[],WED:[],THU:[],FRI:[],SAT:[] }); }

  /* ── slot CRUD ── */
  function addSlot(day: Day) {
    const s = blankSlot(day, slots[day].length+1);
    setSlots(prev => ({ ...prev, [day]: [...prev[day], s] }));
    openModal(day, s._key, s);
  }
  function removeSlot(day: Day, key: string) {
    setSlots(prev => ({ ...prev, [day]: prev[day].filter(s=>s._key!==key).map((s,i)=>({...s,slotOrder:i+1})) }));
  }
  function openModal(day: Day, key: string, slot?: Partial<EditSlot>) {
    setModal({day,key}); setForm(slot ?? slots[day].find(s=>s._key===key) ?? {});
  }
  function saveModal() {
    if (!modal) return;
    setSlots(prev => ({ ...prev, [modal.day]: prev[modal.day].map(s=>s._key===modal.key?{...s,...form,_key:s._key,day:s.day}:s) }));
    setModal(null);
  }

  /* ── save ── */
  async function handleSave(publish=false) {
    if (!selProgram||!selCourse||!selYear||!selSem) return;
    setError(""); setSaving(true); setSaved(false);
    const allSlots: TimetableSlot[] = DAYS.flatMap(day =>
      slots[day].map((s,i) => ({ day:s.day, startTime:s.startTime, endTime:s.endTime,
        type:s.type, subjectCode:s.subjectCode, subjectName:s.subjectName,
        facultyName:s.facultyName, room:s.room, slotOrder:i+1 }))
    );
    try {
      const tt = await api.timetables.save({
        program:selProgram, course:selCourse, batchYear:Number(selYear), semester:Number(selSem),
        academicYear:`${selYear}-${Number(selYear)+1}`,
        status: publish ? "PUBLISHED" : ttStatus, slots: allSlots,
      });
      setTimetable(tt); setTtStatus(tt.status); setSaved(true);
      if (publish) loadPublished();
    } catch (e: unknown) { setError((e as {message?:string})?.message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  /* edit a published timetable → switch to builder and pre-fill selectors */
  function editPublished(tt: TimetableData) {
    setSelProgram(tt.program);
    setSelCourse(tt.course);
    setSelYear(String(tt.batchYear));
    setSelSem(String(tt.semester));
    setTab("builder");
  }

  const availableYears = selProgram ? Array.from({length:8},(_,i)=>new Date().getFullYear()-i) : [];
  const hasSlots = DAYS.some(d=>slots[d].length>0);
  const totalSlots = DAYS.reduce((n,d)=>n+slots[d].length,0);
  const classSlots = DAYS.flatMap(d=>slots[d]).filter(s=>s.type==="CLASS"||s.type==="LAB").length;

  /* ═══════════════════════════════ RENDER ══════════════════════ */
  return (
    <div className="w-full p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Timetable</h1>
          <p className="text-slate-500 text-sm mt-0.5">View published schedules and build new ones</p>
        </div>
        {tab === "builder" && hasSlots && (
          <div className="flex items-center gap-2">
            <button onClick={()=>handleSave(false)} disabled={saving}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {saving?"Saving…":"Save Draft"}
            </button>
            <button onClick={()=>handleSave(true)} disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              Publish
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {([["published","Published Timetables"],["builder","Create / Edit"]] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab===t ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PUBLISHED TAB ── */}
      {tab==="published" && (
        <div className="space-y-5">
          {/* Program filter */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-xs">
            <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
            <select value={selProgram} onChange={e=>{setSelProgram(e.target.value);setPubSel(null);}}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">All programs…</option>
              {programs.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {/* List of published timetables */}
          {pubLoading && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Loading…</div>}

          {!pubLoading && !selProgram && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"/>
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Select a Program to view published timetables</p>
            </div>
          )}

          {!pubLoading && selProgram && pubList.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-slate-500 text-sm">No published timetables for <strong>{selProgram}</strong>.</p>
              <button onClick={()=>setTab("builder")} className="mt-3 text-indigo-600 text-sm hover:underline">
                → Create one in the builder
              </button>
            </div>
          )}

          {!pubLoading && pubList.length > 0 && (
            <div className="space-y-3">
              {/* Card list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pubList.map(tt => (
                  <div key={tt.id}
                    onClick={()=>setPubSel(pubSel?.id===tt.id?null:tt)}
                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-sm ${
                      pubSel?.id===tt.id ? "border-indigo-400 shadow-sm" : "border-slate-200"
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{tt.course}</p>
                        <p className="text-xs text-slate-500">Semester {tt.semester} · Batch {tt.batchYear}</p>
                        {tt.academicYear && <p className="text-xs text-slate-400">{tt.academicYear}</p>}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex-shrink-0">
                        Published
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                      <span>{tt.slots.length} slots</span>
                      <span>{tt.slots.filter(s=>s.type==="CLASS"||s.type==="LAB").length} classes/labs</span>
                    </div>
                    <div className="flex gap-2 mt-3" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>editPublished(tt)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                        </svg>
                        Edit
                      </button>
                      <button onClick={()=>downloadTimetable(tt)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full grid view of selected */}
              {pubSel && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-800">{pubSel.course} — Semester {pubSel.semester}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {pubSel.program} · Batch {pubSel.batchYear} · {pubSel.academicYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Legend */}
                      <div className="hidden sm:flex items-center gap-3 mr-2">
                        {SLOT_TYPES.map(t=>(
                          <span key={t} className="flex items-center gap-1 text-xs text-slate-500">
                            <span className={`w-2 h-2 rounded-full ${TYPE_CFG[t].dot}`}/>
                            {TYPE_CFG[t].label}
                          </span>
                        ))}
                      </div>
                      <button onClick={()=>editPublished(pubSel)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                        </svg>
                        Edit
                      </button>
                      <button onClick={()=>downloadTimetable(pubSel)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                  <TimetableGrid tt={pubSel} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── BUILDER TAB ── */}
      {tab==="builder" && (
        <div className="space-y-5">
          {/* Selector bar */}
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Program *</label>
                <select value={selProgram} onChange={e=>setSelProgram(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Select…</option>
                  {programs.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Course *</label>
                <select value={selCourse} onChange={e=>setSelCourse(e.target.value)} disabled={!selProgram}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">Select…</option>
                  {courses.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Batch Year *</label>
                <select value={selYear} onChange={e=>setSelYear(e.target.value)} disabled={!selProgram}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">Select…</option>
                  {availableYears.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Semester *</label>
                <select value={selSem} onChange={e=>setSelSem(e.target.value)} disabled={!selCourse}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">Select…</option>
                  {SEMESTERS.map(s=><option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {loading && <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">Loading…</div>}

          {!loading && (!selProgram||!selCourse||!selYear||!selSem) && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"/>
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Select all four fields to load or create a timetable</p>
            </div>
          )}

          {!loading && selProgram && selCourse && selYear && selSem && (
            <>
              {/* Stats bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">{totalSlots} slots</span>
                  <span className="text-indigo-600 font-medium">{classSlots} classes/labs</span>
                  {timetable ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ttStatus==="PUBLISHED"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>
                      {ttStatus}
                    </span>
                  ) : <span className="text-slate-400 text-xs">New timetable</span>}
                </div>
                <div className="flex items-center gap-3">
                  {SLOT_TYPES.map(t=>(
                    <span key={t} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`w-2.5 h-2.5 rounded-full ${TYPE_CFG[t].dot}`}/>{TYPE_CFG[t].label}
                    </span>
                  ))}
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              {saved  && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">✓ Timetable saved.</div>}

              {/* ── Preview grid table (read-only) shown when timetable loaded ── */}
              {timetable && hasSlots && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Current Timetable Preview</span>
                    {timetable && (
                      <button onClick={()=>downloadTimetable(timetable)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                        </svg>
                        Download
                      </button>
                    )}
                  </div>
                  <TimetableGrid tt={timetable} />
                </div>
              )}

              {/* ── Day-by-day builder (editable) ── */}
              <div className="space-y-3">
                {DAYS.map(day=>(
                  <div key={day} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-700">{DAY_LABEL[day]}</span>
                        {slots[day].length>0 && <span className="text-xs text-slate-400">{slots[day].length} slot{slots[day].length!==1?"s":""}</span>}
                      </div>
                      <button onClick={()=>addSlot(day)}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        Add Slot
                      </button>
                    </div>
                    {slots[day].length===0 ? (
                      <div className="px-4 py-6 text-center text-slate-400 text-xs">
                        No slots — click <span className="font-medium text-indigo-500">+ Add Slot</span> to begin
                      </div>
                    ) : (
                      <div className="p-3 flex flex-wrap gap-2">
                        {slots[day].map(slot=>(
                          <div key={slot._key}
                            className={`group relative flex flex-col min-w-[130px] max-w-[180px] border rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm ${TYPE_CFG[slot.type as SlotType].bg} ${TYPE_CFG[slot.type as SlotType].border}`}
                            onClick={()=>openModal(day,slot._key)}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_CFG[slot.type as SlotType].dot}`}/>
                              <span className="text-xs text-slate-400 font-mono">{fmt(slot.startTime)}</span>
                            </div>
                            {slot.type==="CLASS"||slot.type==="LAB" ? (
                              <>
                                <p className={`text-xs font-semibold leading-tight truncate ${TYPE_CFG[slot.type as SlotType].text}`}>{slot.subjectName||"— Subject —"}</p>
                                {slot.subjectCode && <p className="text-xs text-slate-400 font-mono mt-0.5">{slot.subjectCode}</p>}
                                {slot.facultyName && <p className="text-xs text-slate-400 truncate mt-0.5">{slot.facultyName}</p>}
                              </>
                            ) : (
                              <p className={`text-xs font-medium ${TYPE_CFG[slot.type as SlotType].text}`}>{TYPE_CFG[slot.type as SlotType].label}</p>
                            )}
                            <p className="text-xs text-slate-400 font-mono mt-1.5">{fmt(slot.endTime)}</p>
                            {slot.room && <span className="mt-1 text-xs bg-white/60 text-slate-500 px-1.5 py-0.5 rounded self-start">{slot.room}</span>}
                            <button onClick={e=>{e.stopPropagation();removeSlot(day,slot._key);}}
                              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 text-red-400 hover:text-red-600 hover:bg-white transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button onClick={()=>addSlot(day)}
                          className="flex flex-col items-center justify-center min-w-[80px] border-2 border-dashed border-slate-200 rounded-xl p-3 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Save bar */}
              <div className="flex justify-end gap-3 pb-4">
                <button onClick={()=>handleSave(false)} disabled={saving||!hasSlots}
                  className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Save Draft
                </button>
                <button onClick={()=>handleSave(true)} disabled={saving||!hasSlots}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-40">
                  {saving?"Saving…":"Publish Timetable"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Slot Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">{DAY_LABEL[modal.day]} — Edit Slot</h3>
              <button onClick={()=>setModal(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Slot Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {SLOT_TYPES.map(t=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                        form.type===t ? `${TYPE_CFG[t].bg} ${TYPE_CFG[t].text} ${TYPE_CFG[t].border} ring-2 ring-offset-1 ring-indigo-300`
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}>
                      {TYPE_CFG[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                  <input type="time" value={form.startTime??"09:00"} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                  <input type="time" value={form.endTime??"10:00"} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
              </div>
              {(form.type==="CLASS"||form.type==="LAB") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                    <select value={form.subjectCode??""} onChange={e=>{
                        const sub=subjects.find(s=>s.subjectCode===e.target.value);
                        setForm(f=>({...f,subjectCode:sub?.subjectCode??"",subjectName:sub?.name??"",facultyName:sub?.facultyName??f.facultyName??""}));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="">Select subject…</option>
                      {subjects.map(s=><option key={s.id} value={s.subjectCode}>{s.name} ({s.subjectCode})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Faculty</label>
                      <input type="text" value={form.facultyName??""} onChange={e=>setForm(f=>({...f,facultyName:e.target.value}))}
                        placeholder="Dr. Name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Room / Hall</label>
                      <input type="text" value={form.room??""} onChange={e=>setForm(f=>({...f,room:e.target.value}))}
                        placeholder="Room 101" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={()=>setModal(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={saveModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
