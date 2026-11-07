const paths = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  students: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M18 8a3 3 0 0 1 0 6M22 21v-2a4 4 0 0 0-3-3.87",
  structure: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  payment: "M3 5h18v14H3zM3 9h18M7 14h4",
  clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  award: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM9 12l-2 9 5-3 5 3-2-9",
  refund: "M3 10h11a6 6 0 0 1 0 12M3 10l5-5M3 10l5 5",
  income: "M3 17l6-6 4 4 8-10M15 5h6v6",
  ledger: "M4 3h7a2 2 0 0 1 2 2v16a3 3 0 0 0-3-2H4V3ZM13 5a2 2 0 0 1 2-2h5v16h-4a3 3 0 0 0-3 2",
  budget: "M12 3v9h9M9 4a9 9 0 1 0 11 11M16 3a9 9 0 0 1 5 5h-5V3Z",
  payroll: "M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 12v3h4v-3",
  reports: "M4 3v18h17M8 16v-4M13 16V8M18 16V5",
  approval: "m8 12 3 3 5-6M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  history: "M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2",
  refresh: "M20 7a8 8 0 0 0-14-2L3 8M3 3v5h5M4 17a8 8 0 0 0 14 2l3-3M21 21v-5h-5",
  arrow: "M5 12h14M14 7l5 5-5 5",
  receipt: "M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM9 7h6M9 11h6M9 15h3",
  alert: "m12 3 10 18H2L12 3ZM12 9v5M12 17h.01",
  check: "m8 12 3 3 5-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

export type FinanceIconName = keyof typeof paths;
export default function FinanceIcon({ name, className = "h-5 w-5" }: { name: FinanceIconName; className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true" focusable="false"><path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} /></svg>;
}
