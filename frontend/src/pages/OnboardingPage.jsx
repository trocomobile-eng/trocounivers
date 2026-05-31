import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Plus, Sparkles } from "lucide-react";
import TrocoOnboarding from "../components/TrocoOnboarding";

function markSeen() {
  try {
    localStorage.setItem("troco_onboarding_seen", "true");
    localStorage.setItem("troco:onboarding-seen", "true");
  } catch {}
}

function LaunchScreen({ onAddItem, onSkip }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--troco-bg)] px-5 text-center">
      {/* Icône */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#1ABEA3] to-[#36C982] shadow-[0_16px_40px_rgba(26,190,163,0.28)]">
        <Sparkles size={36} strokeWidth={2} className="text-white" />
      </div>

      {/* Titre */}
      <h1 className="max-w-[300px] text-[32px] font-black leading-[0.96] tracking-[-0.05em] text-[#0d1b2a]">
        Ajoute ton premier objet
      </h1>
      <p className="mt-4 max-w-[300px] text-[15px] font-medium leading-relaxed text-[#64748b]">
        Pour commencer à troquer, il te faut au moins un objet dans ta bibliothèque.
      </p>

      {/* Étapes visuelles */}
      <div className="mt-8 w-full max-w-[340px] space-y-3">
        {[
          { n: "1", label: "Prends une photo de l'objet" },
          { n: "2", label: "Donne-lui un titre court" },
          { n: "3", label: "Choisis une catégorie" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-4 rounded-[16px] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0FAF7] text-[13px] font-black text-[#1ABEA3]">
              {n}
            </span>
            <span className="text-[14px] font-semibold text-[#0d1b2a]">{label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 w-full max-w-[340px] space-y-3">
        <button
          type="button"
          onClick={onAddItem}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] text-[16px] font-black text-white shadow-[0_12px_28px_rgba(26,190,163,0.22)] transition active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={2.5} />
          Ajouter mon premier objet
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold text-[#94a3b8] transition active:scale-[0.98]"
        >
          <BookOpen size={16} strokeWidth={2} />
          Explorer d'abord le feed
          <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState("slides"); // "slides" | "launch"

  function finishSlides() {
    setStep("launch");
  }

  function goToAdd() {
    markSeen();
    if (user?.uid) {
      navigate("/add", { replace: true });
    } else {
      navigate("/signup", { replace: true, state: { redirectTo: "/add" } });
    }
  }

  function goToFeed() {
    markSeen();
    navigate("/feed", { replace: true });
  }

  if (step === "launch") {
    return <LaunchScreen onAddItem={goToAdd} onSkip={goToFeed} />;
  }

  return (
    <TrocoOnboarding
      onDone={finishSlides}
      onSkip={goToFeed}
    />
  );
}
