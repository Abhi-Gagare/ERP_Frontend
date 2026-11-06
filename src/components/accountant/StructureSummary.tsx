import type { StructureDetail } from "@/lib/accountant/structures";

export default function StructureSummary({ detail }: { detail: StructureDetail }) {
  const { structure } = detail;
  const installments = new Map<string, number>();
  for (const line of detail.lines) installments.set(line.installment, (installments.get(line.installment) || 0) + Math.round(line.amount * 100));
  return <div className="mt-5 space-y-4">
    <dl className="grid gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">{[
      ["Structure reference", `FSTR-${structure.id}`], ["Program / department", structure.program],
      ["Eligible batch", structure.batchYear ? String(structure.batchYear) : "All batches"],
      ["Schedule dates", structure.effectiveFrom && structure.effectiveUntil ? `${structure.effectiveFrom} to ${structure.effectiveUntil}` : "Not specified"],
    ].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-1 break-words font-medium text-gray-900">{value}</dd></div>)}</dl>
    {structure.notes && <p className="whitespace-pre-wrap break-words rounded-xl border border-gray-100 p-4 text-sm text-gray-600">{structure.notes}</p>}
    <div className="flex flex-wrap gap-3">{Array.from(installments).map(([name, cents]) => <span key={name} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">{name}: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(cents / 100)}</span>)}</div>
  </div>;
}
