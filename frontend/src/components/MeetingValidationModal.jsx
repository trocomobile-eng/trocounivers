import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function MeetingValidationModal({
  open,
  saving = false,
  onClose,
  onConfirm,
  onProblem,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/28 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <section className="w-full max-w-[430px] rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={30} strokeWidth={2.35} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={19} strokeWidth={2.3} />
          </button>
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.20em] text-emerald-700">
          Confirmation
        </p>

        <h2 className="mt-2 text-[30px] font-black leading-[1.02] tracking-[-0.055em] text-slate-950">
          Le troc a-t-il bien eu lieu ?
        </h2>

        <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-500">
          Confirmez seulement après avoir rencontré l’autre personne.
        </p>

        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[20px] bg-emerald-600 text-[16px] font-black text-white shadow-[0_12px_28px_rgba(16,185,129,0.20)] disabled:opacity-50"
        >
          <CheckCircle2 size={20} strokeWidth={2.4} />
          {saving ? "Confirmation..." : "Oui, troc effectué"}
        </button>

        <button
          type="button"
          onClick={onProblem}
          disabled={saving}
          className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] border border-slate-100 bg-white text-[15px] font-black text-slate-600 disabled:opacity-50"
        >
          <AlertCircle size={19} strokeWidth={2.3} />
          Il y a eu un problème
        </button>
      </section>
    </div>
  );
}
