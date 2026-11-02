"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, CourseData } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  UPCOMING: "bg-blue-100 text-blue-700",
};

const LEVEL_OPTIONS = ["Undergraduate", "Postgraduate", "Doctoral", "Diploma", "Certificate"];
const MODE_OPTIONS = ["Full-time", "Part-time", "Online", "Hybrid"];

export default function CourseDetailPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const c = await api.courses.get(code);
      setCourse(c);
      resetForm(c);
    } catch {
      setError("Course not found");
    } finally {
      setLoading(false);
    }
  }

  function resetForm(c: CourseData) {
    setForm({
      courseCode: c.courseCode,
      name: c.name,
      description: c.description ?? "",
      program: c.program,
      credits: String(c.credits),
      durationMonths: String(c.durationMonths),
      level: c.level,
      mode: c.mode,
      totalSeats: String(c.totalSeats),
      availableSeats: String(c.availableSeats),
      status: c.status,
    });
  }

  useEffect(() => { load(); }, [code]);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        credits: Number(form.credits),
        durationMonths: Number(form.durationMonths),
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        feeComponents: [],
      };
      const updated = await api.courses.update(code, payload);
      setCourse(updated);
      resetForm(updated);
      setEditing(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="w-full p-8 text-slate-400">Loading…</div>;
  if (!course) return <div className="w-full p-8 text-red-500">{error || "Not found"}</div>;

  return (
    <div className="w-full p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push("/dashboard/courses")} className="text-indigo-600 text-sm hover:underline mb-2 block">← All Courses</button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{course.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[course.status]}`}>{course.status}</span>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-mono">{course.courseCode} · {course.program}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => { resetForm(course); setEditing(false); setError(""); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"
            >
              Edit Course
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {!editing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: "Level", value: course.level },
              { label: "Mode", value: course.mode },
              { label: "Credits", value: course.credits },
              { label: "Duration", value: `${course.durationMonths} months` },
              { label: "Total Seats", value: course.totalSeats },
              { label: "Available Seats", value: course.availableSeats },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {course.description && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>
            </div>
          )}
        </div>
      ) : (
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Course Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Course Code</label>
              <input
                value={form.courseCode} disabled
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 text-slate.400"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Course Name *</label>
              <input
                required value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {[
              { label: "Program", key: "program", type: "text" },
              { label: "Status", key: "status", type: "select", options: ["ACTIVE", "INACTIVE", "UPCOMING"] },
              { label: "Level", key: "level", type: "select", options: LEVEL_OPTIONS },
              { label: "Mode", key: "mode", type: "select", options: MODE_OPTIONS },
              { label: "Credits", key: "credits", type: "number" },
              { label: "Duration (months)", key: "durationMonths", type: "number" },
              { label: "Total Seats", key: "totalSeats", type: "number" },
              { label: "Available Seats", key: "availableSeats", type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {field.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type} min={field.type === "number" ? 0 : undefined}
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                )}
              </div>
            ))}
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
