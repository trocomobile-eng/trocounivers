import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const SURVEYS = {
  after_add_item: {
    title: "Retour sur l’ajout d’objet 🙏",
    subtitle: "Quelques questions pour comprendre ce qui est clair ou non.",
    questions: [
      {
        id: "ease",
        text: "Globalement, publier ton objet a été :",
        type: "scale",
        options: [
          { value: 1, emoji: "😤", label: "Très compliqué" },
          { value: 2, emoji: "😕", label: "Compliqué" },
          { value: 3, emoji: "😐", label: "Correct" },
          { value: 4, emoji: "😊", label: "Facile" },
          { value: 5, emoji: "🤩", label: "Très facile" },
        ],
      },
      {
        id: "found_add_button",
        text: "As-tu trouvé facilement où ajouter un objet ?",
        type: "choice",
        options: [
          { value: "immediately", label: "✅ Oui, immédiatement" },
          { value: "after_seconds", label: "👍 Oui, après quelques secondes" },
          { value: "searched", label: "🤔 J’ai dû chercher" },
          { value: "not_clear", label: "❌ Ce n’était pas clair" },
        ],
      },
      {
        id: "plus_button_meaning",
        text: "Qu’as-tu pensé que le bouton “+” allait faire ?",
        type: "textarea",
        placeholder: "Ex : ajouter un objet, ouvrir mes objets, proposer un échange...",
      },
      {
        id: "main_hesitation",
        text: "À quel moment as-tu le plus hésité ?",
        type: "choice",
        options: [
          { value: "photos", label: "📸 Ajouter les photos" },
          { value: "title", label: "✏️ Trouver un titre" },
          { value: "description", label: "📝 Écrire la description" },
          { value: "category", label: "🏷️ Choisir la catégorie" },
          { value: "condition", label: "⭐ Choisir l’état de l’objet" },
          { value: "publish", label: "🚀 Comprendre le bouton Publier" },
          { value: "nothing", label: "✅ Rien, c’était fluide" },
        ],
      },
      {
        id: "categories_clarity",
        text: "Les catégories étaient-elles claires ?",
        type: "choice",
        options: [
          { value: "very_clear", label: "✅ Très claires" },
          { value: "mostly_clear", label: "👍 Plutôt claires" },
          { value: "medium", label: "🤔 Moyennement claires" },
          { value: "unclear", label: "❌ Pas claires" },
        ],
      },
      {
        id: "publish_button_visibility",
        text: "Le bouton “Publier” était-il assez visible et compréhensible ?",
        type: "choice",
        options: [
          { value: "yes", label: "✅ Oui, très clair" },
          { value: "medium", label: "🤔 Moyennement" },
          { value: "no", label: "❌ Non, pas assez visible" },
        ],
      },
      {
        id: "after_publish_clarity",
        text: "Après publication, savais-tu ce qui allait se passer ensuite ?",
        type: "choice",
        options: [
          { value: "yes", label: "✅ Oui parfaitement" },
          { value: "mostly", label: "👍 Globalement oui" },
          { value: "not_really", label: "🤔 Pas vraiment" },
          { value: "no", label: "❌ Pas du tout" },
        ],
      },
      {
        id: "one_improvement",
        text: "Si tu pouvais améliorer une seule chose sur cet écran, ce serait quoi ?",
        type: "textarea",
        optional: true,
        placeholder: "Ex : rendre le bouton plus visible, expliquer les catégories, simplifier les champs...",
      },
    ],
  },
};

