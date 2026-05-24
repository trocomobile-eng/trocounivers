import { Gift, Sparkles } from "lucide-react";

export default function TradePreferencesSummary({
  preferences,
  ownerName = "Cette personne",
  className = "",
}) {
  const categories = preferences?.categories || [];
  const ideas = preferences?.ideas || "";
  const openToSurprises = preferences?.openToSurprises;

  const hasPreferences = categories.length || ideas || openToSurprises;

  return (
    <section
      className={[
        "rounded-[28px] border border-white/40 bg-white/76 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-lg",
        className,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#E8F7EF] text-[#0f9f9a]">
          <Gift size={21} strokeWidth={2.2} />
        </div>

        <div>
          <h3 className="text-[22px] font-black leading-[1.02] tracking-[-0.045em] text-[#081225]">
            Ce que {ownerName} recherche en échange
          </h3>

          <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">
            Regarde ses préférences avant de proposer un troc.
          </p>
        </div>
      </div>

      {!hasPreferences ? (
        <div className="mt-5 rounded-[22px] bg-white/70 p-4">
          <p className="text-sm font-semibold leading-relaxed text-slate-500">
            {ownerName} n’a pas encore précisé ce qu’elle recherche.
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
            Tu peux quand même lui proposer un objet.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {categories.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                Catégories qui l’intéressent
              </p>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-[#E8F7EF] px-3 py-1.5 text-xs font-black text-[#0f9f9a]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ideas && (
            <div className="rounded-[22px] bg-white/70 p-4">
              <p className="mb-2 text-[12px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
                Idées précises recherchées
              </p>

              <p className="text-[15px] font-semibold leading-relaxed text-[#334155]">
                {ideas}
              </p>
            </div>
          )}

          {openToSurprises ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
              <Sparkles size={14} />
              Ouvert aux propositions inattendues
            </div>
          ) : (
            <p className="rounded-[20px] bg-white/70 px-4 py-3 text-sm font-semibold text-slate-500">
              Préfère recevoir des propositions proches de ses recherches.
            </p>
          )}

          <p className="text-sm font-medium leading-relaxed text-slate-500">
            Tu peux proposer autre chose, mais ces pistes augmentent tes chances d’obtenir une réponse.
          </p>
        </div>
      )}
    </section>
  );
}
