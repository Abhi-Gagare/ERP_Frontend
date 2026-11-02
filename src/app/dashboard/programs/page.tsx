"use client";

import { useEffect, useState } from "react";
import { api, ProgramData } from "@/lib/api";

const CARD_COLORS = [
  "bg-indigo-50 border-indigo-200 text-indigo-700",
  "bg-violet-50 border-violet-200 text-violet-700",
  "bg-sky-50 border-sky-200 text-sky-700",
  "bg-emerald-50 border-emerald-200 text-emerald-700",
  "bg-amber-50 border-amber-200 text-amber-700",
  "bg-rose-50 border-rose-200 text-rose-700",
  "bg-teal-50 border-teal-200 text-teal-700",
  "bg-orange-50 border-orange-200 text-orange-700",
];

const EMPTY_FORM = {
  code: "", name: "", description: "", deanName: "", deanEmail: "", deanPhone: "",
  programs: "", status: "ACTIVE",
};

type FormState = typeof EMPTY_FORM;

function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function DeptForm({
  form, setForm, onSubmit, submitting, error, submitLabel, codeDisabled = false,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  submitLabel: string;
  codeDisabled?: boolean;
}) {
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
          <input
            required value={form.code} disabled={codeDisabled}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="CS"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={form.status} onChange={(e) => set("status", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Program Name *</label>
        <input
          required value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="Computer Science"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea
          value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={2} placeholder="Brief description…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Degree Offerings (comma-separated)</label>
        <input
          value={form.programs} onChange={(e) => set("programs", e.target.value)}
          placeholder="B.Tech, M.Tech, Ph.D"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <p className="text-xs text-slate-400 mt-1">Degree levels offered under this program</p>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dean</p>
        <div className="grid grid-cols-1 gap-3">
          <input
            value={form.deanName} onChange={(e) => set("deanName", e.target.value)}
            placeholder="Dr. Full Name"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.deanEmail} onChange={(e) => set("deanEmail", e.target.value)}
              placeholder="dean@university.edu"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              value={form.deanPhone} onChange={(e) => set("deanPhone", e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit" disabled={submitting}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [editDept, setEditDept] = useState<ProgramData | null>(null);
  const [deleteDept, setDeleteDept] = useState<ProgramData | null>(null);

  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchDepts() {
    setLoading(true);
    try {
      const res = await api.programs.list(search, "", page);
      setDepartments(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDepts(); }, [search, page]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowCreate(true);
  }

  function openEdit(d: ProgramData) {
    setForm({
      code: d.code,
      name: d.name,
      description: d.description ?? "",
      deanName: d.deanName ?? "",
      deanEmail: d.deanEmail ?? "",
      deanPhone: d.deanPhone ?? "",
      programs: (d.programs ?? []).join(", "),
      status: d.status,
    });
    setFormError("");
    setEditDept(d);
  }

  function parsePrograms(raw: string): string[] {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.programs.create({
        ...form,
        programs: parsePrograms(form.programs),
      });
      setShowCreate(false);
      fetchDepts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e?.message ?? "Failed to create program");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDept) return;
    setFormError("");
    setSubmitting(true);
    try {
      await api.programs.update(editDept.code, {
        ...form,
        programs: parsePrograms(form.programs),
      });
      setEditDept(null);
      fetchDepts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e?.message ?? "Failed to update program");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteDept) return;
    setDeleteLoading(true);
    try {
      await api.programs.delete(deleteDept.code);
      setDeleteDept(null);
      fetchDepts();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalOfferings = departments.reduce((s, d) => s + (d.programs?.length ?? 0), 0);

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programs</h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic programs and their offerings</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Program
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Programs", value: totalElements },
          { label: "Active", value: departments.filter((d) => d.status === "ACTIVE").length },
          { label: "Degree Offerings", value: totalOfferings },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <input
          type="text"
          placeholder="Search programs…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading…</div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-lg">No programs yet</p>
          <button onClick={openCreate} className="mt-3 text-indigo-600 text-sm hover:underline">
            Add your first program →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {departments.map((dept, i) => (
            <div key={dept.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center font-bold text-sm shrink-0 ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                    {dept.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{dept.name}</h3>
                      {dept.status === "INACTIVE" && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    {dept.deanName && (
                      <p className="text-xs text-slate-400 mt-0.5">Dean: {dept.deanName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(dept)}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => setDeleteDept(dept)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {dept.description && (
                <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{dept.description}</p>
              )}

              {dept.programs && dept.programs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {dept.programs.map((p) => (
                    <span key={p} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{p}</span>
                  ))}
                </div>
              )}

              {(dept.deanEmail || dept.deanPhone) && (
                <div className="flex gap-4 border-t border-slate-100 pt-3">
                  {dept.deanEmail && (
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{dept.deanEmail}</span>
                  )}
                  {dept.deanPhone && (
                    <span className="text-xs text-slate-400">{dept.deanPhone}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
            >← Prev</button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
            >Next →</button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Add Program" onClose={() => setShowCreate(false)}>
          <DeptForm
            form={form} setForm={setForm}
            onSubmit={handleCreate} submitting={submitting}
            error={formError} submitLabel="Create Program"
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editDept && (
        <Modal title={`Edit — ${editDept.name}`} onClose={() => setEditDept(null)}>
          <DeptForm
            form={form} setForm={setForm}
            onSubmit={handleEdit} submitting={submitting}
            error={formError} submitLabel="Save Changes"
            codeDisabled
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Delete Program</h2>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-medium text-slate-700">{deleteDept.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDept(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
