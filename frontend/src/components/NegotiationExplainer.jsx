import { MessageCircle, Repeat2, CalendarCheck } from "lucide-react";

const STEPS = [
  {
    icon: Repeat2,
    title: "Propose un objet",
  },
  {
    icon: MessageCircle,
    title: "Discute / ajuste",
  },
  {
    icon: CalendarCheck,
    title: "Organise la rencontre",
  },
];

export default function NegotiationExplainer() {
  return (
    <section className="mt-6 rounded-[28px] border border-white/85 bg-[#F8FBFA] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
        Comment fonctionne le troc ?
      </p>

      <p className="mt-3 text-[14px] font-medium leading-relaxed text-[#64748B]">
        Tu peux proposer un ou plusieurs objets. Si l’échange ne semble pas équilibré,
        l’autre personne peut demander un ajustement ou proposer autre chose.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="rounded-[20px] bg-white/85 p-3 text-center shadow-[0_6px_16px_rgba(15,23,42,0.025)]"
            >
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F7EF] text-[#22a06b]">
                <Icon size={18} strokeWidth={2.35} />
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                Étape {index + 1}
              </p>

              <p className="mt-1 text-[12px] font-black leading-tight text-[#081225]">
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
