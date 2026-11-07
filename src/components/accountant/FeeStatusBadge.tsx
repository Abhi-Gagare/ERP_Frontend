import type { FeeStatus } from "@/lib/accountant/types";

const styles: Record<FeeStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  PENDING: "bg-amber-50 text-amber-800 ring-amber-600/10",
  PARTIAL: "bg-blue-50 text-blue-700 ring-blue-600/10",
  OVERDUE: "bg-red-50 text-red-700 ring-red-600/10",
  WAIVED: "bg-slate-100 text-slate-600 ring-slate-500/10",
};
const labels: Record<FeeStatus, string> = { PAID: "Settled", PENDING: "Pending", PARTIAL: "Partial", OVERDUE: "Overdue", WAIVED: "Waived" };
export default function FeeStatusBadge({ status }: { status: FeeStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>{labels[status]}</span>;
}
