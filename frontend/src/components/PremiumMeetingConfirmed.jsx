import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

function getDayLabel(availability) {
  return availability?.day || availability?.label || "Mercredi 17 juillet";
}

function getTimeLabel(availability) {
  return availability?.time || "14h00";
}

function InfoRow({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#E8F7EF] text-[#0f9f9a]">
        <Icon size={19} strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-black leading-tight text-[#081225]">
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#64748B]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PremiumMeetingConfirmed({
  availability,
  place,
  otherName = "Alexis",
  otherPhone = "",
  saving = false,
  onComplete,
  onModify,
}) {
  return (
    <section className="space-y-7 rounded-[34px] border border-white/70 bg-white/42 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.04)] backdrop-blur-[14px]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/72 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a] shadow-[0_8px_24px_rgba(15,23,42,0.035)] backdrop-blur-xl">
          <CheckCircle2 size={14} strokeWidth={2.4} />
          Rencontre confirmée
        </div>

        <h1 className="mt-5 text-[38px] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#081225]">
          Bravo,
          <br />
          votre rencontre
          <br />
          est confirmée ✨
        </h1>

        <p className="mt-5 max-w-[320px] text-[17px] font-medium leading-relaxed text-[#64748B]">
          Votre troc est prêt. Il ne reste plus qu’à vous rencontrer.
        </p>
      </div>

      <div className="rounded-[30px] border border-white/70 bg-white/72 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.04)] backdrop-blur-[12px]">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <div className="absolute left-1 top-3 h-10 w-10 rounded-full bg-[#A7F3D0]" />
            <div className="absolute right-1 top-3 h-10 w-10 rounded-full bg-[#FDE68A]" />
            <Coffee className="relative z-10 text-[#0f9f9a]" size={30} strokeWidth={1.9} />
          </div>

          <div>
            <p className="text-[18px] font-black tracking-[-0.035em] text-[#081225]">
              Les meilleurs échanges commencent souvent autour d’un café.
            </p>

            <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#64748B]">
              Troco transforme le rendez-vous en moment simple, public et chaleureux.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/72 bg-white/72 shadow-[0_10px_40px_rgba(15,23,42,0.04)] backdrop-blur-[14px]">
        <div className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Coffee size={18} className="text-[#0f9f9a]" strokeWidth={2.25} />
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
              Café partenaire Troco
            </p>
          </div>

          <InfoRow
            icon={CalendarDays}
            title={getDayLabel(availability)}
            subtitle="Date de la rencontre"
          />

          <div className="h-px bg-slate-200/70" />

          <InfoRow
            icon={Clock3}
            title={getTimeLabel(availability)}
            subtitle="Horaire confirmé"
          />

          <div className="h-px bg-slate-200/70" />

          <InfoRow
            icon={MapPin}
            title={place?.title || place?.name || "Maison Lune"}
            subtitle={place?.address || "5 rue des Martyrs · Paris 18e"}
          />

          <div className="h-px bg-slate-200/70" />

          <InfoRow
            icon={UserRound}
            title={`Avec ${otherName}`}
            subtitle="Votre partenaire d’échange"
          />

          <div className="h-px bg-slate-200/70" />

          <InfoRow
            icon={Phone}
            title={otherPhone || "Téléphone à renseigner"}
            subtitle={otherPhone ? "Visible seulement après confirmation" : "À compléter pour faciliter la rencontre"}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={saving}
        className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#34d399_0%,#22c55e_35%,#22d3ee_100%)] text-[16px] font-black text-white shadow-[0_12px_28px_rgba(34,197,94,0.16)] transition active:scale-[0.98] disabled:opacity-50"
      >
        <Check size={20} strokeWidth={2.5} />
        J’ai terminé l’échange
      </button>

      <button
        type="button"
        onClick={onModify}
        disabled={saving}
        className="flex h-[54px] w-full items-center justify-center rounded-[18px] border border-white/80 bg-white/54 text-[15px] font-black text-[#081225] shadow-[0_8px_22px_rgba(15,23,42,0.035)] backdrop-blur-xl transition active:scale-[0.98] disabled:opacity-50"
      >
        Modifier le rendez-vous
      </button>
    </section>
  );
}
