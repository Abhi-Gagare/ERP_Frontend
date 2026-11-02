"use client";

import { useState } from "react";
import Link from "next/link";
import { api, AdmissionData } from "@/lib/api";

interface FormData {
  firstName: string; lastName: string; dob: string; gender: string;
  email: string; phone: string; address: string; city: string;
  state: string; pincode: string; nationality: string;
  program: string; semester: string; batchYear: string;
  prevSchool: string; prevBoard: string; prevYear: string; prevPercentage: string;
  guardianName: string; guardianRelation: string; guardianPhone: string; guardianEmail: string;
}

const EMPTY: FormData = {
  firstName: "", lastName: "", dob: "", gender: "", email: "", phone: "",
  address: "", city: "", state: "", pincode: "", nationality: "Indian",
  program: "", semester: "1", batchYear: "2026",
  prevSchool: "", prevBoard: "", prevYear: "", prevPercentage: "",
  guardianName: "", guardianRelation: "", guardianPhone: "", guardianEmail: "",
};

const PROGRAMS = ["B.Tech","B.Sc","B.Com","BA","M.Tech","M.Sc","MBA","MCA","PhD"];

const STEPS = [
  { id: 1, label: "Personal",  short: "Personal Info" },
  { id: 2, label: "Academic",  short: "Academic Info" },
  { id: 3, label: "Education", short: "Prev. Education" },
  { id: 4, label: "Documents", short: "Upload Documents" },
  { id: 5, label: "Guardian",  short: "Guardian Details" },
  { id: 6, label: "Review",    short: "Review & Submit" },
];

const DOC_SLOTS = [
  { key: "photo",       label: "Passport Photo",          accept: "image/*",       required: true,  hint: "JPG/PNG, max 1 MB" },
  { key: "aadhar",      label: "Aadhar Card",              accept: "image/*,.pdf",  required: true,  hint: "PDF or image" },
  { key: "marksheet",   label: "10th Marksheet",           accept: "image/*,.pdf",  required: true,  hint: "PDF or image" },
  { key: "marksheet12", label: "12th / Last Marksheet",    accept: "image/*,.pdf",  required: false, hint: "PDF or image" },
  { key: "tc",          label: "Transfer Certificate",     accept: "image/*,.pdf",  required: false, hint: "PDF or image" },
  { key: "migration",   label: "Migration Certificate",    accept: "image/*,.pdf",  required: false, hint: "PDF or image" },
  { key: "income",      label: "Income Certificate",       accept: ".pdf,image/*",  required: false, hint: "For scholarship" },
  { key: "other",       label: "Other Document",           accept: "*",             required: false, hint: "Any supporting doc" },
];

const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
const sel = inp + " appearance-none";

function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || <span className="text-gray-300 italic">—</span>}</span>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

type DocMap = Record<string, File | null>;

