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
        {Array.from({ length: 3 }).map((_, i) => <S key={i} className="h-8 w-28 rounded-full" />)}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4"><S className="h-5 w-48 rounded mb-2" /><S className="h-3 w-36 rounded" /></div>
        ))}
      </div>
    </>
  );
}