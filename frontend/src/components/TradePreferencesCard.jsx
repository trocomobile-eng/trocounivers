import { CATEGORIES } from "../constants/categories";
import { TRADE_PREFERENCE_MODES } from "../utils/tradePreferences";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function OptionCard({ active, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[26px] border p-4 text-left transition active:scale-[0.99] ${
        active
          ? "border-emerald-200 bg-emerald-50/80 shadow-[0_12px_28px_rgba(16,185,129,0.10)]"
          : "border-white/80 bg-white/75 shadow-[0_10px_24px_rgba(15,23,42,0.045)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          {active && <CheckIcon />}
        </span>

        <span className="min-w-0">
          <span className="block text-[15px] font-black tracking-[-0.02em] text-slate-950">
            {title}
          </span>

          <span className="mt-1 block text-[13px] font-medium leading-relaxed text-slate-500">
            {text}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function TradePreferencesCard({
  mode,
  categories,
  onModeChange,
  onCategoriesChange,
}) {
  const selectedCategories = Array.isArray(categories) ? categories : [];

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((item) => item !== category));
      return;
    }

    if (selectedCategories.length >= 5) return;

    onCategoriesChange([...selectedCategories, category]);
  };

  return (
    <section className="rounded-[34px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
          Préférences de troc
        </p>

        <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-slate-950">
          Ce que tu aimerais recevoir
        </h2>

        <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">
          Ces préférences aident les autres à te proposer des échanges plus pertinents. Elles ne bloquent jamais les propositions.
        </p>
      </div>

      <div className="grid gap-3">
        <OptionCard
          active={mode === TRADE_PREFERENCE_MODES.ALL}
          title="Ouvert à tout"
          text="Je suis curieux, propose-moi ce que tu veux."
          onClick={() => onModeChange(TRADE_PREFERENCE_MODES.ALL)}
        />

        <OptionCard
          active={mode === TRADE_PREFERENCE_MODES.CATEGORIES}
          title="Ouvert à certaines catégories"
          text="Je préfère recevoir des propositions dans quelques univers."
          onClick={() => onModeChange(TRADE_PREFERENCE_MODES.CATEGORIES)}
        />
      </div>

      {mode === TRADE_PREFERENCE_MODES.CATEGORIES && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] font-black text-slate-700">
              Choisis 1 à 5 catégories
            </p>

            <p className="text-[12px] font-bold text-slate-400">
              {selectedCategories.length}/5
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const active = selectedCategories.includes(category);

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full border px-3.5 py-2 text-[12.5px] font-black transition active:scale-95 ${
                    active
                      ? "border-transparent bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_8px_18px_rgba(16,185,129,0.18)]"
                      : "border-white/80 bg-white/88 text-slate-600 shadow-sm"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {selectedCategories.length === 0 && (
            <p className="mt-3 rounded-[18px] bg-orange-50 px-4 py-3 text-[13px] font-semibold leading-relaxed text-orange-700">
              Sélectionne au moins une catégorie ou choisis “Ouvert à tout”.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
