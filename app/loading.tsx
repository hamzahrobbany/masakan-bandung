export default function Loading() {
  return (
    <div className="space-y-10 animate-pulse">
      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-amber-50 to-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-emerald-200" aria-hidden />
            <div className="h-10 w-3/4 rounded-2xl bg-emerald-100" aria-hidden />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-emerald-50" aria-hidden />
              <div className="h-4 w-5/6 rounded-full bg-emerald-50" aria-hidden />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-32 rounded-full bg-emerald-200" aria-hidden />
              <div className="h-11 w-32 rounded-full bg-amber-200" aria-hidden />
            </div>
          </div>
          <div className="relative h-52 md:h-full">
            <div className="absolute inset-0 rounded-2xl bg-emerald-100/70" aria-hidden />
            <div className="absolute inset-4 rounded-2xl border-4 border-white bg-amber-100/80 shadow-inner" aria-hidden />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-full bg-emerald-200" aria-hidden />
          <div className="h-8 w-48 rounded-2xl bg-emerald-100" aria-hidden />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-emerald-100/60 bg-white p-4 shadow-sm"
            >
              <div className="h-44 rounded-xl bg-gradient-to-br from-emerald-50 via-amber-50 to-white" aria-hidden />
              <div className="mt-4 h-5 w-2/3 rounded-full bg-emerald-100" aria-hidden />
              <div className="mt-2 h-4 w-1/2 rounded-full bg-emerald-50" aria-hidden />
              <div className="mt-4 flex items-center justify-between">
                <div className="h-6 w-16 rounded-full bg-emerald-200" aria-hidden />
                <div className="h-10 w-20 rounded-full bg-emerald-500/80" aria-hidden />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
