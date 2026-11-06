"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type EmailSettings, type SmtpInput } from "@/lib/admin/api";
import PasswordInput from "@/components/PasswordInput";

const input = "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const button = "rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50";
interface Form { host: string; username: string; password: string; connection: string; port: number; security: "STARTTLS" | "SSL"; enabled: boolean }
const emptyForm: Form = { host: "", username: "", password: "", connection: "587", port: 587, security: "STARTTLS", enabled: true };

export default function EmailSettingsPage() {
  const [accounts, setAccounts] = useState<EmailSettings[]>([]);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailSettings | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>({ ...emptyForm });
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(true);
  const [busy, setBusy] = useState(false);
  const active = accounts.find(account => account.enabled);

  useEffect(() => {
    let mounted = true;
    adminApi.emailAccounts().then(result => {
      if (mounted) { setAccounts(result.accounts); setEncryptionReady(result.encryptionReady); setShowForm(result.accounts.length === 0); }
    }).catch(err => { if (mounted) setError(err.message ?? "Unable to load SMTP accounts."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function refresh() {
    const result = await adminApi.emailAccounts();
    setAccounts(result.accounts); setEncryptionReady(result.encryptionReady);
  }

  function add() { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); setError(""); setNotice(""); }
  function edit(account: EmailSettings) {
    setEditing(account);
    const standard = account.port === 587 && account.security === "STARTTLS" ? "587" : account.port === 465 && account.security === "SSL" ? "465" : "custom";
    setForm({ host: account.host, username: account.username, password: "", connection: standard, port: account.port, security: account.security, enabled: account.enabled });
    setShowForm(true); setError(""); setNotice("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const data: SmtpInput = {
        host: form.host.trim(), username: form.username.trim(), password: form.password,
        port: form.port, security: form.security, enabled: form.enabled,
        senderName: editing?.senderName || "University Office",
        senderEmail: editing && editing.username === form.username.trim() ? editing.senderEmail : form.username.trim(),
        replyTo: editing?.replyTo ?? "", publicUrl: window.location.origin,
      };
      if (editing?.id != null) await adminApi.updateEmailAccount(editing.id, data);
      else await adminApi.createEmailAccount(data);
      setForm({ ...emptyForm }); setEditing(null); setShowForm(false);
      setSuccess(true); setNotice(form.enabled ? "SMTP account saved and active. Previous accounts are inactive." : "SMTP account saved as inactive.");
      await refresh();
    } catch (err) { setError((err as Error).message ?? "Unable to save SMTP account."); }
    finally { setBusy(false); }
  }

  async function changeStatus(account: EmailSettings) {
    if (account.id == null) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await adminApi.setEmailAccountActive(account.id, !account.enabled);
      setSuccess(true); setNotice(account.enabled ? "SMTP account deactivated." : "SMTP account activated. Previous accounts are inactive.");
      if (editing?.id === account.id) { setEditing(null); setShowForm(false); setForm({ ...emptyForm }); }
      await refresh();
    } catch (err) { setError((err as Error).message ?? "Unable to change account status."); }
    finally { setBusy(false); }
  }

  async function test(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const result = await adminApi.testEmail(recipient); setSuccess(result.sent); setNotice(result.message); }
    catch (err) { setError((err as Error).message ?? "Unable to send test email."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold tracking-tight text-gray-900">Email / SMTP Settings</h1><div className="flex items-center gap-5"><Link href="/dashboard/admin/users" className="text-sm text-indigo-700 underline">User Management</Link><button type="button" disabled={busy || loading} onClick={add} className={button}>Add SMTP account</button></div></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className={`rounded-xl p-4 text-sm ${success ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>{notice}</p>}
    {loading ? <p role="status" className="text-sm text-gray-500">Loading SMTP accounts…</p> : <>
      {!encryptionReady && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Ask the server administrator to configure the email encryption key before saving credentials.</p>}
      {showForm && <form onSubmit={save} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">{editing ? "Edit SMTP account" : "New SMTP account"}</h2>
        <fieldset disabled={busy} className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-gray-700">University email<input required type="email" maxLength={255} placeholder="office@college.in" autoComplete="off" className={input} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
          <div className="text-sm text-gray-700"><label htmlFor="smtp-password">SMTP password</label><PasswordInput id="smtp-password" passwordLabel="SMTP password" required={!editing} maxLength={1024} autoComplete="new-password" placeholder={editing ? "Leave blank to keep saved password" : "Mailbox or app password"} className={input} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <label className="text-sm text-gray-700">SMTP host<input required maxLength={255} placeholder="smtp.college.in" className={input} value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} /></label>
          <label className="text-sm text-gray-700">Connection<select className={input} value={form.connection} onChange={e => { const connection = e.target.value; setForm({ ...form, connection, ...(connection === "custom" ? {} : { port: Number(connection), security: connection === "465" ? "SSL" : "STARTTLS" }) }); }}><option value="587">Port 587 — STARTTLS</option><option value="465">Port 465 — SSL / TLS</option><option value="custom">Custom connection</option></select></label>
          {form.connection === "custom" && <><label className="text-sm text-gray-700">Port<input required type="number" min={1} max={65535} className={input} value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })} /></label><label className="text-sm text-gray-700">Security<select className={input} value={form.security} onChange={e => setForm({ ...form, security: e.target.value as Form["security"] })}><option value="STARTTLS">STARTTLS</option><option value="SSL">SSL / TLS</option></select></label></>}
          <label className="flex items-center gap-3 text-sm text-gray-700 sm:col-span-2"><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4 accent-indigo-600" />Set as active account</label>
        </fieldset>
        <div className="mt-6 flex items-center gap-5"><button disabled={busy || !encryptionReady} className={button}>{busy ? "Saving…" : "Save account"}</button><button type="button" disabled={busy} onClick={() => { setShowForm(false); setEditing(null); setForm({ ...emptyForm }); }} className="text-sm text-gray-600">Cancel</button></div>
      </form>}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><h2 className="border-b border-gray-100 px-6 py-4 text-sm font-semibold text-gray-900">Saved SMTP accounts</h2>
        {accounts.length === 0 ? <p className="p-6 text-sm text-gray-500">No SMTP accounts saved.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Email", "Server", "Status", "Actions"].map(label => <th key={label} className="px-6 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{accounts.map(account => <tr key={account.id}><td className="px-6 py-4 font-medium text-gray-900">{account.username}</td><td className="px-6 py-4 text-gray-500">{account.host}:{account.port}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${account.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{account.enabled ? "ACTIVE" : "INACTIVE"}</span></td><td className="px-6 py-4"><div className="flex gap-4"><button type="button" disabled={busy} onClick={() => edit(account)} className="text-indigo-700 disabled:opacity-50">Edit</button><button type="button" disabled={busy} onClick={() => changeStatus(account)} className={`disabled:opacity-50 ${account.enabled ? "text-red-600" : "text-indigo-700"}`}>{account.enabled ? "Deactivate" : "Activate"}</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="text-sm font-semibold text-gray-900">Test active account{active ? ` — ${active.username}` : " — None"}</h2><form onSubmit={test} className="mt-4 flex flex-wrap items-end gap-4"><label className="min-w-60 flex-1 text-sm text-gray-700">Recipient email<input required type="email" maxLength={255} className={input} value={recipient} onChange={e => setRecipient(e.target.value)} /></label><button disabled={busy || !active} className={button}>Send test email</button></form></section>
    </>}
  </div>;
}
