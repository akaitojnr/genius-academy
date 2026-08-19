export default function ProgressBar({ label, percent }: { label: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
