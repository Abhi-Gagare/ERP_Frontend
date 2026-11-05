"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ProgramData, CourseData, SubjectData, StudentData, AttendanceRecord } from "@/lib/api";

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

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; ring: string }> = {
  PRESENT:  { label: "Present",  bg: "bg-emerald-500",  text: "text-white", ring: "ring-emerald-400"  },
  ABSENT:   { label: "Absent",   bg: "bg-red-500",      text: "text-white", ring: "ring-red-400"      },
  LATE:     { label: "Late",     bg: "bg-amber-500",    text: "text-white", ring: "ring-amber-400"    },
  EXCUSED:  { label: "Excused",  bg: "bg-blue-500",     text: "text-white", ring: "ring-blue-400"     },
};

export default function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);

  // Step selectors
  const [programs,  setPrograms]  = useState<ProgramData[]>([]);
  const [courses,   setCourses]   = useState<CourseData[]>([]);
  const [subjects,  setSubjects]  = useState<SubjectData[]>([]);
  const [students,  setStudents]  = useState<StudentData[]>([]);

  const [selProgram,  setSelProgram]  = useState("");
  const [selCourse,   setSelCourse]   = useState("");
  const [selYear,     setSelYear]     = useState("");
  const [selSubject,  setSelSubject]  = useState("");
  const [selSlot,     setSelSlot]     = useState("");
  const [selDate,     setSelDate]     = useState(today);

  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  const [rows, setRows] = useState<StudentRow[]>([]);

  // Load programs once
  useEffect(() => {
    api.programs.list("", "ACTIVE", 0).then(r => setPrograms(r.content)).catch(() => {});
  }, []);

  // Load courses when program changes
  useEffect(() => {
    if (!selProgram) { setCourses([]); setSelCourse(""); return; }
    api.courses.list("", selProgram, "ACTIVE", 0).then(r => setCourses(r.content)).catch(() => {});
    setSelCourse(""); setSelYear(""); setSelSubject(""); setStudents([]);
  }, [selProgram]);

  // Load subjects when course changes
  useEffect(() => {
    if (!selCourse) { setSubjects([]); setSelSubject(""); return; }
    api.subjects.list("", selCourse, undefined, undefined, "ACTIVE", 0)
      .then(r => setSubjects(r.content)).catch(() => {});
    setSelSubject("");
  }, [selCourse]);

  // Load students when program + year chosen
  const loadStudents = useCallback(() => {
    if (!selProgram || !selYear) { setStudents([]); return; }
    setLoading(true);
    api.students.list("", selProgram, true, 0)
      .then(r => {
        const yr = Number(selYear);
        setStudents(r.content.filter(s => s.batchYear === yr));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selProgram, selYear]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Build rows when students change
  useEffect(() => {
    setRows(students.map(s => ({
      studentId: s.id,
      rollNumber: s.rollNumber,
      name: s.fullName,
      status: "PRESENT",
      remarks: "",
    })));
    setSubmitted(false);
  }, [students]);

  const setAllStatus = (status: AttendanceStatus) => {
    setRows(r => r.map(row => ({ ...row, status })));
  };

  const setRowStatus = (idx: number, status: AttendanceStatus) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, status } : row));
  };

  const setRowRemarks = (idx: number, remarks: string) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, remarks } : row));
  };

  const selectedSubjectObj = subjects.find(s => s.subjectCode === selSubject);
  const canSubmit = selProgram && selCourse && selYear && selSubject && selSlot && rows.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(""); setSubmitting(true);
    try {
      await api.attendance.mark({
        date: selDate,
        timeSlot: selSlot,
        subjectCode: selSubject,
        subjectName: selectedSubjectObj?.name ?? selSubject,
        markedBy: "Admin",
        records: rows.map(r => ({ studentId: r.studentId, status: r.status, remarks: r.remarks || null })),
      });
      setSubmitted(true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = rows.filter(r => r.status === "PRESENT").length;
  const absentCount  = rows.filter(r => r.status === "ABSENT").length;
  const lateCount    = rows.filter(r => r.status === "LATE").length;

  const yearOptions = Array.from(new Set(students.map(s => s.batchYear))).sort((a, b) => b - a);
  const availableYears = selProgram
    ? Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
    : [];

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mark Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Select batch, subject and time slot to mark attendance</p>
      </div>

      {/* Step 1 — Batch selection */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Step 1 — Select Batch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Program *</label>
            <select
              value={selProgram}
              onChange={e => setSelProgram(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select program…</option>
              {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

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
            <label className="block text-xs font-medium text-slate-600 mb-1">Batch Year *</label>
            <select
              value={selYear}
              onChange={e => setSelYear(e.target.value)}
              disabled={!selProgram}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select year…</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Step 2 — Subject + slot */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Step 2 — Select Subject & Time Slot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
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
              type="date"
              value={selDate}
              max={today}
              onChange={e => setSelDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Time Slot *</label>
            <select
              value={selSlot}
              onChange={e => setSelSlot(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select slot…</option>
              {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Step 3 — Mark attendance */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          Loading students…
        </div>
      )}

      {!loading && rows.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Step 3 — Mark Attendance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{rows.length} students in batch</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Mark all as:</span>
              {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setAllStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text}`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex gap-4 mb-4 p-3 bg-slate-50 rounded-lg flex-wrap">
            <span className="text-sm text-emerald-600 font-medium">✓ Present: {presentCount}</span>
            <span className="text-sm text-red-600 font-medium">✗ Absent: {absentCount}</span>
            {lateCount > 0 && <span className="text-sm text-amber-600 font-medium">⏱ Late: {lateCount}</span>}
          </div>

          {/* Student cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((row, idx) => (
              <div
                key={row.studentId}
                className={`relative border-2 rounded-xl p-4 transition-all ${
                  row.status === "PRESENT"
                    ? "border-emerald-300 bg-emerald-50"
                    : row.status === "ABSENT"
                    ? "border-red-300 bg-red-50"
                    : row.status === "LATE"
                    ? "border-amber-300 bg-amber-50"
                    : "border-blue-300 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{row.rollNumber}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[row.status].bg} ${STATUS_CONFIG[row.status].text}`}>
                    {STATUS_CONFIG[row.status].label}
                  </span>
                </div>

                {/* Toggle buttons */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setRowStatus(idx, s)}
                      className={`py-1 rounded text-xs font-medium transition-all border ${
                        row.status === s
                          ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} border-transparent ring-2 ${STATUS_CONFIG[s].ring}`
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {s === "PRESENT" ? "P" : s === "ABSENT" ? "A" : s === "LATE" ? "L" : "E"}
                    </button>
                  ))}
                </div>

                {(row.status === "ABSENT" || row.status === "LATE" || row.status === "EXCUSED") && (
                  <input
                    type="text"
                    value={row.remarks}
                    onChange={e => setRowRemarks(idx, e.target.value)}
                    placeholder="Remarks (optional)"
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Submitted */}
          {submitted && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
              ✓ Attendance saved successfully for {rows.length} students.
            </div>
          )}

          {/* Submit */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving…" : submitted ? "Save Again" : "Save Attendance"}
            </button>
          </div>
        </section>
      )}

      {/* Empty state when batch set but no students found */}
      {!loading && selProgram && selYear && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm">No active students found for <strong>{selProgram}</strong> batch <strong>{selYear}</strong>.</p>
        </div>
      )}
    </div>
  );
}
