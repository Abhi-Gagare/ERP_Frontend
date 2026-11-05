"use client";

import { useEffect, useState, useCallback } from "react";
import {
  api, ProgramData, CourseData, SubjectData, StudentData,
  AttendanceSessionSummary,
} from "@/lib/api";

const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00",
];

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface StudentRow {
  studentId: number;
  rollNumber: string;
  name: string;
  status: AttendanceStatus;
  remarks: string;
}

const STATUS_CFG: Record<AttendanceStatus, { label: string; bg: string; text: string; border: string; ring: string }> = {
  PRESENT: { label: "Present", bg: "bg-emerald-500", text: "text-white", border: "border-emerald-300", ring: "ring-emerald-400" },
  ABSENT:  { label: "Absent",  bg: "bg-red-500",     text: "text-white", border: "border-red-300",     ring: "ring-red-400"     },
  LATE:    { label: "Late",    bg: "bg-amber-500",   text: "text-white", border: "border-amber-300",   ring: "ring-amber-400"   },
  EXCUSED: { label: "Excused", bg: "bg-blue-500",    text: "text-white", border: "border-blue-300",    ring: "ring-blue-400"    },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function pctColor(p: number) {
  if (p >= 75) return "text-emerald-600";
  if (p >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function AttendancePage() {
  const [today, setToday] = useState("");
  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10);
    setToday(t);
    setSelDate(t);
  }, []);

  /* ── filter bar (shown always) ── */
  const [programs,  setPrograms]  = useState<ProgramData[]>([]);
  const [selProgram, setSelProgram] = useState("");
  const [selYear,    setSelYear]   = useState("");

  /* ── history state ── */
  const [sessions,     setSessions]     = useState<AttendanceSessionSummary[]>([]);
  const [sessionsLoad, setSessionsLoad] = useState(false);
  const [sessionsErr,  setSessionsErr]  = useState("");

  /* ── mark-form visibility ── */
  const [showForm, setShowForm] = useState(false);

  /* ── mark-form state ── */
  const [courses,  setCourses]  = useState<CourseData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);

  const [selCourse,  setSelCourse]  = useState("");
  const [selSubject, setSelSubject] = useState("");
  const [selSlot,    setSelSlot]    = useState("");
  const [selDate,    setSelDate]    = useState("");

  const [rows,       setRows]       = useState<StudentRow[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  /* ── load programs ── */
  useEffect(() => {
    api.programs.list("", "ACTIVE", 0).then(r => setPrograms(r.content)).catch(() => {});
  }, []);

  /* ── load sessions when program+year chosen ── */
  const loadSessions = useCallback(() => {
    if (!selProgram) { setSessions([]); return; }
    setSessionsLoad(true);
    setSessionsErr("");
    api.attendance.recentSessions(selProgram, selYear ? Number(selYear) : undefined, 30)
      .then(r => { setSessions(r); })
      .catch((e: { message?: string }) => { setSessions([]); setSessionsErr(e?.message ?? "Failed to load sessions"); })
      .finally(() => setSessionsLoad(false));
  }, [selProgram, selYear]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  /* ── load courses when program changes ── */
  useEffect(() => {
    if (!selProgram) { setCourses([]); setSelCourse(""); return; }
    api.courses.list("", selProgram, "ACTIVE", 0).then(r => setCourses(r.content)).catch(() => {});
    setSelCourse(""); setSelSubject(""); setStudents([]);
  }, [selProgram]);

  /* ── load subjects when course changes ── */
  useEffect(() => {
    if (!selCourse) { setSubjects([]); setSelSubject(""); return; }
    api.subjects.list("", selCourse, undefined, undefined, "ACTIVE", 0)
      .then(r => setSubjects(r.content)).catch(() => {});
    setSelSubject("");
  }, [selCourse]);

  /* ── load students ── */
  const loadStudents = useCallback(() => {
    if (!selProgram || !selYear) { setStudents([]); return; }
    setLoading(true);
    api.students.list("", selProgram, true, 0)
      .then(r => setStudents(r.content.filter(s => s.batchYear === Number(selYear))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selProgram, selYear]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  /* ── build rows ── */
  useEffect(() => {
    setRows(students.map(s => ({ studentId: s.id, rollNumber: s.rollNumber, name: s.fullName, status: "PRESENT", remarks: "" })));
    setSubmitted(false);
  }, [students]);

  const setAllStatus = (s: AttendanceStatus) => setRows(r => r.map(row => ({ ...row, status: s })));
  const setRowStatus = (i: number, s: AttendanceStatus) => setRows(r => r.map((row, j) => j === i ? { ...row, status: s } : row));
  const setRowRemarks = (i: number, v: string) => setRows(r => r.map((row, j) => j === i ? { ...row, remarks: v } : row));

  const selSubjectObj = subjects.find(s => s.subjectCode === selSubject);
  const canSubmit = selProgram && selCourse && selYear && selSubject && selSlot && rows.length > 0;

  const presentCount = rows.filter(r => r.status === "PRESENT").length;
  const absentCount  = rows.filter(r => r.status === "ABSENT").length;
  const lateCount    = rows.filter(r => r.status === "LATE").length;

  const availableYears = selProgram
    ? Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i)
    : [];

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(""); setSubmitting(true);
    try {
      await api.attendance.mark({
        date: selDate,
        timeSlot: selSlot,
        subjectCode: selSubject,
        subjectName: selSubjectObj?.name ?? selSubject,
        markedBy: "Admin",
        records: rows.map(r => ({ studentId: r.studentId, status: r.status, remarks: r.remarks || null })),
      });
      setSubmitted(true);
      loadSessions(); // refresh history
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── group sessions by date ── */
  const grouped = sessions.reduce<Record<string, AttendanceSessionSummary[]>>((acc, s) => {
    (acc[s.date] ??= []).push(s);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">View history and mark new sessions</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            showForm
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Form
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Mark Attendance
            </>
          )}
        </button>
      </div>

      {/* ── Filter bar (program + year — shared between history & form) ── */}
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
            <select
              value={selProgram}
              onChange={e => { setSelProgram(e.target.value); setShowForm(false); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All programs…</option>
              {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Batch Year</label>
            <select
              value={selYear}
              onChange={e => setSelYear(e.target.value)}
              disabled={!selProgram}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">All years…</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── Mark Attendance Form (collapsible) ── */}
      {showForm && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/40 p-5 space-y-5">
          <h2 className="text-base font-semibold text-indigo-800">Mark New Attendance</h2>

          {/* Sub-selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white rounded-xl border border-slate-200 p-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Course *</label>
              <select
                value={selCourse}
                onChange={e => setSelCourse(e.target.value)}
                disabled={!selProgram}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
              <select
                value={selSubject}
                onChange={e => setSelSubject(e.target.value)}
                disabled={!selCourse}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.subjectCode}>{s.name} ({s.subjectCode})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
              <input
                type="date" value={selDate} max={today}
                onChange={e => setSelDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-2">Time Slot *</label>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelSlot(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selSlot === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Students */}
          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Loading students…
            </div>
          )}

          {!loading && !selYear && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Select a Batch Year above to load students.
            </div>
          )}

          {!loading && selYear && rows.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              No active students found for <strong className="text-slate-600">{selProgram}</strong> batch <strong className="text-slate-600">{selYear}</strong>.
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              {/* Bulk + summary bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-slate-500">Mark all:</span>
                  {(["PRESENT","ABSENT","LATE","EXCUSED"] as AttendanceStatus[]).map(s => (
                    <button key={s} onClick={() => setAllStatus(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CFG[s].bg} ${STATUS_CFG[s].text}`}>
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 text-sm font-medium">
                  <span className="text-emerald-600">✓ {presentCount} present</span>
                  <span className="text-red-500">✗ {absentCount} absent</span>
                  {lateCount > 0 && <span className="text-amber-600">⏱ {lateCount} late</span>}
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rows.map((row, idx) => (
                  <div key={row.studentId}
                    className={`border-2 rounded-xl p-4 transition-all ${STATUS_CFG[row.status].border} ${
                      row.status === "PRESENT" ? "bg-emerald-50"
                      : row.status === "ABSENT" ? "bg-red-50"
                      : row.status === "LATE"   ? "bg-amber-50"
                      : "bg-blue-50"
                    }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{row.rollNumber}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CFG[row.status].bg} ${STATUS_CFG[row.status].text}`}>
                        {STATUS_CFG[row.status].label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {(["PRESENT","ABSENT","LATE","EXCUSED"] as AttendanceStatus[]).map(s => (
                        <button key={s} onClick={() => setRowStatus(idx, s)}
                          className={`py-1 rounded text-xs font-medium border transition-all ${
                            row.status === s
                              ? `${STATUS_CFG[s].bg} ${STATUS_CFG[s].text} border-transparent ring-2 ${STATUS_CFG[s].ring}`
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}>
                          {s[0]}
                        </button>
                      ))}
                    </div>
                    {row.status !== "PRESENT" && (
                      <input type="text" value={row.remarks}
                        onChange={e => setRowRemarks(idx, e.target.value)}
                        placeholder="Remarks (optional)"
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              {submitted && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
                  ✓ Attendance saved for {rows.length} students.
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {submitting ? "Saving…" : submitted ? "Save Again" : "Save Attendance"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── History ── */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent Sessions</h2>
          {selProgram && (
            <span className="text-xs text-slate-400">{selProgram}{selYear ? ` · Batch ${selYear}` : ""}</span>
          )}
        </div>

        {!selProgram && (
          <div className="p-10 text-center text-slate-400 text-sm">
            Select a program above to view attendance history.
          </div>
        )}

        {selProgram && sessionsLoad && (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        )}

        {selProgram && !sessionsLoad && sessionsErr && (
          <div className="p-5 text-center text-red-500 text-sm">{sessionsErr}</div>
        )}

        {selProgram && !sessionsLoad && !sessionsErr && sessions.length === 0 && (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">No attendance sessions yet</p>
            <p className="text-slate-400 text-xs mt-1">Use the Mark Attendance button to record the first session.</p>
          </div>
        )}

        {selProgram && !sessionsLoad && !sessionsErr && sessions.length > 0 && (
          <div className="divide-y divide-slate-100">
            {dates.map(date => (
              <div key={date}>
                {/* Date header */}
                <div className="px-5 py-2 bg-slate-50 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-slate-600">{fmtDate(date)}</span>
                  <span className="text-xs text-slate-400">· {grouped[date].length} session{grouped[date].length !== 1 ? "s" : ""}</span>
                </div>
                {/* Session rows */}
                {grouped[date].map((s, i) => {
                  const pct = s.totalCount > 0 ? Math.round((s.presentCount / s.totalCount) * 100) : 0;
                  return (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      {/* Subject */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{s.subjectName}</p>
                        <p className="text-xs text-slate-400 font-mono">{s.subjectCode} · {s.timeSlot}</p>
                      </div>
                      {/* Attendance bar */}
                      <div className="hidden sm:flex items-center gap-2 w-36">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-9 text-right ${pctColor(pct)}`}>{pct}%</span>
                      </div>
                      {/* Counts */}
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.presentCount}P</span>
                        {s.absentCount > 0 && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{s.absentCount}A</span>}
                        <span className="text-slate-400">{s.totalCount} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
