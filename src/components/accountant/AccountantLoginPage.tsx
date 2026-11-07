"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import PasswordInput from "@/components/PasswordInput";

export default function AccountantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const session = await api.login(email.trim(), password);
      if (session.user.role !== "ACCOUNTANT") {
        setError("Use an Accountant account to access this portal.");
        return;
      }
      saveSession(session);
      router.replace("/accountant");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Unable to sign in. Please try again.");
    } finally { setLoading(false); }
  }

  const input = "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-700">University ERP</p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Accountant sign in</h1>
        <p className="mt-2 text-sm text-gray-500">Access your Accounts &amp; Finance workspace.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div><label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className={input} /></div>
          <div><label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label><PasswordInput id="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={input} /></div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-sm text-gray-500">Account access is provided by your administrator.</p>
        <Link href="/login" className="mt-4 inline-block text-sm text-indigo-700 underline">Return to university sign in</Link>
      </section>
    </main>
  );
}
