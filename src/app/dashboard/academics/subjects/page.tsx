"use client";

import { useEffect, useState, useCallback } from "react";
import { api, SubjectData, CourseData, ProgramData } from "@/lib/api";

// ─── constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  THEORY:    "bg-indigo-100 text-indigo-700",
  PRACTICAL: "bg-violet-100 text-violet-700",
  TUTORIAL:  "bg-amber-100 text-amber-700",
};

const TYPES    = ["THEORY", "PRACTICAL", "TUTORIAL"];
const STATUSES = ["ACTIVE", "INACTIVE"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

type ViewMode = "list" | "semester" | "year";

interface SubjectFormState {
  subjectCode: string;
  name: string;
  description: string;
  selectedProgram: string;  // UI only — drives course dropdown
  course: string;           // what gets saved
  semester: number;
  year: number;
  credits: number;
  type: string;
  facultyName: string;
  status: string;
}

const EMPTY: SubjectFormState = {
  subjectCode: "", name: "", description: "",
  selectedProgram: "", course: "",
  semester: 1, year: CURRENT_YEAR,
  credits: 3, type: "THEORY", facultyName: "", status: "ACTIVE",
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function SubjectForm({
  form, setForm, onSubmit, submitting, error, submitLabel, codeDisabled = false,
  programs, coursesByProgram,
}: {
  form: SubjectFormState;
  setForm: React.Dispatch<React.SetStateAction<SubjectFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  submitLabel: string;
  codeDisabled?: boolean;
  programs: ProgramData[];
  coursesByProgram: Record<string, CourseData[]>;
}) {
  const set = <K extends keyof SubjectFormState>(k: K, v: SubjectFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const availableCourses = form.selectedProgram
    ? (coursesByProgram[form.selectedProgram] ?? [])
    : [];

  function handleProgramChange(programName: string) {
    setForm((f) => ({ ...f, selectedProgram: programName, course: "" }));
  }

  return (
    <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Subject Code *</label>
          <input
            required value={form.subjectCode} disabled={codeDisabled}
            onChange={(e) => set("subjectCode", e.target.value.toUpperCase())}
            placeholder="CS101"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Subject Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="Data Structures and Algorithms"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* Program → Course cascade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Program *</label>
          <select
            value={form.selectedProgram}
            onChange={(e) => handleProgramChange(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select program…</option>
            {programs.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Course *</label>
          <select
            required
            value={form.course}
            disabled={!form.selectedProgram}
            onChange={(e) => set("course", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {form.selectedProgram ? "Select course…" : "Select program first"}
            </option>
            {availableCourses.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {form.selectedProgram && availableCourses.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No courses found for this program</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Semester *</label>
          <select required value={form.semester} onChange={(e) => set("semester", Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Year *</label>
          <select required value={form.year} onChange={(e) => set("year", Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Credits *</label>
          <input required type="number" min={1} max={10} value={form.credits}
            onChange={(e) => set("credits", Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
          <select required value={form.type} onChange={(e) => set("type", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Faculty</label>
          <input value={form.facultyName} onChange={(e) => set("facultyName", e.target.value)}
            placeholder="Dr. Name"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={2} placeholder="Brief description…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={submitting}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Grouped view ─────────────────────────────────────────────────────────────

function GroupedView({ subjects, groupBy, onEdit, onDelete }: {
  subjects: SubjectData[];
  groupBy: "semester" | "year";
  onEdit: (s: SubjectData) => void;
  onDelete: (s: SubjectData) => void;
}) {
  const groups = subjects.reduce<Record<number, SubjectData[]>>((acc, s) => {
    const key = groupBy === "semester" ? s.semester : s.year;
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const sortedKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

  if (sortedKeys.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">No subjects found</div>;
  }

  return (
    <div className="space-y-5">
      {sortedKeys.map((key) => (
        <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              {groupBy === "semester" ? key : String(key).slice(2)}
            </span>
            <div>
              <span className="font-semibold text-slate-800 text-sm">
                {groupBy === "semester" ? `Semester ${key}` : `Year ${key}`}
              </span>
              <span className="ml-2 text-xs text-slate-400">
                {groups[key].length} subject{groups[key].length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="ml-auto text-xs text-slate-400">
              {groups[key].reduce((s, x) => s + x.credits, 0)} credits total
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                {["Code", "Name", "Course", groupBy === "semester" ? "Year" : "Sem", "Credits", "Type", "Faculty", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groups[key].map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{s.subjectCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    {s.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{s.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.course}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {groupBy === "semester" ? s.year : `Sem ${s.semester}`}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{s.credits}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[s.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {s.type.charAt(0) + s.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.facultyName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => onEdit(s)} className="text-indigo-600 hover:underline text-xs font-medium">Edit</button>
                      <button onClick={() => onDelete(s)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const [subjects,      setSubjects]      = useState<SubjectData[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalElements, setTotal]         = useState(0);
  const [totalPages,    setTotalPages]    = useState(0);
  const [page,          setPage]          = useState(0);

  // filters
  const [search,   setSearch]   = useState("");
  const [course,   setCourse]   = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [year,     setYear]     = useState<number | "">("");
  const [status,   setStatus]   = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // program + course data for form dropdowns
  const [programs,         setPrograms]         = useState<ProgramData[]>([]);
  const [coursesByProgram, setCoursesByProgram] = useState<Record<string, CourseData[]>>({});

  // modals
  const [showCreate,  setShowCreate]  = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectData | null>(null);
  const [delSubject,  setDelSubject]  = useState<SubjectData | null>(null);
  const [form,        setForm]        = useState<SubjectFormState>({ ...EMPTY });
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");
  const [delLoading,  setDelLoading]  = useState(false);

  // load programs and build programName → CourseData[] map
  useEffect(() => {
    Promise.allSettled([
      api.programs.list("", "", 0),
      api.courses.list("", "", "", 0),
    ]).then(([progRes, courseRes]) => {
      const progs   = progRes.status   === "fulfilled" ? progRes.value.content   : [];
      const courses = courseRes.status === "fulfilled" ? courseRes.value.content : [];
      setPrograms(progs);

      // map each program name to its matching courses
      // Course.program stores a string like "B.Tech CSE" — match on containment
      const map: Record<string, CourseData[]> = {};
      for (const prog of progs) {
        map[prog.name] = courses.filter((c: CourseData) =>
          c.program.toLowerCase().includes(prog.name.toLowerCase()) ||
          prog.name.toLowerCase().includes(c.program.toLowerCase())
        );
      }
      // also capture any courses whose program doesn't match a known program name
      for (const c of courses) {
        const alreadyMapped = Object.values(map).flat().some((x) => x.id === c.id);
        if (!alreadyMapped) {
          (map[c.program] ??= []).push(c);
        }
      }
      setCoursesByProgram(map);
    });
  }, []);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.subjects.list(
        search, course,
        semester !== "" ? semester : undefined,
        year     !== "" ? year     : undefined,
        status, page
      );
      setSubjects(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, course, semester, year, status, page]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  function openCreate() {
    setForm({ ...EMPTY });
    setFormError("");
    setShowCreate(true);
  }

  function openEdit(s: SubjectData) {
    // find which program owns this subject's course so we can pre-select the program dropdown
    const matchedProgram = Object.entries(coursesByProgram).find(([, courses]) =>
      courses.some((c) => c.name === s.course)
    )?.[0] ?? "";

    setForm({
      subjectCode: s.subjectCode, name: s.name, description: s.description ?? "",
      selectedProgram: matchedProgram, course: s.course,
      semester: s.semester, year: s.year,
      credits: s.credits, type: s.type,
      facultyName: s.facultyName ?? "", status: s.status,
    });
    setFormError("");
    setEditSubject(s);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      // strip selectedProgram — it's UI-only
      const { selectedProgram: _sp, ...payload } = form;
      void _sp;
      await api.subjects.create(payload);
      setShowCreate(false);
      fetchSubjects();
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message ?? "Failed to create subject");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editSubject) return;
    setFormError("");
    setSubmitting(true);
    try {
      const { selectedProgram: _sp, ...payload } = form;
      void _sp;
      await api.subjects.update(editSubject.id, payload);
      setEditSubject(null);
      fetchSubjects();
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message ?? "Failed to update subject");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!delSubject) return;
    setDelLoading(true);
    try {
      await api.subjects.delete(delSubject.id);
      setDelSubject(null);
      fetchSubjects();
    } catch (e) {
      console.error(e);
    } finally {
      setDelLoading(false);
    }
  }

  // all unique courses for the filter bar
  const allCourses = Object.values(coursesByProgram)
    .flat()
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);

  const resetFilters = () => {
    setSearch(""); setCourse(""); setSemester(""); setYear(""); setStatus(""); setPage(0);
  };

  return (
    <div className="w-full p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
          <p className="text-slate-500 text-sm mt-1">Manage subjects by course, semester, and year</p>
        </div>
        <button onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search subjects…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={course} onChange={(e) => { setCourse(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Courses</option>
          {allCourses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={semester} onChange={(e) => { setSemester(e.target.value === "" ? "" : Number(e.target.value)); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Semesters</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
            <option key={s} value={s}>Sem {s}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => { setYear(e.target.value === "" ? "" : Number(e.target.value)); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
        {(search || course || semester !== "" || year !== "" || status) && (
          <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-slate-600 px-2">Clear ×</button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {loading ? "Loading…" : `${totalElements} subject${totalElements !== 1 ? "s" : ""}`}
        </span>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs font-medium">
          {(["list", "semester", "year"] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 transition-colors ${viewMode === v ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              {v === "list" ? "List" : v === "semester" ? "By Semester" : "By Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading subjects…</div>
      ) : subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-lg">No subjects found</p>
          <button onClick={openCreate} className="mt-3 text-indigo-600 text-sm hover:underline">Add your first subject →</button>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Code", "Name", "Course", "Sem", "Year", "Credits", "Type", "Faculty", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{s.subjectCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    {s.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{s.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.course}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{s.semester}</td>
                  <td className="px-4 py-3 text-slate-500">{s.year}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{s.credits}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[s.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {s.type.charAt(0) + s.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.facultyName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(s)} className="text-indigo-600 hover:underline text-xs font-medium">Edit</button>
                      <button onClick={() => setDelSubject(s)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Page {page + 1} of {totalPages} · {totalElements} subjects</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">← Prev</button>
                <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">Next →</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <GroupedView subjects={subjects} groupBy={viewMode} onEdit={openEdit} onDelete={(s) => setDelSubject(s)} />
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Add Subject" onClose={() => setShowCreate(false)}>
          <SubjectForm form={form} setForm={setForm} onSubmit={handleCreate}
            submitting={submitting} error={formError} submitLabel="Create Subject"
            programs={programs} coursesByProgram={coursesByProgram} />
        </Modal>
      )}

      {/* Edit modal */}
      {editSubject && (
        <Modal title={`Edit — ${editSubject.name}`} onClose={() => setEditSubject(null)}>
          <SubjectForm form={form} setForm={setForm} onSubmit={handleEdit}
            submitting={submitting} error={formError} submitLabel="Save Changes"
            codeDisabled programs={programs} coursesByProgram={coursesByProgram} />
        </Modal>
      )}

      {/* Delete confirm */}
      {delSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Delete Subject</h2>
            <p className="text-sm text-slate-500 mb-6">
              Delete <span className="font-medium text-slate-700">{delSubject.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelSubject(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={delLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {delLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
