import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Coffee, MessageCircle, RotateCcw, Sparkles } from "lucide-react";

import BottomNav from "../components/BottomNav";

const FEEDBACK = [
  { id: "great",  emoji: "😊", label: "Très sympa"           },
  { id: "smooth", emoji: "🤝", label: "Fluide"               },
  { id: "coffee", emoji: "☕", label: "Discussion agréable"  },
  { id: "quick",  emoji: "⚡", label: "Rapide et simple"     },
  { id: "human",  emoji: "🌱", label: "Bel échange"          },
];

const PROBLEMS = [
  "Nous avons annulé",
  "Personne absente",
  "Problème de lieu",
  "Reprogrammer",
];

export default function PostMeetingPage() {
  const navigate = useNavigate();
  const [step, setStep]                     = useState("question");
  const [selectedFeedback, setSelectedFeedback] = useState("");
  const [selectedProblem, setSelectedProblem]   = useState("");

  return (
    <div className="min-h-screen pb-32" style={{ background: "#0d0d0d" }}>
      <div className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full shrink-0"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <p className="text-white font-black" style={{ fontSize: 17, letterSpacing: "-0.025em" }}>
            Après la rencontre
          </p>
        </header>

        {/* ── Étape : question principale ───────────────────────────────────── */}
        {step === "question" && (
          <div className="rounded-[20px] p-5" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              className="h-12 w-12 rounded-[14px] flex items-center justify-center text-2xl mb-5"
              style={{ background: "rgba(93,202,165,0.12)" }}
            >
              🤝
            </div>

            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5dcaa5" }}>
              Rencontre réelle
            </p>
            <h1 className="text-white font-black mb-2" style={{ fontSize: 22, letterSpacing: "-0.04em" }}>
              Avez-vous rencontré l'autre personne ?
            </h1>
            <p className="text-[13px] font-medium leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              Troco valorise les échanges qui deviennent de vraies rencontres locales.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep("feedback")}
                className="h-12 rounded-full text-[15px] font-black text-white transition active:scale-[0.97]"
                style={{ background: "#1a4d2e" }}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setStep("problem")}
                className="h-12 rounded-full text-[15px] font-black transition active:scale-[0.97]"
                style={{ background: "#1a1a1a", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Non
              </button>
            </div>
          </div>
        )}

        {/* ── Étape : feedback ──────────────────────────────────────────────── */}
        {step === "feedback" && (
          <div className="rounded-[20px] p-5" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5dcaa5" }}>
              Merci
            </p>
            <h1 className="text-white font-black mb-2" style={{ fontSize: 22, letterSpacing: "-0.04em" }}>
              Comment s'est passée la rencontre ?
            </h1>
            <p className="text-[13px] font-medium leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Pas de note froide. Juste un retour humain.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {FEEDBACK.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedFeedback(item.id)}
                  className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-left transition active:scale-[0.97]"
                  style={{
                    background: selectedFeedback === item.id ? "#1a2e20" : "#1a1a1a",
                    border: selectedFeedback === item.id
                      ? "1.5px solid rgba(93,202,165,0.5)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: selectedFeedback === item.id ? "#5dcaa5" : "rgba(255,255,255,0.65)" }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!selectedFeedback}
              onClick={() => setStep("done")}
              className="w-full h-12 rounded-full text-[14px] font-black text-white transition active:scale-[0.98] disabled:opacity-40"
              style={{ background: "#1a4d2e" }}
            >
              Envoyer
            </button>
          </div>
        )}

        {/* ── Étape : problème ──────────────────────────────────────────────── */}
        {step === "problem" && (
          <div className="rounded-[20px] p-5" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#fac775" }}>
              Rendez-vous non réalisé
            </p>
            <h1 className="text-white font-black mb-2" style={{ fontSize: 22, letterSpacing: "-0.04em" }}>
              Que s'est-il passé ?
            </h1>
            <p className="text-[13px] font-medium leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Choisissez la situation. Vous pourrez reprogrammer simplement.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {PROBLEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedProblem(item)}
                  className="rounded-[14px] px-4 py-3.5 text-left text-[13px] font-bold transition active:scale-[0.97]"
                  style={{
                    background: selectedProblem === item ? "rgba(239,159,39,0.12)" : "#1a1a1a",
                    border: selectedProblem === item
                      ? "1.5px solid rgba(239,159,39,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: selectedProblem === item ? "#fac775" : "rgba(255,255,255,0.55)",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!selectedProblem}
              onClick={() => navigate("/choose-place")}
              className="w-full h-12 rounded-full text-[14px] font-black text-white transition active:scale-[0.98] disabled:opacity-40"
              style={{ background: "#1a4d2e" }}
            >
              Reprogrammer
            </button>
          </div>
        )}

        {/* ── Étape : confirmation ──────────────────────────────────────────── */}
        {step === "done" && (
          <div className="rounded-[20px] p-5 text-center" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              className="h-14 w-14 rounded-[16px] flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(93,202,165,0.12)" }}
            >
              <CheckCircle2 size={28} style={{ color: "#5dcaa5" }} strokeWidth={2} />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5dcaa5" }}>
              Merci
            </p>
            <h1 className="text-white font-black mb-2" style={{ fontSize: 22, letterSpacing: "-0.04em" }}>
              Merci pour ton retour.
            </h1>
            <p className="text-[13px] font-medium leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              Ton retour aide Troco à créer des échanges plus simples, sûrs et humains.
            </p>

            <button
              type="button"
              onClick={() => navigate("/exchanges")}
              className="w-full h-12 rounded-full text-[14px] font-black transition active:scale-[0.98]"
              style={{ background: "#1a1a1a", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Retour aux trocs
            </button>
          </div>
        )}

        {/* ── Esprit Troco (sidebar mobile) ─────────────────────────────────── */}
        {step !== "done" && (
          <div className="mt-4 space-y-3">
            <div
              className="rounded-[16px] p-4"
              style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#5dcaa5" }}>
                Esprit Troco
              </p>
              <div className="space-y-2.5">
                {[
                  { icon: Coffee,        text: "Un échange peut aussi être un bon moment." },
                  { icon: MessageCircle, text: "Gardez le contact si un détail change."     },
                  { icon: RotateCcw,     text: "Vous pouvez reprogrammer sans pression."    },
                ].map(({ icon: Icon, text }) => (
                  <p key={text} className="flex items-start gap-2.5 text-[12.5px] font-medium leading-relaxed"
                     style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Icon size={15} strokeWidth={2} style={{ color: "#5dcaa5", flexShrink: 0, marginTop: 1 }} />
                    {text}
                  </p>
                ))}
              </div>
            </div>

            <div
              className="rounded-[16px] p-4"
              style={{ background: "rgba(93,202,165,0.06)", border: "1px solid rgba(93,202,165,0.12)" }}
            >
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#5dcaa5" }}>
                <Sparkles size={13} strokeWidth={2} /> Impact
              </p>
              <p className="text-[12.5px] font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                Chaque rencontre réussie aide les objets à circuler localement, sans achat neuf.
              </p>
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
