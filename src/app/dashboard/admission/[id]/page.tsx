"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, AdmissionData } from "@/lib/api";

function Row({ label, value, full }: { label: string; value?: string | number | null; full?: boolean }) {
  return (
    <div className={`flex items-start gap-2 py-1.5 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs text-gray-500 w-40 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-800 mb-3 pb-1.5 border-b border-gray-200">{title}</h3>
      <div className="grid grid-cols-2 gap-x-8">{children}</div>
    </div>
  );
}

const statusStyle: Record<string, string> = {
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  REVIEW:   "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function AdmissionViewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData]     = useState<AdmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    api.admissions.get(id)
      .then(setData)
      .catch(() => setError("Admission not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-5 h-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-20 text-gray-500">{error ?? "Not found"}</div>
  );

  return (
    <div className="w-full p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Link href="/dashboard/admission" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Admission Form</h1>
          <p className="text-gray-500 text-sm">{data.firstName} {data.lastName}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusStyle[data.status]}`}>
          {data.status}
        </span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Print / PDF
        </button>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Form header */}
        <div className="text-center px-8 py-8 border-b border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422A12.083 12.083 0 0121 13.5c0 3.314-4.029 6-9 6s-9-2.686-9-6c0-.538.091-1.06.255-1.554L12 14z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">University ERP</h2>
          <p className="text-gray-500 text-sm mt-0.5">Academic Portal — Admission Form</p>
          <div className="mt-4 inline-flex items-center gap-4 text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2">
            <span>Admission ID: <strong className="font-mono text-gray-800">{data.admissionId}</strong></span>
            <span className="w-px h-3 bg-gray-300" />
            <span>Date: <strong>{new Date(data.createdAt).toLocaleDateString("en-IN")}</strong></span>
            <span className="w-px h-3 bg-gray-300" />
            <span>Status: <strong className={data.status === "APPROVED" ? "text-green-600" : "text-amber-600"}>{data.status}</strong></span>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          <Section title="1. Personal Information">
            <Row label="Full Name"     value={`${data.firstName} ${data.lastName}`} />
            <Row label="Date of Birth" value={data.dateOfBirth} />
            <Row label="Gender"        value={data.gender} />
            <Row label="Nationality"   value={data.nationality} />
            <Row label="Email"         value={data.email} />
            <Row label="Phone"         value={data.phone} />
            <Row label="Address" value={[data.address, data.city, data.state, data.pincode].filter(Boolean).join(", ")} full />
          </Section>

          <Section title="2. Academic Information">
            <Row label="Program"    value={data.program} />
            <Row label="Semester"   value={`Semester ${data.semester}`} />
            <Row label="Batch Year" value={data.batchYear} />
          </Section>

          <Section title="3. Previous Education">
            <Row label="School / College"   value={data.prevSchool} />
            <Row label="Board / University" value={data.prevBoard} />
            <Row label="Passing Year"       value={data.prevYear} />
            <Row label="Percentage / CGPA"  value={data.prevPercentage} />
          </Section>

          <Section title="4. Guardian / Parent Details">
            <Row label="Guardian Name"  value={data.guardianName} />
            <Row label="Relation"       value={data.guardianRelation} />
            <Row label="Guardian Phone" value={data.guardianPhone} />
            <Row label="Guardian Email" value={data.guardianEmail} />
          </Section>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-8 text-center">
              {["Applicant's Signature", "Guardian's Signature", "Admission Officer"].map((s) => (
                <div key={s}>
                  <div className="h-14 border-b border-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">{s}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-6">
              This is a computer-generated admission form. Generated on {new Date(data.createdAt).toLocaleString("en-IN")}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
