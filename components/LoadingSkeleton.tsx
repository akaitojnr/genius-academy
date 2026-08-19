export default function LoadingSkeleton() {
  return (
    <main className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      <div className="h-6 w-40 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
      <div className="mt-8 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </main>
  );
}
