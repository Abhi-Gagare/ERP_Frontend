"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/api";
import { clearSession } from "@/lib/auth";

interface Invitation { email: string; fullName: string; role: string; expiresAt: string }
export default function AcceptInvitationPage() {
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState<{ message: string; loginPath: string } | null>(null);
  useEffect(() => {
    let active = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    // The token lives in the fragment, which is never included in HTTP access logs.
    if (!value) {
      queueMicrotask(() => { if (active) setError("Invitation link is missing. Open the full link from your university email."); });
      return;
    }
    request<Invitation>("/auth/invitations/inspect", { method: "POST", body: JSON.stringify({ token: value }) })
      .then(data => { if (active) { setToken(value); setInvitation(data); } })
      .catch(err => { if (active) setError(err.message ?? "Unable to check invitation."); });
    return () => { active = false; };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (new TextEncoder().encode(password).length > 72) { setError("Choose a password no longer than 72 UTF-8 bytes."); return; }
    setBusy(true);
    try {
      const result = await request<{ message: string; loginPath: string }>("/auth/invitations/accept", { method: "POST", body: JSON.stringify({ token, password }) });
      setAccepted(result); setPassword(""); setConfirm(""); setToken("");
      clearSession();
      window.history.replaceState(null, "", window.location.pathname);
    } catch (err) { setError((err as Error).message ?? "Unable to accept invitation."); }
    finally { setBusy(false); }
  }
  const input = "mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12"><section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-indigo-700">University ERP</p><h1 className="mt-3 text-2xl font-bold text-gray-900">Set up your account</h1>
    {accepted ? <><p role="status" className="mt-5 text-sm text-green-700">{accepted.message}</p><Link href={accepted.loginPath} className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700">Continue to sign in</Link></> : <>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!invitation ? !error && <p role="status" className="mt-5 text-sm text-gray-500">Checking your invitation…</p> : <><p className="mt-4 text-sm text-gray-500">Welcome, {invitation.fullName}. Set a password for <span className="font-medium text-gray-700">{invitation.email}</span>.</p><form onSubmit={submit} className="mt-6 space-y-5"><label className="block text-sm text-gray-700">New password<input required type="password" minLength={12} maxLength={72} autoComplete="new-password" className={input} value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block text-sm text-gray-700">Confirm password<input required type="password" minLength={12} maxLength={72} autoComplete="new-password" className={input} value={confirm} onChange={e => setConfirm(e.target.value)} /></label><p className="text-xs text-gray-500">Use at least 12 characters.</p><button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50">{busy ? "Setting password…" : "Set password"}</button></form></>}
    </>}
  </section></main>;
}
