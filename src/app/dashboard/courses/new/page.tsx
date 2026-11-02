"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const LEVEL_OPTIONS = ["Undergraduate", "Postgraduate", "Doctoral", "Diploma", "Certificate"];
const MODE_OPTIONS = ["Full-time", "Part-time", "Online", "Hybrid"];

export default function NewCoursePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseCode: "",
    name: "",
    description: "",
    program: "",
    credits: "",
    durationMonths: "",
    level: LEVEL_OPTIONS[0],
    mode: MODE_OPTIONS[0],
    totalSeats: "",
    availableSeats: "",
    status: "ACTIVE",
  });

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        credits: Number(form.credits),
        durationMonths: Number(form.durationMonths),
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        feeComponents: [],
      };
      const created = await api.courses.create(payload);
      router.push(`/dashboard/courses/${created.courseCode}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full p-8">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-indigo-600 text-sm hover:underline mb-2 block">← Back</button>
        <h1 className="text-2xl font-bold text-slate-800">Add New Course</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the course details</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Course Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Course Code *</label>
              <input
                required
                value={form.courseCode}
                onChange={(e) => setField("courseCode", e.target.value.toUpperCase())}
                placeholder="CS101"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Course Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Introduction to Computer Science"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Program *</label>
              <input
                required
                value={form.program}
                onChange={(e) => setField("program", e.target.value)}
                placeholder="B.Tech, M.Tech, MBA…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Level *</label>
              <select
                value={form.level}
                onChange={(e) => setField("level", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {LEVEL_OPTIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mode *</label>
              <select
                value={form.mode}
                onChange={(e) => setField("mode", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {MODE_OPTIONS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Credits *</label>
              <input
                required type="number" min={1}
                value={form.credits}
                onChange={(e) => setField("credits", e.target.value)}
                placeholder="4"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duration (months) *</label>
              <input
                required type="number" min={1}
                value={form.durationMonths}
                onChange={(e) => setField("durationMonths", e.target.value)}
                placeholder="48"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total Seats *</label>
              <input
                required type="number" min={1}
                value={form.totalSeats}
                onChange={(e) => setField("totalSeats", e.target.value)}
                placeholder="60"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Available Seats *</label>
              <input
                required type="number" min={0}
                value={form.availableSeats}
                onChange={(e) => setField("availableSeats", e.target.value)}
                placeholder="60"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                placeholder="Brief description of the course…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creating…" : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
