// SkeletonCard — placeholder animé pendant le chargement du feed

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
      {/* Image */}
      <div className="aspect-square w-full animate-pulse bg-[#F0F0EE]" />
      {/* Infos */}
      <div className="p-3 space-y-2">
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-[#F0F0EE]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#F0F0EE]" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#F0F0EE]" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = "grid-cols-2" }) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-[14px] bg-[#F0F0EE]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-[#F0F0EE]" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#F0F0EE]" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#F0F0EE]" />
          </div>
        </div>
      ))}
    </div>
  );
}
