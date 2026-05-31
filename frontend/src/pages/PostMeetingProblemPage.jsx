import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  MessageCircle,
  RefreshCcw,
  XCircle,
} from "lucide-react";

import { db } from "../firebase";

const PROBLEMS = [
  "La personne n’est pas venue",
  "Nous avons annulé",
  "L’objet ne correspondait pas",
  "Nous avons reporté",
  "Autre problème",
];

export default function PostMeetingProblemPage() {
  const { exchangeId, id } = useParams();
  const currentExchangeId = exchangeId || id;
  const navigate = useNavigate();

  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProblem(nextAction) {
    if (!currentExchangeId) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", currentExchangeId), {
        status:
          nextAction === "cancel"
            ? "cancelled"
            : nextAction === "reschedule"
              ? "scheduling_time"
              : "chat_open",
        meetingProblem: selected || "Autre problème",
        meetingProblemAction: nextAction,
        updatedAt: serverTimestamp(),
      });

      if (nextAction === "reschedule") {
        navigate(`/availability/${currentExchangeId}`, { replace: true });
      } else if (nextAction === "chat") {
        navigate(`/exchanges/${currentExchangeId}/chat`, { replace: true });
      } else {
        navigate("/exchanges", { replace: true });
      }
    } catch (error) {
      console.error("Erreur problème rencontre :", error);
      alert("Impossible d’enregistrer le problème.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="troco-page-narrow">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/88 shadow-[0_8px_22px_rgba(15,23,42,0.045)]"
          aria-label="Retour"
        >
          <ArrowLeft size={21} strokeWidth={2.4} />
        </button>

        <section className="rounded-[32px] border border-white/80 bg-white/92 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.055)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.20em] text-rose-600">
            Rencontre
          </p>

          <h1 className="mt-2 text-[34px] font-black leading-[1] tracking-[-0.055em] text-slate-950">
            Que s’est-il passé ?
          </h1>

          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-500">
            Pas de stress. Troco t’aide à choisir la suite la plus simple.
          </p>

          <div className="mt-6 space-y-2">
            {PROBLEMS.map((problem) => (
              <button
                key={problem}
                type="button"
                onClick={() => setSelected(problem)}
                className={[
                  "flex min-h-[52px] w-full items-center justify-between rounded-[18px] border px-4 text-left text-[15px] font-black transition",
                  selected === problem
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-100 bg-white text-slate-700",
                ].join(" ")}
              >
                {problem}
                {selected === problem && "✓"}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3">
          <button
            type="button"
            disabled={saving || !selected}
            onClick={() => saveProblem("reschedule")}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[20px] bg-emerald-600 text-[15px] font-black text-white disabled:opacity-40"
          >
            <RefreshCcw size={19} />
            Reprogrammer
          </button>

          <button
            type="button"
            disabled={saving || !selected}
            onClick={() => saveProblem("chat")}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[20px] border border-slate-100 bg-white text-[15px] font-black text-slate-700 disabled:opacity-40"
          >
            <MessageCircle size={19} />
            Ouvrir la discussion
          </button>

          <button
            type="button"
            disabled={saving || !selected}
            onClick={() => saveProblem("cancel")}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[20px] border border-rose-100 bg-rose-50 text-[15px] font-black text-rose-700 disabled:opacity-40"
          >
            <XCircle size={19} />
            Annuler le troc
          </button>
        </section>
    </main>
  );
}
