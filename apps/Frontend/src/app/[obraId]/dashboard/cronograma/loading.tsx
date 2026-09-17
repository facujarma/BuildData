function S({ className = '' }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div><S className="h-7 w-48 rounded-md" /><S className="h-4 w-72 rounded-md mt-2" /></div>
        <div className="flex gap-2"><S className="h-9 w-28 rounded-lg" /><S className="h-9 w-36 rounded-lg" /></div>
      </div>
      <div className="flex gap-2 mb-4"><S className="h-9 w-24 rounded-md" /><S className="h-9 w-52 rounded-md" /></div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
        <div className="flex items-center gap-2 p-2 border-b border-slate-200 bg-slate-50">
          <S className="h-7 w-7 rounded-md" /><S className="h-7 w-16 rounded-md" /><S className="h-7 w-7 rounded-md" />
          <S className="h-4 flex-1 max-w-[220px] rounded" />
          <S className="h-7 w-52 rounded-md ml-auto" />
        </div>
        <div className="flex border-b border-slate-200 bg-slate-50">
          <S className="h-10 w-[260px] rounded-none border-r border-slate-200" />
          {Array.from({ length: 10 }).map((_, i) => (
            <S key={i} className="h-10 w-[72px] rounded-none border-r border-slate-200" />
          ))}
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-[240px] space-y-2">
                <S className="h-4 w-40 rounded" />
                <S className="h-3 w-24 rounded" />
              </div>
              <S className="flex-1 h-6 rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
