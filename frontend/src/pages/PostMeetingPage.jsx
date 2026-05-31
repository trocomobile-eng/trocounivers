import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  CheckCircle2,
  ChevronRight,
  Repeat2,
  Star,
  MapPin,
  MessageCircle,
  Clock3,
  Sparkles,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function clean(value = "") {
  return String(value || "").trim();
}

function getDisplayTitle(item) {
  return (
    clean(item?.title) ||
    clean(item?.itemType) ||
    clean(item?.generatedTitle) ||
    "Objet"
  );
}

function getItemImage(item) {
  return item?.images?.[0] || item?.imageUrl || item?.photoUrl || "";
}

function getOtherName(exchange, uid) {
  if (!exchange || !uid) return "L'autre personne";

  if (exchange.senderId === uid) {
    return (
      clean(exchange.receiverName) ||
      clean(exchange.receiverDisplayName) ||
      "L'autre personne"
    );
  }

  return (
    clean(exchange.senderName) ||
    clean(exchange.senderDisplayName) ||
    "L'autre personne"
  );
}

const QUESTIONS = [
  {
    id: "overall",
    icon: Sparkles,
    question: "Comment s'est passée la rencontre ?",
    subtitle: "Ton ressenti global.",
    options: [
      { value: "excellent", emoji: "🤩", label: "Excellente" },
      { value: "good", emoji: "😊", label: "Très bien" },
      { value: "ok", emoji: "😐", label: "Correct" },
      { value: "bad", emoji: "😕", label: "Difficile" },
    ],
  },

  {
    id: "communication",
    icon: MessageCircle,
    question: "La communication avant la rencontre était...",
    subtitle: "Messages, organisation, réactivité.",
    options: [
      { value: "fluid", emoji: "💬", label: "Très fluide" },
      { value: "good", emoji: "👍", label: "Correcte" },
      { value: "slow", emoji: "⌛", label: "Lente" },
      { value: "confusing", emoji: "😵", label: "Confuse" },
    ],
  },

  {
    id: "other_person",
    icon: Star,
    question: "L'autre personne était...",
    subtitle: "Ton impression générale.",
    options: [
      { value: "punctual", emoji: "⏰", label: "Ponctuelle" },
      { value: "friendly", emoji: "🤝", label: "Sympa" },
      { value: "trustworthy", emoji: "🛡️", label: "De confiance" },
      { value: "late", emoji: "⌛", label: "En retard" },
    ],
  },

  {
    id: "item_match",
    icon: Repeat2,
    question: "L'objet correspondait à l'annonce ?",
    subtitle: "État, qualité, description.",
    options: [
      { value: "better", emoji: "✨", label: "Mieux que prévu" },
      { value: "perfect", emoji: "✅", label: "Exactement" },
      { value: "mostly", emoji: "👍", label: "À peu près" },
      { value: "different", emoji: "⚠️", label: "Différent" },
    ],
  },

  {
    id: "meeting_place",
    icon: MapPin,
    question: "Le lieu de rencontre était...",
    subtitle: "Accessibilité, confort, sécurité.",
    options: [
      { value: "great", emoji: "🌿", label: "Très bien" },
      { value: "fine", emoji: "👌", label: "Correct" },
      { value: "awkward", emoji: "😬", label: "Peu pratique" },
      { value: "unsafe", emoji: "🚨", label: "Pas rassurant" },
    ],
  },

  {
    id: "meeting_duration",
    icon: Clock3,
    question: "Combien de temps a duré l'échange ?",
    subtitle: "Approximation.",
    options: [
      { value: "5", emoji: "⚡", label: "< 5 min" },
      { value: "15", emoji: "🙂", label: "5–15 min" },
      { value: "30", emoji: "☕", label: "15–30 min" },
      { value: "long", emoji: "🌙", label: "+30 min" },
    ],
  },

  {
    id: "would_do_again",
    icon: Repeat2,
    question: "Tu referais un troc sur Troco ?",
    subtitle: "Ton envie de recommencer.",
    options: [
      { value: "yes", emoji: "🔁", label: "Absolument" },
      { value: "maybe", emoji: "🤔", label: "Peut-être" },
      { value: "no", emoji: "❌", label: "Non" },
    ],
  },
];

