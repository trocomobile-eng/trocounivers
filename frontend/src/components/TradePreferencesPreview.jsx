import { Sparkles } from "lucide-react";

export default function TradePreferencesPreview({
  title,
  imageUrls = [],
  category,
  condition,
  location,
  tradePreferences,
}) {
  const categories = tradePreferences?.categories || [];
  const ideas = tradePreferences?.ideas || "";
  const openToSurprises = tradePreferences?.openToSurprises;

  return (
    <section className="rounded-[28px] border border-white/40 bg-white/78 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-lg">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
        Aperçu
      </p>

      <h2 className="mt-2 text-[28px] font-black leading-[0.98] tracking-[-0.05em] text-[#081225]">
        Ton annonce
      </h2>

      <div className="mt-5 overflow-hidden rounded-[26px] bg-white/80 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="aspect-[1.1/1] bg-slate-100">
          {imageUrls[0] ? (
            <img
              src={imageUrls[0]}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
              Photo de l’objet
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 text-lg font-black tracking-[-0.035em] text-[#081225]">
            {title || "Nom de ton objet"}
          </h3>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {category || "Catégorie"} · {condition || "État"} · {location || "Localisation"}
          </p>

          <div className="mt-5 rounded-[22px] bg-[#F4FBF8] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f9f9a]">
              Ce que j’aimerais recevoir
            </p>

            {categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold text-[#0f9f9a]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            {ideas && (
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                {ideas}
              </p>
            )}

            {openToSurprises && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                <Sparkles size={13} />
                Ouvert aux surprises
              </div>
            )}

            {!categories.length && !ideas && !openToSurprises && (
              <p className="mt-3 text-sm font-medium text-slate-400">
                Tes préférences apparaîtront ici.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-sm font-semibold leading-relaxed text-slate-500">
        Plus tu précises ce que tu recherches,
        <br />
        plus tu as de chances de trouver le bon échange.
      </p>
    </section>
  );
}
