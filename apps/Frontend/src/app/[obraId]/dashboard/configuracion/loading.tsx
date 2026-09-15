function S({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <div className="mb-5"><S className="h-7 w-48 rounded-md" /><S className="h-4 w-80 rounded-md mt-2" /></div>
      <div className="grid grid-cols-[220px_1fr] gap-6 items-start">
        <div className="bg-white border border-slate-200 rounded-lg p-2 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="shimmer h-9 w-full rounded-md" />)}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <S className="h-5 w-40 rounded" /><S className="h-10 w-full rounded" /><S className="h-10 w-full rounded" /><S className="h-10 w-2/3 rounded" />
        </div>
      </div>
    </>
  );
}