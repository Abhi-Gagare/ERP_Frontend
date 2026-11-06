"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { accountantNavigation } from "@/lib/accountant/navigation";

export default function AccountantSidebar({ fullName }: { fullName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM6 12v6c4 3 8 3 12 0v-6" /></svg>
        </div>
        <div><p className="text-sm leading-none font-semibold text-gray-900">University ERP</p><p className="mt-0.5 text-xs text-gray-400">Accounts &amp; Finance</p></div>
      </div>
      <nav aria-label="Accountant navigation" className="max-h-80 flex-1 space-y-0.5 overflow-y-auto px-3 py-4 md:max-h-none">
        {accountantNavigation.map(item => {
          const href = `/accountant${item.path ? `/${item.path}` : ""}`;
          const active = pathname === href || (item.path !== "" && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-100 focus-visible:outline-2 focus-visible:outline-indigo-600 ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <svg className={`h-5 w-5 shrink-0 ${active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={item.path === "" ? "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" : "M5 3h14v18H5zM9 7h6M9 11h6M9 15h6"} /></svg>
              <span className="flex-1">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{fullName.charAt(0)}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{fullName}</p><p className="text-xs text-gray-400">ACCOUNTANT</p></div>
          <button title="Sign out" aria-label="Sign out" onClick={() => { clearSession(); router.replace("/accountant/login"); }} className="rounded p-1 text-gray-400 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-indigo-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H4v14h5M14 8l4 4-4 4M8 12h10" /></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
