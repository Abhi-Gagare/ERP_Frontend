import Link from "next/link";

export default function FeaturePlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5v18h14V7l-4-4H9zM14 3v5h5M9 12h6M9 16h4" /></svg>
        </div>
        <h2 className="mt-5 text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">The {title.toLowerCase()} page has not been implemented yet.</p>
        <Link href="/accountant" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Back to dashboard</Link>
      </section>
    </div>
  );
}
