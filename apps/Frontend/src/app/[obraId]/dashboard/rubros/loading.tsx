function S({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <div className="mb-5"><S className="h-7 w-52 rounded-md" /><S className="h-4 w-96 rounded-md mt-2" /></div>
      <div className="space-y-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4"><div className="shimmer h-4 w-40 rounded mb-2" /><div className="shimmer h-3 w-full rounded" /><div className="shimmer h-5 w-full rounded mt-3" /></div>
        ))}
      </div>
    </>
  );
}