import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TrocoLogo from "../../components/TrocoLogo";
import TrocoFooter from "../../components/TrocoFooter";
import SEOMeta from "../../components/SEOMeta";

const COMPARAISON = [
  {
    name: "Troco",
    tag: "Troc local",
    highlight: true,
    argent: false,
    livraison: false,
    don: false,
    local: true,
    description:
      "Échange d'objets sans argent, entre particuliers, en main propre. L'équilibre entre les deux parties est au cœur de chaque troc.",
  },
  {
    name: "Vinted",
    tag: "Vente de vêtements",
    highlight: false,
    argent: true,
    livraison: true,
    don: false,
    local: false,
    description:
      "Application de vente et d'achat de vêtements entre particuliers. Les transactions se font avec de l'argent, souvent avec livraison.",
  },
  {
    name: "Leboncoin",
    tag: "Petites annonces",
    highlight: false,
    argent: true,
    livraison: true,
    don: false,
    local: false,
    description:
      "Site de petites annonces généraliste. Vente et achat d'objets, de véhicules, d'immobilier. Transactions monétaires, rencontres en personne ou livraison.",
  },
  {
    name: "Geev",
    tag: "Don d'objets",
    highlight: false,
    argent: false,
    livraison: false,
    don: true,
    local: true,
    description:
      "Application de don d'objets entre particuliers. Les objets sont cédés gratuitement, sans contrepartie — ce n'est pas un échange équilibré.",
  },
];

function CheckIcon({ value }) {
  return (
    <span
      className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-black",
        value
          ? "bg-[#18BFAF]/15 text-[#0f9f9a]"
          : "bg-slate-100 text-slate-400",
      ].join(" ")}
    >
      {value ? "✓" : "✗"}
    </span>
  );
}

export default function TrocoVsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans">
      <SEOMeta
        title="Troco vs Vinted, Leboncoin, Geev — Quelles différences ?"
        description="Troco n'est pas une application de vente. Découvrez comment Troco se distingue de Vinted, Leboncoin et Geev : troc local, sans argent, entre particuliers."
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E4ECE8] bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center">
          <TrocoLogo to="/" widthClass="w-[120px]" />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">

        <h1 className="text-[36px] font-black leading-tight tracking-[-0.04em] text-[#081225] sm:text-[44px]">
          Troco, Vinted, Leboncoin, Geev&nbsp;: quelles différences&nbsp;?
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
          Il existe aujourd'hui plusieurs façons de se séparer d'un objet ou d'en trouver un
          d'occasion. Vente, don, troc — chaque approche répond à un besoin différent. Voici ce
          qui distingue Troco des autres applications disponibles en France.
        </p>

        {/* Tableau comparatif */}
        <section className="mt-10 space-y-4">
          {COMPARAISON.map((app) => (
            <div
              key={app.name}
              className={[
                "rounded-2xl border p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)]",
                app.highlight
                  ? "border-[#18BFAF]/40 bg-gradient-to-br from-[#18BFAF]/8 to-[#2ECC8A]/8"
                  : "border-[#E4ECE8] bg-white",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[20px] font-black text-[#081225]">{app.name}</span>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[12px] font-black",
                        app.highlight
                          ? "bg-[#18BFAF]/15 text-[#0f9f9a]"
                          : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {app.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                    {app.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <CheckIcon value={!app.argent} />
                  <span className="text-[13px] font-semibold text-[#64748B]">Sans argent</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon value={!app.livraison} />
                  <span className="text-[13px] font-semibold text-[#64748B]">Sans livraison</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon value={!app.don} />
                  <span className="text-[13px] font-semibold text-[#64748B]">Échange équilibré</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon value={app.local} />
                  <span className="text-[13px] font-semibold text-[#64748B]">Ancré localement</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Section pourquoi Troco */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-[#18BFAF]/10 to-[#2ECC8A]/10 p-7">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#081225]">
            Pourquoi choisir Troco&nbsp;?
          </h2>
          <div className="mt-4 space-y-3">
            <p className="text-[16px] leading-relaxed text-[#64748B]">
              <strong className="font-black text-[#081225]">L'échange équilibré.</strong> Avec
              Troco, les deux parties proposent quelque chose. Ce n'est pas un don, et il n'y a pas
              de prix à fixer. Les deux personnes repartent avec quelque chose qui a de la valeur
              pour elles.
            </p>
            <p className="text-[16px] leading-relaxed text-[#64748B]">
              <strong className="font-black text-[#081225]">La rencontre locale.</strong> Chaque
              échange se fait en personne, dans votre quartier ou votre ville. C'est un moment
              humain, pas une transaction anonyme.
            </p>
            <p className="text-[16px] leading-relaxed text-[#64748B]">
              <strong className="font-black text-[#081225]">La communauté.</strong> Troco grandit
              autour d'une communauté de personnes qui partagent la même envie de consommer
              différemment — localement, simplement, sans gaspillage.
            </p>
          </div>
        </section>

        {/* Liens internes */}
        <nav className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/quest-ce-que-troco"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Qu'est-ce que Troco ?
          </Link>
          <Link
            to="/comment-ca-marche"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Comment ça marche ?
          </Link>
          <Link
            to="/echanger-sans-argent"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Échanger sans argent
          </Link>
          <Link
            to="/application-troc-objets"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Application de troc d'objets
          </Link>
        </nav>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-[#18BFAF] to-[#2ECC8A] px-8 py-4 text-[17px] font-black text-white shadow-[0_16px_38px_rgba(24,191,175,0.28)] transition active:scale-[0.98]"
          >
            Essayer Troco gratuitement
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <TrocoFooter />
    </div>
  );
}
