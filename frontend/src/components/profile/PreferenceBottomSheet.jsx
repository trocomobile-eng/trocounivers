import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../../firebase";
import { getTradePreferences } from "./profileUtils";

const PREFERENCE_CARDS = [
  { id: "vintage", label: "Vintage", image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=700&q=80" },
  { id: "photo", label: "Appareils photo", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80" },
  { id: "music", label: "Musique", image: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=700&q=80" },
  { id: "books", label: "Livres", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=700&q=80" },
  { id: "home", label: "Maison", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80" },
  { id: "design", label: "Design", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=700&q=80" },
  { id: "electronics", label: "Électronique", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80" },
  { id: "art", label: "Art", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=700&q=80" },
  { id: "fashion", label: "Mode", image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=700&q=80" },
  { id: "sport", label: "Sport", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=700&q=80" },
  { id: "plants", label: "Plantes", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80" },
  { id: "travel", label: "Voyage", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80" },
];

function clean(value = "") {
  return String(value || "").trim();
}

function splitList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function pref(profile, keys) {
  for (const key of keys) {
    const list = splitList(profile?.[key]);
    if (list.length) return list;
  }
  return [];
}

function unique(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function PreferenceCard({ card, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative min-h-[106px] overflow-hidden rounded-[20px] border bg-white text-left shadow-[0_10px_24px_rgba(15,23,42,0.055)] transition active:scale-[0.985]",
        selected ? "border-[#25BCA7] ring-2 ring-[#25BCA7]/20" : "border-[#E8F1ED]",
      ].join(" ")}
    >
      <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/18 to-transparent" />

      {selected && (
        <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#08755C] shadow-[0_6px_16px_rgba(15,23,42,0.16)]">
          <Check size={16} strokeWidth={3} />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <p className="text-[14px] font-black leading-tight tracking-[-0.025em]">
          {card.label}
        </p>
        <p className="mt-0.5 text-[10.5px] font-bold text-white/78">
          {selected ? "Sélectionné" : "Ajouter"}
        </p>
      </div>
    </button>
  );
}

export default function PreferenceBottomSheet({
  user,
  profile,
  open,
  initialMode = "looking",
  onClose,
  onSaved,
}) {
  const [mode, setMode] = useState(initialMode);
  const [lookingFor, setLookingFor] = useState([]);
  const [notLookingFor, setNotLookingFor] = useState([]);
  const [universe, setUniverse] = useState([]);
  const [customLooking, setCustomLooking] = useState("");
  const [customNotLooking, setCustomNotLooking] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prefs = getTradePreferences(profile || {});

    setLookingFor(
      prefs.lookingFor.length
        ? prefs.lookingFor
        : pref(profile, ["lookingFor", "wantedItems", "searchingFor", "tradeWants"])
    );
    setNotLookingFor(
      prefs.notLookingFor.length
        ? prefs.notLookingFor
        : pref(profile, ["notLookingFor", "avoidItems", "notInterestedIn"])
    );
    setUniverse(pref(profile, ["universe", "interests", "tags", "lifestyleTags"]));
    setCustomLooking("");
    setCustomNotLooking("");
    setMode(initialMode === "not" ? "not" : "looking");
  }, [open, initialMode, profile]);

  const isLooking = mode === "looking";
  const currentList = isLooking ? lookingFor : notLookingFor;
  const customValue = isLooking ? customLooking : customNotLooking;
  const setCustomValue = isLooking ? setCustomLooking : setCustomNotLooking;

  const copy = useMemo(
    () => ({
      title: isLooking ? "Je recherche" : "Je ne recherche pas",
      description: isLooking
        ? "Sélectionne ce que tu aimerais recevoir en échange."
        : "Sélectionne ce que tu préfères éviter dans les propositions.",
      placeholder: isLooking
        ? "Ex : vinyles, lampe, vélo..."
        : "Ex : meubles lourds, vêtements...",
      addButton: isLooking ? "Ajouter" : "Éviter",
    }),
    [isLooking]
  );

  if (!open) return null;

  function toggleLabel(label) {
    const setter = isLooking ? setLookingFor : setNotLookingFor;

    setter((current) => {
      if (current.includes(label)) {
        return current.filter((item) => item !== label);
      }

      if (current.length >= 12) return current;
      return unique([...current, label]);
    });
  }

  function removeLabel(label) {
    const setter = isLooking ? setLookingFor : setNotLookingFor;
    setter((current) => current.filter((item) => item !== label));
  }

  function addCustom() {
    const value = clean(customValue);
    if (!value) return;

    if (isLooking) {
      setLookingFor((current) => unique([...current, value]).slice(0, 12));
      setCustomLooking("");
    } else {
      setNotLookingFor((current) => unique([...current, value]).slice(0, 12));
      setCustomNotLooking("");
    }
  }

  async function save() {
    if (!user?.uid || saving) return;

    setSaving(true);

    try {
      const payload = {
        lookingFor,
        wantedItems: lookingFor,
        searchingFor: lookingFor,
        tradeWants: lookingFor,
        notLookingFor,
        avoidItems: notLookingFor,
        notInterestedIn: notLookingFor,
        universe,
        interests: universe,
        tags: universe,
        tradePreferences: {
          lookingFor,
          notLookingFor,
          universe,
          note: profile?.tradePreferences?.note || profile?.tradePreferencesNote || "",
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      onSaved?.(payload);
      onClose?.();
    } catch (error) {
      console.error("Erreur sauvegarde préférences :", error);
      alert("Impossible d’enregistrer les préférences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden lg:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/34 backdrop-blur-[2px]"
        aria-label="Fermer les préférences"
      />

      <div className="relative flex max-h-[86vh] w-full max-w-[580px] flex-col overflow-hidden rounded-t-[34px] border border-white/80 bg-[#F7FBFA] shadow-[0_-22px_70px_rgba(15,23,42,0.22)] lg:max-h-[78vh] lg:rounded-[34px]">
        <div className="shrink-0 px-5 pb-3 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#CFE0DA]" />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#081225] shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition active:scale-95"
              aria-label="Retour au profil"
            >
              <ArrowLeft size={19} strokeWidth={2.4} />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                Préférences d’échange
              </p>
              <h2 className="mt-0.5 truncate text-[20px] font-black tracking-[-0.05em] text-[#081225]">
                {copy.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-white px-3.5 py-2 text-[12px] font-black text-[#08755C] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition active:scale-95 disabled:opacity-60"
            >
              {saving ? "..." : "Sauver"}
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ["looking", "Je recherche"],
              ["not", "Je ne recherche pas"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={[
                  "h-10 shrink-0 rounded-full px-4 text-[13px] font-black transition active:scale-[0.98]",
                  mode === id
                    ? "bg-gradient-to-r from-[#16C7C1] to-[#31D67B] text-white shadow-[0_10px_22px_rgba(20,184,166,0.16)]"
                    : "border border-[#E8F1ED] bg-white text-[#40545B]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] font-medium leading-relaxed text-slate-500">
            {copy.description}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="rounded-[24px] border border-[#E8F1ED] bg-white/90 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="flex gap-2">
              <input
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustom();
                  }
                }}
                placeholder={copy.placeholder}
                className="min-w-0 flex-1 rounded-[16px] border border-[#E6EFEB] bg-white px-3 text-[14px] font-medium outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={addCustom}
                className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[16px] bg-[#08755C] px-3 text-[13px] font-black text-white"
              >
                <Plus size={15} strokeWidth={2.5} />
                {copy.addButton}
              </button>
            </div>

            {currentList.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentList.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeLabel(item)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-[12.5px] font-black transition active:scale-[0.98]",
                      isLooking
                        ? "border-[#BFE8DA] bg-[#EAF8F4] text-[#08755C]"
                        : "border-[#E4EAEA] bg-[#F5F7F6] text-[#40545B]",
                    ].join(" ")}
                  >
                    {item}
                    <X size={13} strokeWidth={2.6} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] font-medium text-slate-400">
                Rien renseigné pour l’instant.
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3">
            {PREFERENCE_CARDS.map((card) => (
              <PreferenceCard
                key={card.id}
                card={card}
                selected={currentList.includes(card.label)}
                onClick={() => toggleLabel(card.label)}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E8F1ED] bg-white/86 px-5 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full px-4 text-[13px] font-black text-slate-500 transition active:scale-95"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-10 rounded-full bg-[#08755C] px-5 text-[13px] font-black text-white shadow-[0_10px_22px_rgba(8,117,92,0.16)] transition active:scale-95 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