export default function NewAdmissionPage() {
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState<FormData>(EMPTY);
  const [docs, setDocs]         = useState<DocMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedData, setSavedData] = useState<AdmissionData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const setDoc = (key: string, file: File | null) =>
    setDocs(d => ({ ...d, [key]: file }));

  const next = () => setStep(s => Math.min(6, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await api.admissions.create({
        firstName: form.firstName, lastName: form.lastName,
        dateOfBirth: form.dob || null,
        gender: form.gender, email: form.email, phone: form.phone,
        address: form.address, city: form.city, state: form.state,
        pincode: form.pincode, nationality: form.nationality,
        program: form.program,
        semester: Number(form.semester), batchYear: Number(form.batchYear),
        prevSchool: form.prevSchool, prevBoard: form.prevBoard,
        prevYear: form.prevYear, prevPercentage: form.prevPercentage,
        guardianName: form.guardianName, guardianRelation: form.guardianRelation,
        guardianPhone: form.guardianPhone, guardianEmail: form.guardianEmail,
      });
      setSavedData(data);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSubmitError(e?.message ?? "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success / printable view ──────────────────────────────────────────────
  if (submitted && savedData) {
    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Admission submitted successfully</p>
              <p className="text-xs text-green-600">ID: <span className="font-mono font-bold">{savedData.admissionId}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-50">
              Print / PDF
            </button>
            <Link href="/dashboard/admission" className="text-sm font-medium text-gray-500 hover:text-gray-700">Back to list</Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm print:shadow-none">
          <div className="text-center px-8 py-8 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">University ERP</h1>
            <p className="text-gray-500 text-sm">Academic Portal — Admission Form</p>
            <div className="mt-4 inline-flex items-center gap-4 text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2">
              <span>ID: <strong className="font-mono">{savedData.admissionId}</strong></span>
              <span className="w-px h-3 bg-gray-200" />
              <span>Date: <strong>{new Date(savedData.createdAt).toLocaleDateString("en-IN")}</strong></span>
              <span className="w-px h-3 bg-gray-200" />
              <span>Status: <strong className="text-amber-600">PENDING</strong></span>
            </div>
          </div>
          <div className="px-8 py-6 space-y-8">
            {[
              { title: "1. Personal Information", rows: [
                ["Full Name",`${form.firstName} ${form.lastName}`],["Date of Birth",form.dob],
                ["Gender",form.gender],["Nationality",form.nationality],
                ["Email",form.email],["Phone",form.phone],
                ["Address",`${form.address}, ${form.city}, ${form.state} ${form.pincode}`],
              ]},
              { title: "2. Academic Information", rows: [
                ["Program",form.program],
                ["Semester",`Semester ${form.semester}`],["Batch Year",form.batchYear],
              ]},
              { title: "3. Previous Education", rows: [
                ["School / College",form.prevSchool],["Board / University",form.prevBoard],
                ["Passing Year",form.prevYear],["Percentage / CGPA",form.prevPercentage],
              ]},
              { title: "4. Guardian Details", rows: [
                ["Guardian Name",form.guardianName],["Relation",form.guardianRelation],
                ["Guardian Phone",form.guardianPhone],["Guardian Email",form.guardianEmail],
              ]},
            ].map(({ title, rows }) => (
              <div key={title}>
                <h3 className="text-sm font-bold text-gray-800 mb-3 pb-1.5 border-b border-gray-200">{title}</h3>
                <div className="grid grid-cols-2 gap-x-10">
                  {rows.map(([l, v]) => (
                    <div key={l} className="flex gap-2 py-1.5">
                      <span className="text-xs text-gray-400 w-36 shrink-0">{l}</span>
                      <span className="text-sm text-gray-900 font-medium">{v || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Uploaded docs in print view */}
            {Object.values(docs).some(Boolean) && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 pb-1.5 border-b border-gray-200">5. Submitted Documents</h3>
                <div className="grid grid-cols-4 gap-3">
                  {DOC_SLOTS.filter(s => docs[s.key]).map(slot => (
                    <div key={slot.key} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {slot.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-8 text-center">
                {["Applicant's Signature","Guardian's Signature","Admission Officer"].map(s => (
                  <div key={s}><div className="h-14 border-b border-gray-400 mb-2"/><p className="text-xs text-gray-400">{s}</p></div>
                ))}
              </div>
              <p className="text-xs text-gray-300 text-center mt-6">Generated on {new Date().toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="w-full p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/admission" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Admission</h1>
          <p className="text-xs text-gray-400 mt-0.5">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        {/* Progress bar */}
        <div className="relative h-1.5 bg-gray-200 rounded-full mb-5">
          <div
            className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-start justify-between">
          {STEPS.map((s) => {
            const done    = s.id < step;
            const current = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => done && setStep(s.id)}
                disabled={s.id > step}
                className="flex flex-col items-center gap-1.5 group disabled:cursor-not-allowed"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200" : ""}
                  ${current ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : ""}
                  ${!done && !current ? "bg-gray-100 text-gray-400" : ""}
                `}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : s.id}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${current ? "text-indigo-600" : done ? "text-gray-500" : "text-gray-300"}`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Step title */}
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">{STEPS[step - 1].short}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {step === 1 && "Basic personal and contact information"}
            {step === 2 && "Program and batch details"}
            {step === 3 && "Details of your previous school or college"}
            {step === 4 && "Upload required certificates and documents"}
            {step === 5 && "Parent or guardian contact information"}
            {step === 6 && "Review everything before final submission"}
          </p>
        </div>

        <div className="px-8 py-7">
          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                <F label="First Name" req>
                  <input className={inp} placeholder="Riya" value={form.firstName} onChange={set("firstName")} />
                </F>
                <F label="Last Name" req>
                  <input className={inp} placeholder="Sharma" value={form.lastName} onChange={set("lastName")} />
                </F>
                <F label="Nationality">
                  <input className={inp} placeholder="Indian" value={form.nationality} onChange={set("nationality")} />
                </F>
                <F label="Date of Birth" req>
                  <input type="date" className={inp} value={form.dob} onChange={set("dob")} />
                </F>
                <F label="Gender" req>
                  <select className={sel} value={form.gender} onChange={set("gender")}>
                    <option value="">Select…</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </F>
                <F label="Phone" req>
                  <input className={inp} placeholder="9876543210" value={form.phone} onChange={set("phone")} />
                </F>
              </div>
              <F label="Email" req>
                <input type="email" className={inp} placeholder="riya@example.com" value={form.email} onChange={set("email")} />
              </F>
              <F label="Street Address" req>
                <textarea className={inp + " resize-none"} rows={2} placeholder="House no, street, locality…" value={form.address} onChange={set("address")} />
              </F>
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-5">
                <F label="City" req><input className={inp} placeholder="Mumbai" value={form.city} onChange={set("city")} /></F>
                <F label="State" req><input className={inp} placeholder="Maharashtra" value={form.state} onChange={set("state")} /></F>
                <F label="PIN Code"><input className={inp} placeholder="400001" value={form.pincode} onChange={set("pincode")} /></F>
              </div>
            </div>
          )}

          {/* ── Step 2: Academic ── */}
          {step === 2 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="col-span-2">
                <F label="Program" req>
                  <select className={sel} value={form.program} onChange={set("program")}>
                    <option value="">Select program…</option>
                    {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </F>
              </div>
              <F label="Starting Semester" req>
                <select className={sel} value={form.semester} onChange={set("semester")}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </F>
              <F label="Batch Year" req>
                <select className={sel} value={form.batchYear} onChange={set("batchYear")}>
                  {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </F>
            </div>
          )}

          {/* ── Step 3: Previous Education ── */}
          {step === 3 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="col-span-2">
                <F label="School / College" req>
                  <input className={inp} placeholder="Delhi Public School" value={form.prevSchool} onChange={set("prevSchool")} />
                </F>
              </div>
              <div className="col-span-2">
                <F label="Board / University" req>
                  <input className={inp} placeholder="CBSE / Delhi University" value={form.prevBoard} onChange={set("prevBoard")} />
                </F>
              </div>
              <F label="Passing Year" req>
                <input className={inp} placeholder="2024" value={form.prevYear} onChange={set("prevYear")} />
              </F>
              <F label="Percentage / CGPA" req>
                <input className={inp} placeholder="92% or 9.2 CGPA" value={form.prevPercentage} onChange={set("prevPercentage")} />
              </F>
            </div>
          )}

          {/* ── Step 4: Documents ── */}
          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {DOC_SLOTS.map((slot) => {
                const file = docs[slot.key] ?? null;
                const isImg = file && file.type.startsWith("image/");
                return (
                  <label key={slot.key} className="relative flex flex-col cursor-pointer group">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {slot.label}{slot.required && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                    <div className={`relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed transition-all
                      ${file ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}`}>
                      {file ? (
                        <>
                          {isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={URL.createObjectURL(file)} alt={slot.label} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 px-3 text-center">
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25" />
                                </svg>
                              </div>
                              <p className="text-xs text-indigo-700 font-medium truncate w-full px-1">{file.name}</p>
                              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          )}
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setDoc(slot.key, null); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-3 text-center">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-500 group-hover:text-indigo-600 transition-colors font-medium">Click to upload</p>
                          <p className="text-xs text-gray-300">{slot.hint}</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept={slot.accept}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setDoc(slot.key, e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* ── Step 5: Guardian ── */}
          {step === 5 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="col-span-2">
                <F label="Guardian Name" req>
                  <input className={inp} placeholder="Sunita Sharma" value={form.guardianName} onChange={set("guardianName")} />
                </F>
              </div>
              <F label="Relation" req>
                <select className={sel} value={form.guardianRelation} onChange={set("guardianRelation")}>
                  <option value="">Select…</option>
                  <option>Father</option><option>Mother</option><option>Spouse</option><option>Sibling</option><option>Other</option>
                </select>
              </F>
              <F label="Guardian Phone" req>
                <input className={inp} placeholder="9876543200" value={form.guardianPhone} onChange={set("guardianPhone")} />
              </F>
              <div className="col-span-2">
                <F label="Guardian Email">
                  <input type="email" className={inp} placeholder="guardian@example.com" value={form.guardianEmail} onChange={set("guardianEmail")} />
                </F>
              </div>
            </div>
          )}

          {/* ── Step 6: Review ── */}
          {step === 6 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ReviewSection title="Personal Information">
                <ReviewRow label="Full Name"     value={`${form.firstName} ${form.lastName}`} />
                <ReviewRow label="Date of Birth" value={form.dob} />
                <ReviewRow label="Gender"        value={form.gender} />
                <ReviewRow label="Nationality"   value={form.nationality} />
                <ReviewRow label="Email"         value={form.email} />
                <ReviewRow label="Phone"         value={form.phone} />
                <ReviewRow label="Address"       value={[form.address, form.city, form.state, form.pincode].filter(Boolean).join(", ")} />
              </ReviewSection>
              <ReviewSection title="Academic Information">
                <ReviewRow label="Program"    value={form.program} />
                <ReviewRow label="Semester"   value={`Semester ${form.semester}`} />
                <ReviewRow label="Batch Year" value={form.batchYear} />
              </ReviewSection>
              <ReviewSection title="Previous Education">
                <ReviewRow label="School / College"   value={form.prevSchool} />
                <ReviewRow label="Board / University" value={form.prevBoard} />
                <ReviewRow label="Passing Year"       value={form.prevYear} />
                <ReviewRow label="Percentage / CGPA"  value={form.prevPercentage} />
              </ReviewSection>
              <ReviewSection title="Guardian Details">
                <ReviewRow label="Guardian Name"  value={form.guardianName} />
                <ReviewRow label="Relation"       value={form.guardianRelation} />
                <ReviewRow label="Guardian Phone" value={form.guardianPhone} />
                <ReviewRow label="Guardian Email" value={form.guardianEmail} />
              </ReviewSection>
              <div className="col-span-full">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Uploaded Documents</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DOC_SLOTS.map(slot => {
                    const file = docs[slot.key];
                    return (
                      <div key={slot.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs
                        ${file ? "border-green-200 bg-green-50 text-green-700" : slot.required ? "border-red-100 bg-red-50 text-red-400" : "border-gray-100 bg-gray-50 text-gray-400"}`}>
                        {file ? (
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        )}
                        <span className="truncate">{file ? file.name : `${slot.label}${slot.required ? " (required)" : " (optional)"}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {submitError && (
                <div className="col-span-full bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{submitError}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 1}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>

          <span className="text-xs text-gray-300">{step} / {STEPS.length}</span>

          {step < 6 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit & Generate Form
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
