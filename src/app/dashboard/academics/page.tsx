"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ProgramData, CourseData } from "@/lib/api";

interface AcademicsSnapshot {
  totalPrograms: number;
  activePrograms: number;
  totalCourses: number;
  activeCourses: number;
  upcomingCourses: number;
  totalSeats: number;
  availableSeats: number;
  totalStudents: number;
  activeStudents: number;
  programs: ProgramData[];
  recentCourses: CourseData[];
}

const PILL = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  UPCOMING: "bg-blue-100 text-blue-700",
};

function StatCard({ label, value, sub, color = "text-slate-800" }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AcademicsOverviewPage() {
  const [data, setData] = useState<AcademicsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [progRes, courseRes, studentRes] = await Promise.allSettled([
        api.programs.list("", "", 0),
        api.courses.list("", "", "", 0),
        api.students.list("", "", undefined, 0),
      ]);

      const programs = progRes.status === "fulfilled" ? progRes.value.content : [];
      const progTotal = progRes.status === "fulfilled" ? progRes.value.totalElements : 0;
      const courses  = courseRes.status === "fulfilled" ? courseRes.value.content : [];
      const courseTotal = courseRes.status === "fulfilled" ? courseRes.value.totalElements : 0;
      const students = studentRes.status === "fulfilled" ? studentRes.value.content : [];
      const studentTotal = studentRes.status === "fulfilled" ? studentRes.value.totalElements : 0;

      setData({
        totalPrograms: progTotal,
        activePrograms: programs.filter((p) => p.status === "ACTIVE").length,
        totalCourses: courseTotal,
        activeCourses: courses.filter((c) => c.status === "ACTIVE").length,
        upcomingCourses: courses.filter((c) => c.status === "UPCOMING").length,
        totalSeats: courses.reduce((s, c) => s + c.totalSeats, 0),
        availableSeats: courses.reduce((s, c) => s + c.availableSeats, 0),
        totalStudents: studentTotal,
        activeStudents: students.filter((s) => s.isActive).length,
        programs: programs.slice(0, 6),
        recentCourses: courses.slice(0, 5),
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-sm">Loading academics overview…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full p-8 text-center text-slate-400 text-sm">
        Failed to load data. Please refresh.
      </div>
    );
  }

  const seatUtil = data.totalSeats > 0
    ? Math.round(((data.totalSeats - data.availableSeats) / data.totalSeats) * 100)
    : 0;

  return (
    <div className="w-full p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Academics Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Summary of programs, courses, and enrollment</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Programs" value={data.totalPrograms} sub={`${data.activePrograms} active`} color="text-indigo-600" />
        <StatCard label="Courses" value={data.totalCourses} sub={`${data.activeCourses} active · ${data.upcomingCourses} upcoming`} color="text-violet-600" />
        <StatCard label="Students" value={data.totalStudents} sub={`${data.activeStudents} enrolled`} color="text-emerald-600" />
        <StatCard label="Seat Utilisation" value={`${seatUtil}%`} sub={`${data.totalSeats - data.availableSeats} of ${data.totalSeats} filled`} color="text-amber-600" />
      </div>

      {/* Programs + recent courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Programs */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Programs</h2>
            <Link href="/dashboard/programs" className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          {data.programs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No programs yet</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.programs.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                    <span className="text-indigo-700 text-xs font-bold">{p.code}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    {p.deanName && <p className="text-xs text-slate-400 truncate">Dean: {p.deanName}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PILL[p.status]}`}>
                    {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent courses */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Courses</h2>
            <Link href="/dashboard/courses" className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          {data.recentCourses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No courses yet</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentCourses.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-700 font-semibold shrink-0">{c.courseCode}</span>
                      <span className="text-sm font-medium text-slate-800 truncate">{c.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{c.program} · {c.level}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PILL[c.status]}`}>
                      {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{c.availableSeats}/{c.totalSeats} seats</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Add Program", href: "/dashboard/programs", icon: "🏛️" },
            { label: "Add Course", href: "/dashboard/courses/new", icon: "📚" },
            { label: "View Students", href: "/dashboard/students", icon: "🎓" },
            { label: "Admissions", href: "/dashboard/admission", icon: "📋" },
          ].map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
            >
              <span className="text-lg">{q.icon}</span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
