"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, isLoggedIn } from "@/lib/auth";

type User = {
  id: number;
  email: string;
  fullName: string;
  role: "STUDENT" | "FACULTY" | "ADMIN" | "ACCOUNTANT";
};

const roleColors: Record<string, string> = {
  ADMIN:   "bg-red-50 text-red-600 border-red-200",
  FACULTY: "bg-amber-50 text-amber-600 border-amber-200",
  STUDENT: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const stats = [
  { label: "Courses Enrolled", value: "6",   icon: "📚", trend: "+1 this semester" },
  { label: "Attendance",       value: "87%",  icon: "✅", trend: "Above 75% threshold" },
  { label: "Pending Fees",     value: "₹0",   icon: "💳", trend: "All clear" },
  { label: "GPA",              value: "8.4",  icon: "🎓", trend: "Top 15% of batch" },
];

const recentActivity = [
  { label: "Assignment submitted", sub: "Data Structures — 2h ago",       dot: "bg-blue-500" },
  { label: "Attendance marked",    sub: "Mathematics — Today 9:00 AM",    dot: "bg-green-500" },
  { label: "Grade published",      sub: "Physics Practical — Yesterday",  dot: "bg-indigo-500" },
  { label: "Fee receipt generated", sub: "Semester 5 — 3 days ago",       dot: "bg-amber-500" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    if (getUser()?.role === "ACCOUNTANT") { router.replace("/accountant"); return; }
    setUser(getUser());
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-6 h-6 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Good to have you back, {user.fullName.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${roleColors[user.role]}`}>
          {user.role}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-gray-700 text-sm font-medium mt-0.5">{s.label}</div>
            <div className="text-gray-400 text-xs mt-1">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
          </div>
          <ul className="divide-y divide-gray-50">
            {recentActivity.map((a) => (
              <li key={a.label} className="flex items-start gap-4 px-6 py-4">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.dot}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Quick Links</h2>
          </div>
          <ul className="p-3 space-y-1">
            {[
              { label: "View Timetable",     href: "/dashboard/timetable" },
              { label: "Check Grades",       href: "/dashboard/grades" },
              { label: "Mark Attendance",    href: "/dashboard/attendance" },
              { label: "Pay Fees",           href: "/dashboard/fees" },
              { label: "Library Catalogue",  href: "/dashboard/library" },
            ].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
                >
                  {l.label}
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
