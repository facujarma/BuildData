function S({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <div className="mb-5"><S className="h-7 w-48 rounded-md" /><S className="h-4 w-72 rounded-md mt-2" /></div>
      <div className="bg-white border border-slate-200 rounded-lg mb-4 overflow-hidden">
        <div className="shimmer h-[120px] w-full" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-lg p-4"><div className="shimmer h-8 w-8 rounded-lg mb-3" /><div className="shimmer h-6 w-14 rounded mb-1" /><div className="shimmer h-3 w-24 rounded" /></div>)}
      </div>
    </>
  );
}