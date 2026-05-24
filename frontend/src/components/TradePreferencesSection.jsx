
import { Home, Music2, Laptop2, Shirt, BookOpen, Dumbbell, Gamepad2, Flower2, Sparkles } from "lucide-react";

const categories = [
  { label: "Maison", icon: Home, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { label: "Musique", icon: Music2, color: "bg-green-50 text-green-700 border-green-100" },
  { label: "Tech", icon: Laptop2, color: "bg-sky-50 text-sky-700 border-sky-100" },
  { label: "Mode", icon: Shirt, color: "bg-rose-50 text-rose-700 border-rose-100" },
  { label: "Livres", icon: BookOpen, color: "bg-amber-50 text-amber-700 border-amber-100" },
  { label: "Sport", icon: Dumbbell, color: "bg-orange-50 text-orange-700 border-orange-100" },
  { label: "Jeux", icon: Gamepad2, color: "bg-violet-50 text-violet-700 border-violet-100" },
  { label: "Déco", icon: Flower2, color: "bg-teal-50 text-teal-700 border-teal-100" },
];

export default function TradePreferencesSection({
  selectedCategories = [],
  setSelectedCategories,
  preciseIdeas,
  setPreciseIdeas,
  openToSurprises,
  setOpenToSurprises,
}) {

  function toggleCategory(category) {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(
        selectedCategories.filter((item) => item !== category)
      );
      return;
    }

    setSelectedCategories([...selectedCategories, category]);
  }

  return (
    <section className="rounded-[28px] border border-white/40 bg-white/78 p-5 backdrop-blur-lg shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
          Ce que j’aimerais recevoir
        </p>

        <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-[#081225]">
          Aide Troco à trouver le bon échange.
        </h2>

        <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-500">
          Dis-nous ce qui pourrait t’intéresser en échange.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const active = selectedCategories.includes(category.label);

          return (
            <button
              key={category.label}
              type="button"
              onClick={() => toggleCategory(category.label)}
              className={[
                "flex h-[44px] items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-all duration-200",
                active
                  ? category.color
                  : "border-white/60 bg-white/70 text-slate-600"
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <label className="text-[15px] font-bold text-[#081225]">
          Idées précises (facultatif)
        </label>

        <textarea
          value={preciseIdeas}
          onChange={(e) => setPreciseIdeas(e.target.value)}
          placeholder="Ex : lampe, plantes, vinyles, petite étagère en bois..."
          className="mt-3 min-h-[110px] w-full rounded-2xl border border-white/40 bg-white/65 px-4 py-4 text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-[24px] border border-white/40 bg-white/65 px-4 py-4">
        <div>
          <p className="text-[15px] font-bold text-[#081225]">
            Ouvert aux surprises
          </p>

          <p className="mt-1 text-[14px] font-medium text-slate-500">
            Je suis ouvert aux propositions inattendues.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpenToSurprises(!openToSurprises)}
          className={[
            "relative h-8 w-14 rounded-full transition-all duration-300",
            openToSurprises
              ? "bg-gradient-to-r from-[#34d399] to-cyan-400"
              : "bg-slate-200"
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-300",
              openToSurprises ? "left-7" : "left-1"
            ].join(" ")}
          />
        </button>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/40 bg-white/70 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#0f9f9a]" />

          <p className="text-[13px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
            Aperçu
          </p>
        </div>

        <div className="mt-4">
          <p className="text-[16px] font-black text-[#081225]">
            Ce que j’aimerais recevoir
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-[#E8F7EF] px-3 py-1.5 text-[13px] font-bold text-[#0f9f9a]"
              >
                {category}
              </span>
            ))}
          </div>

          {preciseIdeas && (
            <p className="mt-4 text-[14px] font-medium leading-relaxed text-slate-600">
              {preciseIdeas}
            </p>
          )}

          {openToSurprises && (
            <div className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-2 text-[13px] font-bold text-amber-700">
              Ouvert aux surprises
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-[14px] font-medium leading-relaxed text-slate-500">
        Plus tu précises ce que tu recherches,
        plus tu as de chances de trouver le bon échange.
      </p>
    </section>
  );
}
