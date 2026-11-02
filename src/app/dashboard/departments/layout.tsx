export default function DepartmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 top-16 left-64 overflow-y-auto bg-slate-50">
      {children}
    </div>
  );
}
