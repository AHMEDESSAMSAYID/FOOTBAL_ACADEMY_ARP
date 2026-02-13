export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-zinc-200 animate-pulse" />
        ))}
      </div>
      
      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 w-40 rounded bg-zinc-200 animate-pulse" />
          <div className="h-64 rounded-lg bg-zinc-200 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-32 rounded bg-zinc-200 animate-pulse" />
          <div className="h-48 rounded-lg bg-zinc-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
