export default function FeesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 top-16 left-64 overflow-y-auto bg-slate-50 p-8">
      {children}
    </div>
  );
}
