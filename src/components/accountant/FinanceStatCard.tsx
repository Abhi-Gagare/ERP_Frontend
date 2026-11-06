import FinanceIcon, { type FinanceIconName } from "./FinanceIcon";

const tones = {
  indigo: "bg-indigo-50 text-indigo-600", green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-600",
};
export default function FinanceStatCard({ label, value, detail, icon, tone }: {
  label: string; value: string; detail: string; icon: FinanceIconName; tone: keyof typeof tones;
}) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-gray-500">{label}</p><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><FinanceIcon name={icon} /></span></div>
    <p className="mt-4 break-words text-2xl font-bold tracking-tight text-gray-900">{value}</p><p className="mt-2 text-xs text-gray-500">{detail}</p>
  </div>;
}
