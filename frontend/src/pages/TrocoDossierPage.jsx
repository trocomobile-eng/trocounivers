import { Link } from "react-router-dom";

const SECTIONS = [
  {
    number: "01",
    title: "Vision",
    text: "Troco veut devenir une nouvelle manière de faire circuler les objets : plus locale, plus simple et plus humaine. L’objectif n’est pas seulement de troquer, mais de créer des rencontres utiles autour d’objets qui méritent une seconde vie.",
  },
  {
    number: "02",
    title: "Problème",
    text: "Beaucoup d’objets dorment dans les placards alors qu’ils pourraient servir à quelqu’un à proximité. Les solutions existantes sont souvent centrées sur la vente, le don ou les petites annonces, avec peu de guidage et peu de chaleur dans l’expérience.",
  },
  {
    number: "03",
    title: "Solution",
    text: "Troco permet de publier un objet, découvrir ce qui circule autour de soi, proposer un échange et organiser une rencontre claire : disponibilités, lieu, validation et suivi.",
  },
  {
    number: "04",
    title: "Positionnement",
    text: "Troco se situe entre marketplace locale, application lifestyle et outil de rencontre autour des objets. Le produit se différencie par la proximité, les cafés partenaires, la négociation guidée et une identité visuelle douce et premium.",
  },
];

const LAUNCH_STEPS = [
  "Concentrer le lancement sur Paris pour créer de la densité.",
  "Tester les catégories d’objets les plus échangées.",
  "Créer des premiers échanges manuels et qualitatifs.",
  "Construire des partenariats avec des lieux de rencontre.",
  "Transformer les retours utilisateurs en produit plus fluide.",
];

export default function TrocoDossierPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(186,230,253,0.16),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(187,247,208,0.14),transparent_32%),linear-gradient(180deg,#fbfffd_0%,#f5fcf8_54%,#ffffff_100%)] px-5 py-8 text-[#081225]">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full border border-white/80 bg-white/76 px-4 text-sm font-black text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.045)] backdrop-blur-xl transition hover:bg-white"
          >
            ← Retour
          </Link>

          <p className="hidden rounded-full border border-white/80 bg-white/58 px-4 py-2 text-[12px] font-black uppercase tracking-[0.22em] text-[#0f9f9a] shadow-[0_8px_22px_rgba(15,23,42,0.035)] backdrop-blur-xl sm:block">
            Document discret
          </p>
        </div>

        <section className="relative mt-10 overflow-hidden rounded-[42px] border border-white/80 bg-white/76 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl md:p-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-emerald-100/80 shadow-[0_10px_28px_rgba(16,185,129,0.10)]">
                <span className="text-2xl">🐊</span>
              </div>
              <p className="text-[30px] font-black tracking-[-0.07em] text-slate-950">
                TROCO
              </p>
            </div>

            <p className="mt-8 text-[12px] font-black uppercase tracking-[0.26em] text-[#0f9f9a]">
              Vision produit
            </p>

            <h1 className="mt-4 max-w-3xl text-[46px] font-black leading-[0.92] tracking-[-0.065em] text-slate-950 md:text-[74px]">
              Une autre façon de faire circuler les objets.
            </h1>

            <p className="mt-6 max-w-2xl text-[18px] font-medium leading-relaxed text-slate-500">
              Troco est une application locale qui facilite les échanges d’objets et transforme le troc en expérience simple, guidée et humaine.
            </p>
          </div>

          <div className="relative z-10 mt-9 lg:mt-0">
            <div className="rounded-[38px] border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white/80 to-sky-50/80 p-5 shadow-[0_18px_54px_rgba(16,185,129,0.10)]">
              <div className="aspect-[4/5] rounded-[32px] bg-white/82 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.055)]">
                <div className="flex h-full flex-col justify-between rounded-[28px] bg-[linear-gradient(135deg,#d1fae5_0%,#ecfeff_100%)] p-6">
                  <div className="flex justify-end">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/78 text-3xl shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                      🐊
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.22em] text-emerald-700">
                      Autour de soi
                    </p>
                    <h2 className="mt-3 text-[34px] font-black leading-[0.94] tracking-[-0.055em] text-slate-950">
                      Des objets qui trouvent une seconde vie près de vous.
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <article
              key={section.number}
              className="rounded-[34px] border border-white/80 bg-white/72 p-6 shadow-[0_14px_42px_rgba(15,23,42,0.05)] backdrop-blur-xl"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0f9f9a]">
                {section.number}
              </p>
              <h2 className="mt-4 text-[30px] font-black tracking-[-0.05em] text-slate-950">
                {section.title}
              </h2>
              <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-600">
                {section.text}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[36px] border border-emerald-100/80 bg-emerald-50/58 p-6 shadow-[0_14px_42px_rgba(16,185,129,0.07)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
            Stratégie de lancement
          </p>
          <h2 className="mt-4 text-[34px] font-black leading-[0.96] tracking-[-0.055em] text-slate-950">
            Créer de la densité avant de grandir.
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {LAUNCH_STEPS.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-[24px] bg-white/72 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7EF] text-[13px] font-black text-[#0f9f9a]">
                  {index + 1}
                </div>
                <p className="pt-1 text-[14px] font-bold leading-relaxed text-slate-600">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

<section className="mt-6 overflow-hidden rounded-[38px] border border-white/80 bg-white/72 p-4 shadow-[0_14px_42px_rgba(15,23,42,0.05)] backdrop-blur-xl">
  <iframe
    src="https://gamma.app/embed/39c5d3l8j61c164"
    className="h-[450px] w-full rounded-[28px] border-0"
    allowFullScreen
    title="TROCO"
  />
</section>

        <footer className="py-10 text-center">
          <p className="text-[12px] font-semibold text-slate-400">
            Page volontairement discrète — accessible uniquement par lien.
          </p>
        </footer>
      </div>
    </main>
  );
}
