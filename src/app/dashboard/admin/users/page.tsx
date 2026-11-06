"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type ManagedUser, type UserRole } from "@/lib/admin/api";

const input = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const button = "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50";
const statusClass = { ACTIVE: "bg-green-50 text-green-700", PENDING: "bg-amber-50 text-amber-700", INACTIVE: "bg-gray-100 text-gray-600" };

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ fullName: string; email: string; role: UserRole }>({ fullName: "", email: "", role: "ACCOUNTANT" });
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      adminApi.users(search, role, status, page).then(result => {
        if (active) { setUsers(result.content); setPages(result.totalPages); setTotal(result.totalElements); }
      }).catch(err => { if (active) setError(err.message ?? "Unable to load users."); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search, role, status, page, reload]);

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await adminApi.createUser(form);
      setNotice(`Account created. ${result.delivery.message}`); setDeliveryFailed(!result.delivery.sent);
      setForm({ fullName: "", email: "", role: "ACCOUNTANT" }); setReload(n => n + 1);
    } catch (err) { setError((err as Error).message ?? "Unable to create account."); }
    finally { setBusy(false); }
  }

  async function invite(user: ManagedUser) {
    if (!window.confirm(`Send a new invitation to ${user.email}? Existing sessions and invitation links will stop working until they set a password.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await adminApi.invite(user.id); setNotice(result.message); setDeliveryFailed(!result.sent); setReload(n => n + 1);
    } catch (err) { setError((err as Error).message ?? "Unable to send invitation."); }
    finally { setBusy(false); }
  }

  async function update(event: React.FormEvent) {
    event.preventDefault(); if (!editing) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await adminApi.updateUser(editing.id, editing); setEditing(null); setNotice("User updated. Access changes apply immediately."); setDeliveryFailed(false); setReload(n => n + 1);
    } catch (err) { setError((err as Error).message ?? "Unable to update user."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1><p className="mt-1 text-sm text-gray-500">Create university accounts and manage invitations and access.</p></div><Link href="/dashboard/admin/email-settings" className="text-sm font-medium text-indigo-700 underline">Email / SMTP Settings</Link></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className={`rounded-xl p-4 text-sm ${deliveryFailed ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>{notice}</p>}
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Add user and send invitation</h2>
      <form onSubmit={create} className="mt-4 grid items-end gap-4 md:grid-cols-4">
        <label className="space-y-2 text-sm text-gray-700"><span>Full name</span><input required maxLength={255} className={input} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label>
        <label className="space-y-2 text-sm text-gray-700"><span>Login email</span><input required type="email" maxLength={255} className={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label className="space-y-2 text-sm text-gray-700"><span>Role</span><select className={input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}><option value="STUDENT">Student</option><option value="FACULTY">Faculty</option><option value="ACCOUNTANT">Accountant</option></select></label>
        <button className={button} disabled={busy}>{busy ? "Please wait…" : "Create & invite"}</button>
      </form>
      <p className="mt-4 text-xs leading-5 text-gray-500">Students require an approved admission. If approval already created their account, use its Invite action below. Invitations let users set their own password and expire after 24 hours.</p>
    </section>
    {editing && <section className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm" aria-label="Edit user"><h2 className="font-semibold text-gray-900">Edit {editing.email}</h2><form onSubmit={update} className="mt-4 grid items-end gap-4 md:grid-cols-4">
      <label className="space-y-2 text-sm text-gray-700"><span>Full name</span><input required maxLength={255} className={input} value={editing.fullName} onChange={e => setEditing({ ...editing, fullName: e.target.value })} /></label>
      <label className="space-y-2 text-sm text-gray-700"><span>Role</span><select className={input} value={editing.role} disabled={editing.role === "STUDENT"} onChange={e => setEditing({ ...editing, role: e.target.value as UserRole })}>{editing.role === "STUDENT" ? <option value="STUDENT">Student</option> : <><option value="FACULTY">Faculty</option><option value="ACCOUNTANT">Accountant</option></>}</select></label>
      <label className="space-y-2 text-sm text-gray-700"><span>Account access</span><select className={input} value={String(editing.active)} onChange={e => setEditing({ ...editing, active: e.target.value === "true" })}><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
      <div className="flex gap-3"><button disabled={busy} className={button}>Save</button><button type="button" disabled={busy} onClick={() => setEditing(null)} className="text-sm text-gray-600">Cancel</button></div>
    </form></section>}
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-5"><h2 className="mr-auto text-sm font-semibold text-gray-900">Users ({total})</h2><input aria-label="Search users" placeholder="Search name or email" className={`${input} sm:w-60`} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /><select aria-label="Filter role" className={`${input} sm:w-36`} value={role} onChange={e => { setRole(e.target.value); setPage(0); }}><option value="">All roles</option>{["ADMIN", "STUDENT", "FACULTY", "ACCOUNTANT"].map(r => <option key={r}>{r}</option>)}</select><select aria-label="Filter status" className={`${input} sm:w-36`} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">All statuses</option>{["ACTIVE", "PENDING", "INACTIVE"].map(s => <option key={s}>{s}</option>)}</select></div>
      {loading ? <p role="status" className="p-8 text-sm text-gray-500">Loading users…</p> : users.length === 0 ? <p className="p-8 text-sm text-gray-500">No users match these filters.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["User", "Role", "Status", "Invitation", "Actions"].map(label => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{users.map(user => <tr key={user.id} className="align-top"><td className="px-5 py-4"><p className="font-medium text-gray-900">{user.fullName}</p><p className="mt-1 text-gray-500">{user.email}</p></td><td className="px-5 py-4 text-gray-600">{user.role}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[user.status]}`}>{user.status}</span></td><td className="max-w-xs px-5 py-4 text-xs text-gray-500"><p>{user.invitationDelivery ?? "Not sent"}</p>{user.status === "PENDING" && <><p className="mt-1">{user.deliveryMessage}</p>{user.invitationExpiresAt && <p className="mt-1">Link expires: {new Date(user.invitationExpiresAt).toLocaleString()}</p>}</>}</td><td className="px-5 py-4">{user.role === "ADMIN" ? <span className="text-xs text-gray-400">Admin account</span> : <div className="flex gap-4"><button disabled={busy} onClick={() => setEditing({ ...user })} className="text-indigo-700 disabled:opacity-50">Edit</button><button disabled={busy || !user.active} onClick={() => invite(user)} className="text-indigo-700 disabled:opacity-50">Invite / resend</button></div>}</td></tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm text-gray-500"><span>Page {pages === 0 ? 0 : page + 1} of {pages}</span><div className="flex gap-4"><button disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40">Previous</button><button disabled={page + 1 >= pages || loading} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40">Next</button></div></div>
    </section>
  </div>;
}
