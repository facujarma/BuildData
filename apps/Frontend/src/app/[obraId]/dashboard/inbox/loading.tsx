function S({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-5"><S className="h-7 w-52 rounded-md" /><S className="h-4 w-96 rounded-md mt-2" /></div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {Array.from({ length: 3 }).map((_, i) => <S key={i} className="h-8 w-32 rounded-full" />)}
      </div>
      <div className="flex gap-3 flex-1">
        <div className="w-[340px] flex-none space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-lg p-3"><div className="shimmer h-4 w-24 rounded mb-2" /><div className="shimmer h-3 w-full rounded" /></div>)}
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4"><div className="shimmer h-5 w-40 rounded mb-3" /><div className="shimmer h-4 w-full rounded" /></div>
      </div>
    </div>
  );
}