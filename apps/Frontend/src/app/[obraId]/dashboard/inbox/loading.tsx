function S({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-5">
        <S className="h-7 w-52 rounded-md" />
        <S className="h-4 w-96 rounded-md mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
            <S className="h-9 w-9 rounded-lg mb-3" />
            <S className="h-6 w-14 rounded mb-2" />
            <S className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <S key={i} className="h-8 w-28 rounded-md" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
            <S className="h-4 w-1/3 rounded mb-3" />
            <S className="h-3 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