function QuestionStep({
  question,
  subtitle,
  icon: Icon,
  options,
  selected,
  onSelect,
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
          <Icon size={20} strokeWidth={2.3} />
        </div>

        <div>
          <h2 className="text-[22px] font-black leading-tight tracking-[-0.04em] text-[#081225]">
            {question}
          </h2>

          {subtitle && (
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={[
              "flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-[24px] border p-4 text-center transition-all active:scale-[0.98]",
              selected === option.value
                ? "border-[#1ABEA3]/40 bg-[#E8F7EF] shadow-[0_10px_24px_rgba(26,190,163,0.14)]"
                : "border-white/80 bg-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.05)]",
            ].join(" ")}
          >
            <span className="text-[34px]">{option.emoji}</span>

            <span
              className={[
                "text-[14px] font-black",
                selected === option.value
                  ? "text-[#0f9f9a]"
                  : "text-slate-700",
              ].join(" ")}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PostMeetingPage() {
  const { exchangeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exchange, setExchange] = useState(null);
  const [requestedItem, setRequestedItem] = useState(null);
  const [offeredItem, setOfferedItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function load() {
      if (!exchangeId) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "exchanges", exchangeId));

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const ex = {
          id: snap.id,
          ...snap.data(),
        };

        setExchange(ex);

        const [reqSnap, offSnap] = await Promise.all([
          ex.requestedItemId
            ? getDoc(doc(db, "items", ex.requestedItemId))
            : null,

          ex.offeredItemId
            ? getDoc(doc(db, "items", ex.offeredItemId))
            : null,
        ]);

        if (reqSnap?.exists()) {
          setRequestedItem({
            id: reqSnap.id,
            ...reqSnap.data(),
          });
        }

        if (offSnap?.exists()) {
          setOfferedItem({
            id: offSnap.id,
            ...offSnap.data(),
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [exchangeId]);

  function handleAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function submitFeedback() {
    if (!user?.uid || !exchangeId || saving) return;

    setSaving(true);
    setSaveError("");

    try {
      const feedbackId = `${exchangeId}_${user.uid}`;

      const otherUid =
        exchange?.senderId === user.uid
          ? exchange?.receiverId
          : exchange?.senderId;

      // flags automatiques
      const flags = [];

      if (answers.overall === "bad") {
        flags.push("bad_experience");
      }

      if (answers.item_match === "different") {
        flags.push("item_mismatch");
      }

      if (answers.would_do_again === "no") {
        flags.push("would_not_return");
      }

      if (answers.meeting_place === "unsafe") {
        flags.push("unsafe_meeting");
      }

      await setDoc(
        doc(db, "feedback", feedbackId),
        {
          exchangeId,
          userId: user.uid,
          otherUserId: otherUid || "",

          answers,

          comment: comment.trim(),

          flags,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStep(QUESTIONS.length + 1);
    } catch (error) {
      console.error(error);

      setSaveError(
        error?.message || "Impossible d'envoyer le feedback."
      );

      alert(
        error?.message || "Impossible d'envoyer le feedback."
      );
    } finally {
      setSaving(false);
    }
  }

  const currentQuestion = QUESTIONS[step - 1];

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : null;

  const isIntro = step === 0;
  const isDone = step > QUESTIONS.length;
  const isCommentStep = step === QUESTIONS.length;

  const otherName = exchange
    ? getOtherName(exchange, user?.uid)
    : "L'autre personne";

  const firstName = otherName.split(" ")[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfffd]">
        <p className="text-sm font-bold text-slate-500">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,rgba(186,230,253,0.10),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(187,247,208,0.07),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fbfffd_48%,#ffffff_100%)] pb-32 text-[#081225]">

      <main className="mx-auto max-w-[560px] px-5 pt-[max(24px,env(safe-area-inset-top))]">

        {/* Header */}
        <div className="mb-6 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
            <Star size={30} strokeWidth={2.2} />
          </div>

          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.20em] text-[#1ABEA3]">
            Feedback Troco
          </p>

          <h1 className="mt-1 text-[30px] font-black tracking-[-0.05em]">
            {isDone
              ? "Merci 💚"
              : isIntro
              ? "Comment ça s'est passé ?"
              : `Question ${step} / ${QUESTIONS.length}`}
          </h1>

        </div>

        {/* Exchange card */}
        {exchange && (
          <div className="mb-5 rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">

            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Votre échange
            </p>

            <div className="flex items-center gap-3">

              {offeredItem && (
                <div className="h-16 w-16 overflow-hidden rounded-[16px] bg-slate-100">
                  {getItemImage(offeredItem) ? (
                    <img
                      src={getItemImage(offeredItem)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      📦
                    </div>
                  )}
                </div>
              )}

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
                <Repeat2 size={18} strokeWidth={2.4} />
              </div>

              {requestedItem && (
                <div className="h-16 w-16 overflow-hidden rounded-[16px] bg-slate-100">
                  {getItemImage(requestedItem) ? (
                    <img
                      src={getItemImage(requestedItem)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      📦
                    </div>
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-black">
                  Avec {firstName}
                </p>

                <p className="mt-1 truncate text-[13px] font-medium text-slate-500">
                  {requestedItem
                    ? getDisplayTitle(requestedItem)
                    : "Objet"}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Main card */}
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">

          {saveError && (
            <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 p-4 text-[13px] font-bold text-red-700">
              {saveError}
            </div>
          )}

          {/* Intro */}
          {isIntro && (
            <div>

              <p className="text-[16px] leading-relaxed text-slate-600">
                Ce questionnaire nous aide énormément à améliorer Troco avant le lancement.
              </p>

              <div className="mt-5 rounded-[22px] bg-slate-50 p-4">

                <p className="text-[13px] font-bold text-slate-700">
                  💡 Tes réponses servent à :
                </p>

                <ul className="mt-3 space-y-2 text-[14px] text-slate-600">
                  <li>• améliorer les échanges</li>
                  <li>• détecter les problèmes récurrents</li>
                  <li>• rendre les rencontres plus fluides</li>
                  <li>• construire un système de confiance</li>
                </ul>

              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-[#2ECC8A] text-[16px] font-black text-white shadow-[0_12px_26px_rgba(16,185,129,0.22)] transition active:scale-[0.98]"
              >
                Commencer
                <ChevronRight size={18} strokeWidth={2.4} />
              </button>

            </div>
          )}

          {/* Questions */}
          {!isIntro && !isDone && currentQuestion && (
            <div>

              {/* Progress */}
              <div className="mb-5 flex gap-1.5">
                {QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={[
                      "h-1.5 flex-1 rounded-full transition-all",
                      i < step
                        ? "bg-[#1ABEA3]"
                        : "bg-slate-100",
                    ].join(" ")}
                  />
                ))}
              </div>

              <QuestionStep
                question={currentQuestion.question}
                subtitle={currentQuestion.subtitle}
                icon={currentQuestion.icon}
                options={currentQuestion.options}
                selected={currentAnswer}
                onSelect={(value) =>
                  handleAnswer(currentQuestion.id, value)
                }
              />

              {/* Comment field final */}
              {isCommentStep && (
                <div className="mt-5">

                  <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">

                    <p className="text-[14px] font-black text-slate-700">
                      💬 Un détail à ajouter ?
                    </p>

                    <p className="mt-1 text-[13px] text-slate-500">
                      Suggestion, bug, ressenti, problème, idée…
                    </p>

                    <textarea
                      value={comment}
                      onChange={(e) =>
                        setComment(e.target.value.slice(0, 300))
                      }
                      placeholder="Ex : le lieu était un peu compliqué à trouver..."
                      className="mt-4 min-h-[120px] w-full resize-none rounded-[18px] border border-slate-100 bg-white p-4 text-[14px] outline-none"
                    />

                    <div className="mt-2 text-right text-[11px] font-bold text-slate-300">
                      {comment.length}/300
                    </div>

                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">

                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="h-[52px] flex-1 rounded-full border border-slate-100 bg-white text-[14px] font-black text-slate-600"
                  >
                    Retour
                  </button>
                )}

                <button
                  type="button"
                  disabled={!currentAnswer || saving}
                  onClick={() => {
                    if (step === QUESTIONS.length) {
                      submitFeedback();
                    } else {
                      setStep((s) => s + 1);
                    }
                  }}
                  className="h-[52px] flex-1 rounded-full bg-gradient-to-r from-cyan-400 to-[#2ECC8A] text-[15px] font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] disabled:opacity-40 transition active:scale-[0.98]"
                >
                  {saving
                    ? "Envoi..."
                    : step === QUESTIONS.length
                    ? "Envoyer"
                    : "Suivant"}
                </button>

              </div>

            </div>
          )}

          {/* Done */}
          {isDone && (
            <div className="text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
                <CheckCircle2 size={36} strokeWidth={2.2} />
              </div>

              <h2 className="mt-5 text-[28px] font-black tracking-[-0.04em]">
                Merci 💚
              </h2>

              <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                Tes réponses vont énormément nous aider à améliorer Troco avant le lancement.
              </p>

              <div className="mt-6 rounded-[24px] bg-[#E8F7EF] p-5 text-left">

                <p className="text-[14px] font-medium leading-relaxed text-[#0f9f9a]">
                  🌱 Chaque échange aide à construire une manière plus locale, humaine et durable de faire circuler les objets.
                </p>

              </div>

              <button
                type="button"
                onClick={() => navigate("/exchanges")}
                className="mt-6 flex h-[56px] w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-[#2ECC8A] text-[16px] font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition active:scale-[0.98]"
              >
                Retour aux échanges
              </button>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}