export default function SurveyModal({ surveyId, onDone, metadata = {} }) {
  const { user } = useAuth();
  const survey = SURVEYS[surveyId];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  if (!survey) {
    onDone?.();
    return null;
  }

  const question = survey.questions[step];
  const isFirst = step === 0;
  const isLast = step === survey.questions.length - 1;
  const currentAnswer = answers[question.id];
  const hasAnswer =
    currentAnswer !== undefined &&
    currentAnswer !== null &&
    String(currentAnswer).trim() !== "";

  const progress = Math.round(((step + 1) / survey.questions.length) * 100);

  function select(value) {
    setAnswers((cur) => ({ ...cur, [question.id]: value }));
  }

  function updateText(value) {
    setAnswers((cur) => ({ ...cur, [question.id]: value }));
  }

  function previous() {
    if (!isFirst) setStep((s) => s - 1);
  }

  async function next() {
    if (isLast) {
      await submit();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function skipAndNext() {
    setAnswers((cur) => ({ ...cur, [question.id]: "" }));

    if (isLast) {
      await submit();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function submit() {
    setSaving(true);

    try {
      if (user?.uid) {
        await setDoc(
          doc(db, "feedback", `${user.uid}_${surveyId}_${Date.now()}`),
          {
            userId: user.uid,
            surveyId,
            answers,
            metadata,
            createdAt: serverTimestamp(),
          }
        );
      }
    } catch (e) {
      console.error("Survey save error:", e);
    } finally {
      setSaving(false);
      onDone?.();
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/30 sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => onDone?.()}
        aria-label="Fermer"
      />

      <div className="relative z-10 w-full max-w-[460px] rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5 shadow-[0_-8px_40px_rgba(15,23,42,0.12)] sm:rounded-[28px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E4ECE8] sm:hidden" />

        <div className="mb-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Question {step + 1}/{survey.questions.length}
              </p>

              <h2 className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-[#0d1b2a]">
                {isFirst ? survey.title : question.text}
              </h2>

              {isFirst && (
                <p className="mt-1 text-[13px] font-medium text-slate-500">
                  {survey.subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDone?.()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F3] text-slate-400"
            >
              <X size={16} />
            </button>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isFirst && (
          <p className="mb-4 text-[15px] font-bold text-[#0d1b2a]">
            {question.text}
          </p>
        )}

        {question.type === "scale" && (
          <div className="grid grid-cols-5 gap-2">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => select(opt.value)}
                className={[
                  "flex flex-col items-center gap-1.5 rounded-[16px] border py-3 text-center transition active:scale-[0.97]",
                  currentAnswer === opt.value
                    ? "border-[#1ABEA3]/40 bg-[#E8F7EF]"
                    : "border-[#E4ECE8] bg-white",
                ].join(" ")}
              >
                <span className="text-[24px]">{opt.emoji}</span>
                <span
                  className={[
                    "text-[10px] font-bold leading-tight",
                    currentAnswer === opt.value
                      ? "text-[#0f9f9a]"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {question.type === "choice" && (
          <div className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => select(opt.value)}
                className={[
                  "flex w-full items-center gap-3 rounded-[16px] border px-4 py-3 text-left text-[14px] font-semibold transition active:scale-[0.98]",
                  currentAnswer === opt.value
                    ? "border-[#1ABEA3]/40 bg-[#E8F7EF] text-[#0f9f9a]"
                    : "border-[#E4ECE8] bg-white text-[#0d1b2a]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {question.type === "textarea" && (
          <textarea
            value={currentAnswer || ""}
            onChange={(e) => updateText(e.target.value)}
            placeholder={question.placeholder}
            rows={5}
            className="w-full resize-none rounded-[20px] border border-[#E4ECE8] bg-[#FAFBFA] px-4 py-3 text-[14px] font-medium text-[#0d1b2a] outline-none transition placeholder:text-slate-400 focus:border-[#1ABEA3]/50 focus:bg-white"
          />
        )}

        <div className="mt-5 flex gap-3">
          {!isFirst && (
            <button
              type="button"
              onClick={previous}
              disabled={saving}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E4ECE8] text-slate-400 transition active:scale-[0.98] disabled:opacity-40"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
          )}

          {question.optional && !hasAnswer && (
            <button
              type="button"
              onClick={skipAndNext}
              disabled={saving}
              className="flex-1 rounded-full border border-[#E4ECE8] py-3 text-[14px] font-bold text-slate-400 transition active:scale-[0.98] disabled:opacity-40"
            >
              Passer
            </button>
          )}

          <button
            type="button"
            onClick={next}
            disabled={(!hasAnswer && !question.optional) || saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] py-3 text-[14px] font-black text-white shadow-[0_8px_20px_rgba(26,190,163,0.18)] transition active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? "Envoi..." : isLast ? "Envoyer" : "Suivant"}
            {!isLast && !saving && <ChevronRight size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}