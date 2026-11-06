"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminAccessLayout({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");
  useEffect(() => {
    let active = true;
    api.me().then(user => { if (active) setAccess(user.role === "ADMIN" ? "allowed" : "denied"); })
      .catch(() => { if (active) setAccess("denied"); });
    return () => { active = false; };
  }, []);
  if (access === "checking") return <p role="status" className="text-sm text-gray-500">Checking Admin access…</p>;
  if (access === "denied") return <div className="rounded-2xl border border-gray-200 bg-white p-8"><h1 className="text-xl font-semibold text-gray-900">Admin access required</h1><p className="mt-2 text-sm text-gray-500">Sign in with an Admin account to manage users and university email.</p><Link className="mt-4 inline-block text-indigo-700 underline" href="/login">Sign in</Link></div>;
  return children;
}
