import { useEffect, useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../../firebase";
import { getTradePreferences } from "./profileUtils";

const PREFERENCE_OPTIONS = [
  "Vintage",
  "Appareils photo",
  "Musique",
  "Livres",
  "Maison",
  "Design",
  "Électronique",
  "Art",
  "Mode",
  "Sport",
  "Plantes",
  "Voyage",
  "Vinyles",
  "Lampes",
  "Vélos",
  "Déco",
  "Jeux",
  "Objets utiles",
];

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function unique(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

export default function PreferenceModal({
  open,
  mode = "looking",
  profile,
  user,
  onClose,
  onSaved,
}) {
  const [selected, setSelected] = useState([]);
  const [customValue, setCustomValue] = useState("");
  const [saving, setSaving] = useState(false);

  const prefs = useMemo(() => getTradePreferences(profile || {}), [profile]);
  const isLooking = mode === "looking";

  const title = isLooking ? "Je recherche" : "Je ne recherche pas";
  const description = isLooking
    ? "Sélectionne ce que tu aimerais recevoir en échange."
    : "Sélectionne ce que tu préfères éviter dans les propositions.";

  useEffect(() => {
    if (!open) return;

    setSelected(isLooking ? prefs.lookingFor || [] : prefs.notLookingFor || []);
    setCustomValue("");
  }, [open, isLooking, prefs.lookingFor, prefs.notLookingFor]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function handleEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  function toggle(label) {
    setSelected((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : unique([...current, label]).slice(0, 12)
    );
  }

  function addCustom() {
    const value = clean(customValue);
    if (!value) return;

    setSelected((current) => unique([...current, value]).slice(0, 12));
    setCustomValue("");
  }

  async function save() {
    if (!user?.uid || saving) return;

    setSaving(true);

    try {
      const nextLookingFor = isLooking ? selected : prefs.lookingFor || [];
      const nextNotLookingFor = isLooking ? prefs.notLookingFor || [] : selected;
      const universe = prefs.universe || [];

      const payload = {
        lookingFor: nextLookingFor,
        wantedItems: nextLookingFor,
        searchingFor: nextLookingFor,
        tradeWants: nextLookingFor,

        notLookingFor: nextNotLookingFor,
        avoidItems: nextNotLookingFor,
        notInterestedIn: nextNotLookingFor,

        universe,
        interests: universe,
        tags: universe,

        tradePreferences: {
          lookingFor: nextLookingFor,
          notLookingFor: nextNotLookingFor,
          universe,
          note: profile?.tradePreferences?.note || "",
        },

        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });

      onSaved?.(payload);
      onClose?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center overflow-hidden pb-[84px] sm:items-center sm:pb-0">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/28 backdrop-blur-[6px]"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="relative z-10 flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] border border-white/75 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-h-[85vh] sm:w-[92vw] sm:rounded-[28px]" style={{maxHeight: "min(85vh, calc(100dvh - 20px))"}}>

        <header className="shrink-0 border-b border-[#E4ECE8] bg-white/86 px-5 py-4 backdrop-blur-xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#D8E7E1] sm:hidden" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                Préférences
              </p>
              <h2 className="mt-1 text-[24px] font-black leading-none tracking-[-0.055em] text-[#081225]">
                {title}
              </h2>
              <p className="mt-2 max-w-[360px] text-[13px] font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#40545B] shadow-[0_8px_22px_rgba(15,23,42,0.045)]"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PREFERENCE_OPTIONS.map((label) => {
              const active = selected.includes(label);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(label)}
                  className={[
                    "flex min-h-[46px] items-center justify-center gap-2 rounded-[17px] border px-3 py-2 text-center text-[13px] font-black transition active:scale-[0.98]",
                    active
                      ? "border-transparent bg-gradient-to-r from-[#16C7C1] to-[#31D67B] text-white shadow-[0_10px_22px_rgba(20,184,166,0.16)]"
                      : "border-[#E4ECE8] bg-white text-[#40545B] shadow-[0_8px_18px_rgba(15,23,42,0.03)]",
                  ].join(" ")}
                >
                  {active && <Check size={15} strokeWidth={3} />}
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[22px] border border-[#E4ECE8] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
            <p className="mb-2 text-[12px] font-black text-[#081225]">
              Ajouter autre chose
            </p>

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
                placeholder={isLooking ? "Ex : platine vinyle" : "Ex : meubles lourds"}
                className="h-11 min-w-0 flex-1 rounded-[16px] border border-[#E4ECE8] bg-[#F8FCFA] px-3 text-[14px] font-semibold text-[#081225] outline-none placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={addCustom}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#081225] text-white"
                aria-label="Ajouter"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className="rounded-full border border-[#BFE8DA] bg-white px-3 py-1.5 text-[12px] font-black text-[#08755C]"
                >
                  {item} ×
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#E4ECE8] bg-white/90 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-[17px] px-4 text-[13px] font-black text-[#40545B]"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-11 rounded-[17px] bg-[#081225] px-5 text-[13px] font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] disabled:opacity-60"
            >
              {saving ? "Sauvegarde..." : "OK"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
