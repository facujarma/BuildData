function S({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div><S className="h-7 w-48 rounded-md" /><S className="h-4 w-56 rounded-md mt-2" /></div>
        <S className="h-9 w-32 rounded-lg" />
      </div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {Array.from({ length: 2 }).map((_, i) => <S key={i} className="h-8 w-28 rounded-full" />)}
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4"><S className="w-9 h-9 rounded-lg mb-3" /><S className="h-8 w-16 rounded mb-1" /><S className="h-3 w-20 rounded" /></div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-5"><S className="h-5 w-48 rounded mb-3" /><S className="h-4 w-full rounded mb-2" /><S className="h-4 w-full rounded mb-2" /><S className="h-4 w-2/3 rounded" /></div>
    </>
  );
}