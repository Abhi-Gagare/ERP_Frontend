import type { FinanceDashboard } from "@/lib/accountant/types";
import FinanceIcon from "./FinanceIcon";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
export default function DashboardAttention({ data }: { data: FinanceDashboard }) {
  return <div className="grid gap-6 lg:grid-cols-2">
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="aging-title">
      <h2 id="aging-title" className="flex items-center gap-2 text-sm font-semibold text-gray-900"><FinanceIcon name="alert" className="h-5 w-5 text-red-500" />Overdue aging</h2>
      <p className="mt-2 text-xs text-gray-500">Outstanding balances grouped by days past due. Waived balances are excluded.</p>
      <dl className="mt-5 space-y-4">{data.overdueAging.map(bucket => <div key={bucket.label}>
        <div className="flex flex-wrap justify-between gap-2 text-sm"><dt className="text-gray-600">{bucket.label}</dt><dd className="font-semibold tabular-nums text-gray-900">{currency.format(bucket.amount)}</dd></div>
        <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-red-400" style={{ width: `${data.overdueAmount > 0 ? Math.min(100, bucket.amount / data.overdueAmount * 100) : 0}%` }} /></div>
      </div>)}</dl>
      {data.overdueAmount === 0 && <p className="mt-4 text-sm text-emerald-700">No overdue fee balances.</p>}
    </section>
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="upcoming-summary-title">
      <h2 id="upcoming-summary-title" className="flex items-center gap-2 text-sm font-semibold text-gray-900"><FinanceIcon name="clock" className="h-5 w-5 text-amber-600" />Upcoming fee demand</h2>
      <p className="mt-2 text-xs text-gray-500">Due today through seven days ahead, including partially paid charges.</p>
      <p className="mt-6 break-words text-3xl font-bold tabular-nums text-gray-900">{currency.format(data.dueSoon)}</p>
      <p className="mt-2 text-sm text-gray-500">{new Intl.NumberFormat("en-IN").format(data.dueSoonCount)} unpaid fee records</p>
      <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">The upcoming list below shows the first eight charges by due date. This total covers every charge in the window.</div>
    </section>
  </div>;
}
