import {
  BookOpen,
  Dumbbell,
  Gamepad2,
  Home,
  Laptop,
  Leaf,
  Music2,
  Palette,
  Shirt,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { label: "Maison", icon: Home },
  { label: "Musique", icon: Music2 },
  { label: "Tech", icon: Laptop },
  { label: "Mode", icon: Shirt },
  { label: "Livres", icon: BookOpen },
  { label: "Sport", icon: Dumbbell },
  { label: "Jeux", icon: Gamepad2 },
  { label: "Déco", icon: Palette },
  { label: "Plantes", icon: Leaf },
];

export default function TradePreferencesForm({
  value,
  onChange,
  className = "",
}) {
  const preferences = value || {
    categories: [],
    ideas: "",
    openToSurprises: true,
  };

  function update(next) {
    onChange?.(next);
  }

  function toggleCategory(category) {
    const exists = preferences.categories?.includes(category);
    const categories = exists
      ? preferences.categories.filter((item) => item !== category)
      : [...(preferences.categories || []), category];

    update({ ...preferences, categories });
  }

  return (
    <section
      className={[
        "rounded-[28px] border border-white/40 bg-white/78 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-lg",
        className,
      ].join(" ")}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
        Préférences d’échange
      </p>

      <h2 className="mt-2 text-[28px] font-black leading-[0.98] tracking-[-0.05em] text-[#081225]">
        Ce que j’aimerais recevoir
      </h2>

      <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-500">
        Dis-nous ce qui pourrait t’intéresser en échange.
      </p>

      <div className="mt-5">
        <p className="mb-3 text-sm font-black text-[#081225]">
          Catégories préférées
        </p>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ label, icon: Icon }) => {
            const active = preferences.categories?.includes(label);

            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleCategory(label)}
                className={[
                  "flex h-[44px] items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition active:scale-95",
                  active
                    ? "border-emerald-200 bg-[#E8F7EF] text-[#0f9f9a] shadow-[0_6px_18px_rgba(16,185,129,0.08)]"
                    : "border-white/50 bg-white/65 text-slate-500",
                ].join(" ")}
              >
                <Icon size={16} strokeWidth={2.1} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-black text-[#081225]">
          Idées précises <span className="font-semibold text-slate-400">(facultatif)</span>
        </span>

        <textarea
          value={preferences.ideas || ""}
          onChange={(event) =>
            update({ ...preferences, ideas: event.target.value })
          }
          className="mt-3 min-h-[96px] w-full rounded-2xl border border-white/40 bg-white/65 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none placeholder:text-slate-400"
          placeholder="Ex : lampe, plantes, vinyles, petite étagère en bois..."
        />
      </label>

      <button
        type="button"
        onClick={() =>
          update({
            ...preferences,
            openToSurprises: !preferences.openToSurprises,
          })
        }
        className="mt-4 flex w-full items-center justify-between gap-4 rounded-[22px] border border-white/45 bg-white/64 px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7EF] text-[#0f9f9a]">
            <Sparkles size={17} strokeWidth={2.15} />
          </span>

          <span>
            <span className="block text-sm font-black text-[#081225]">
              Ouvert aux surprises
            </span>
            <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-slate-500">
              Je suis ouvert aux propositions inattendues.
            </span>
          </span>
        </span>

        <span
          className={[
            "flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition",
            preferences.openToSurprises ? "bg-[#2ECC8A]" : "bg-slate-200",
          ].join(" ")}
        >
          <span
            className={[
              "h-5 w-5 rounded-full bg-white shadow-sm transition",
              preferences.openToSurprises ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </span>
      </button>
    </section>
  );
}
