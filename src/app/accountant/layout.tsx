"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, type AuthResponse } from "@/lib/api";
import { getToken } from "@/lib/auth";
import AccountantSidebar from "@/components/accountant/AccountantSidebar";

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<main className="p-8 text-gray-500" role="status">Checking your account…</main>}><AccountantLayoutContent>{children}</AccountantLayoutContent></Suspense>;
}

function AccountantLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [error, setError] = useState("");
  const isLogin = pathname === "/accountant/login";

  useEffect(() => {
    if (isLogin) return;
    if (!getToken()) { router.replace("/accountant/login"); return; }
    let active = true;
    api.me().then(current => {
      if (!active) return;
      if (current.role !== "ACCOUNTANT") { router.replace("/dashboard"); return; }
      setUser(current);
    }).catch(() => { if (active) setError("Unable to verify your account. Please sign in again."); });
    return () => { active = false; };
  }, [isLogin, router]);

  useEffect(()=>{const refresh=()=>{api.me().then(setUser).catch(()=>setError("Unable to reload your profile."));};window.addEventListener('accountant-profile-updated',refresh);return()=>window.removeEventListener('accountant-profile-updated',refresh);},[]);
  if (isLogin) return children;
  if (error) return <main className="p-8"><p role="alert">{error}</p><a href="/accountant/login" className="text-indigo-700 underline">Sign in</a></main>;
  if (!user) return <main className="p-8 text-gray-500" role="status">Checking your account…</main>;
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AccountantSidebar fullName={user.fullName} />
      <div className="min-w-0 flex-1">
        <header className="print:hidden flex h-16 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-8 text-sm text-gray-500">Accounts &amp; Finance</header>
        <main className="p-6 md:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
