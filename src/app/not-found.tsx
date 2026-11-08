import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start px-4 py-24 sm:px-6">
      <p className="text-7xl font-black text-brand-600 dark:text-brand-400">4Ø4</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">This page paid out — nothing here</h1>
      <p className="mt-2 text-muted">
        The unit you asked for isn&apos;t on the shelf. Try the fund directory, or replay an amount on the
        homepage calculator.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/funds" className="btn-cta">Browse all funds</Link>
        <Link href="/" className="btn-quiet">Back home</Link>
      </div>
    </div>
  );
}
