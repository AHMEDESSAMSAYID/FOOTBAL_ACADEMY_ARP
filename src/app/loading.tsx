export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
          {/* Spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-zinc-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-zinc-900 animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-zinc-500">جاري التحميل...</p>
      </div>
    </div>
  );
}
