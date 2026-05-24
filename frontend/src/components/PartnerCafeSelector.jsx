import { CheckCircle2, Coffee, MapPin } from "lucide-react";

export default function PartnerCafeSelector({
  cafes = [],
  selectedCafe,
  onSelect,
  onSubmit,
  saving = false,
  submitLabel = "Proposer ce café",
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-[30px] border border-white/80 bg-white/74 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)] backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
          Cafés partenaires
        </p>

        <h2 className="mt-2 text-[28px] font-black leading-[0.98] tracking-[-0.045em] text-[#081225]">
          Choisissez un café pour la rencontre
        </h2>

        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
          Pour le prototype, Troco simule des cafés partenaires : des lieux publics,
          chaleureux et faciles à retrouver.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cafes.map((cafe) => {
          const active = selectedCafe?.id === cafe.id;

          return (
            <button
              key={cafe.id}
              type="button"
              onClick={() => onSelect?.(cafe)}
              className={[
                "overflow-hidden rounded-[30px] border bg-white text-left shadow-[0_12px_32px_rgba(15,23,42,0.045)] transition duration-200 active:scale-[0.985] lg:hover:-translate-y-1",
                active
                  ? "border-[#2ECC8A] ring-2 ring-[#2ECC8A]/20"
                  : "border-white/80",
              ].join(" ")}
            >
              <div className="relative aspect-[1.55/1] overflow-hidden bg-emerald-50">
                <img
                  src={cafe.imageUrl}
                  alt={cafe.name || cafe.title}
                  className="h-full w-full object-cover"
                />

                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-[#0f9f9a] backdrop-blur">
                  {cafe.distance}
                </div>

                {active && (
                  <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#2ECC8A] text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)]">
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[18px] font-black tracking-[-0.035em] text-[#081225]">
                      {cafe.title}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {cafe.vibe}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#E8F7EF] text-[#0f9f9a]">
                    <Coffee size={19} strokeWidth={2.35} />
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 text-sm font-semibold leading-snug text-slate-500">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#0f9f9a]" />
                  <span>{cafe.address}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {cafe.perks?.map((perk) => (
                    <span
                      key={perk}
                      className="rounded-full bg-[#E8F7EF] px-3 py-1 text-[11px] font-black text-[#0f9f9a]"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedCafe && onSubmit && (
        <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Café sélectionné
          </p>

          <p className="mt-1 text-sm font-black text-slate-800">
            {selectedCafe.title} · {selectedCafe.address}
          </p>

          <button
            type="button"
            onClick={() => onSubmit(selectedCafe)}
            disabled={saving}
            className="mt-4 w-full rounded-[24px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 px-5 py-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(46,204,138,0.16)] disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      )}
    </section>
  );
}
