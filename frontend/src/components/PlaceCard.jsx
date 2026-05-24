export default function PlaceCard({ place, selected, onSelect, compact = false }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect(place)}
        className={[
          "flex w-full items-center justify-between rounded-[24px] border bg-white/82 p-4 text-left shadow-[0_8px_28px_rgba(15,23,42,0.045)] backdrop-blur-xl transition active:scale-[0.985]",
          selected ? "border-emerald-300 ring-2 ring-emerald-300/20" : "border-white/80",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[17px] bg-emerald-50 text-xl">
            {place.type === "Point milieu" ? "📍" : "🗺️"}
          </div>

          <div>
            <p className="text-[15px] font-black text-slate-950">
              {place.name}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-slate-500">
              {place.distance}
            </p>
          </div>
        </div>

        <span className="text-xl text-slate-400">›</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className={[
        "w-full overflow-hidden rounded-[28px] border bg-white/86 text-left shadow-[0_12px_36px_rgba(15,23,42,0.075)] backdrop-blur-xl transition active:scale-[0.985]",
        selected ? "border-emerald-300 ring-2 ring-emerald-300/25" : "border-white/80",
      ].join(" ")}
    >
      <div className="relative h-[190px] overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

        {selected && (
          <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 shadow-lg">
            ✓
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
            {place.type}
          </p>

          <h3 className="mt-1 text-[22px] font-black tracking-[-0.04em]">
            {place.name}
          </h3>

          <p className="mt-1 text-[13px] font-semibold text-white/90">
            {place.address}
          </p>

          <p className="mt-1 text-[13px] font-semibold text-white/90">
            à {place.distance}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="text-[12px] font-black text-slate-400">
          {selected ? "Sélectionné" : "Choisir"}
        </span>
      </div>
    </button>
  );
}
