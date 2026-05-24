
export default function CinematicMeetingCard({
  exchange,
  otherUserName = "Alexis",
  otherPhone = "06 XX XX XX XX",
}) {
  const place = exchange?.place?.selected || exchange?.place || {};
  const availability = exchange?.availability?.selected || exchange?.availability || {};

  return (
    <section className="overflow-hidden rounded-[38px] border border-emerald-200/50 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_30%),linear-gradient(180deg,#134e4a_0%,#0f3f3a_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
      <div className="p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">
          Rencontre confirmée
        </p>

        <h2 className="mt-3 text-[40px] font-black leading-[0.92] tracking-[-0.06em]">
          Votre rencontre est confirmée ✨
        </h2>

        <p className="mt-4 max-w-[92%] text-[15px] font-medium leading-relaxed text-emerald-50/85">
          Tout est prêt pour votre échange. Il ne vous reste plus qu’à vous retrouver autour d’un café partenaire Troco.
        </p>

        <div className="mt-6 flex items-center justify-center gap-5">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white/70 bg-gradient-to-br from-cyan-400 to-emerald-400" />
            <span className="mt-2 text-sm font-black">Toi</span>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl backdrop-blur">
            ↔
          </div>

          <div className="flex flex-col items-center">
            <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white/70 bg-gradient-to-br from-amber-200 to-orange-300" />
            <span className="mt-2 text-sm font-black">{otherUserName}</span>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-[30px] bg-white text-[#081225] shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
          <div className="aspect-[1.7/1] overflow-hidden bg-emerald-50">
            <img
              src={place.imageUrl || "/src/assets/troco-cafes/cafe-atelier.jpg"}
              alt={place.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                  Café partenaire Troco
                </p>

                <h3 className="mt-1 text-[28px] font-black tracking-[-0.05em]">
                  {place.title || "Café L’Atelier"}
                </h3>
              </div>

              <div className="rounded-full bg-[#E8F7EF] px-3 py-1 text-[11px] font-black text-[#0f9f9a]">
                ☕ Partenaire
              </div>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              {place.address || "23 rue de la Paix, Paris 2e"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Date
                </p>
                <p className="mt-2 text-[22px] font-black">
                  {availability.label || "Demain"}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Heure
                </p>
                <p className="mt-2 text-[22px] font-black">
                  {availability.time || "14h"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] bg-[#F8FBFA] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F7EF] text-[#0f9f9a]">
                  👤
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Rencontre avec
                  </p>

                  <p className="text-lg font-black text-[#081225]">
                    {otherUserName}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F7EF] text-[#0f9f9a]">
                  📞
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Téléphone
                  </p>

                  <p className="text-lg font-black text-[#081225]">
                    {otherPhone}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                Conseils pour votre échange
              </p>

              <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                <p>✓ Vérifiez vos objets avant le rendez-vous</p>
                <p>✓ Soyez à l’heure</p>
                <p>✓ Profitez du moment ☕</p>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full rounded-[24px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 px-5 py-4 text-base font-black text-white shadow-[0_14px_28px_rgba(46,204,138,0.20)]"
            >
              Voir les détails
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
