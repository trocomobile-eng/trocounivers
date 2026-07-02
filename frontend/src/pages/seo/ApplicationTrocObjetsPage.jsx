import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TrocoLogo from "../../components/TrocoLogo";
import TrocoFooter from "../../components/TrocoFooter";
import SEOMeta from "../../components/SEOMeta";

const CATEGORIES = [
  { emoji: "👕", label: "Mode & vêtements" },
  { emoji: "📚", label: "Livres & BD" },
  { emoji: "🎸", label: "Instruments de musique" },
  { emoji: "🎲", label: "Jeux & jouets" },
  { emoji: "🖼️", label: "Déco & mobilier" },
  { emoji: "📱", label: "Électronique" },
  { emoji: "🌿", label: "Plantes" },
  { emoji: "⚽", label: "Sport & loisirs" },
  { emoji: "🍳", label: "Cuisine & électroménager" },
  { emoji: "🎨", label: "Art & créativité" },
];

export default function ApplicationTrocObjetsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans">
      <SEOMeta
        title="Application de troc d'objets — Échangez sans argent avec Troco"
        description="Troco est l'application de troc d'objets entre particuliers. Échangez sans argent, sans livraison, autour de chez vous. Simple, local, durable."
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
          Une application de troc pour échanger des objets sans argent
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
          Troco n'est pas une application de vente. L'objectif n'est pas de fixer un prix, mais de
          proposer un échange équilibré entre deux personnes. Vous avez quelque chose à donner,
          quelqu'un d'autre a quelque chose qui vous intéresse — vous vous retrouvez pour échanger.
        </p>

        {/* Section pourquoi échanger */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Pourquoi échanger plutôt que vendre&nbsp;?
          </h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#E4ECE8] bg-white p-6">
              <h3 className="text-[16px] font-black text-[#081225]">L'argent complique tout</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                Fixer un prix, négocier, attendre un virement, gérer des acheteurs qui ne se
                présentent pas. Vendre un objet d'occasion prend du temps et génère des frictions.
                Le troc supprime ces étapes : deux personnes, deux objets, un accord.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E4ECE8] bg-white p-6">
              <h3 className="text-[16px] font-black text-[#081225]">
                Le troc remet la simplicité au centre
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                Quand on échange sans argent, la valeur d'un objet devient subjective et humaine.
                Ce qui ne vous sert plus a peut-être exactement la valeur de ce dont votre voisin
                veut se séparer. C'est ce que Troco facilite.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E4ECE8] bg-white p-6">
              <h3 className="text-[16px] font-black text-[#081225]">Un geste durable</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                Chaque échange Troco, c'est un objet qui ne finit pas à la déchetterie et un autre
                qui n'a pas besoin d'être acheté neuf. Une logique d'économie circulaire, locale et
                sans friction.
              </p>
            </div>
          </div>
        </section>

        {/* Section catégories */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Quelles catégories d'objets&nbsp;?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Troco couvre un large spectre d'objets du quotidien. Tout ce qui peut se transporter
            et changer de main est le bienvenu.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-3 rounded-xl border border-[#E4ECE8] bg-white px-4 py-3"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[14px] font-semibold text-[#334155]">{cat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section disponible sur */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-[#18BFAF]/10 to-[#2ECC8A]/10 p-7">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#081225]">
            Disponible sur web, iOS et Android
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Troco est accessible depuis votre navigateur sur{" "}
            <a href="https://www.troco.app" className="font-semibold text-[#0f9f9a] hover:underline">
              troco.app
            </a>
            , et bientôt disponible sur l'App Store et Google Play. Aucune installation n'est
            nécessaire pour commencer — inscrivez-vous directement en ligne.
          </p>
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
            to="/troco-vs-vinted-leboncoin-geev"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Troco vs Vinted, Leboncoin, Geev
          </Link>
        </nav>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-[#18BFAF] to-[#2ECC8A] px-8 py-4 text-[17px] font-black text-white shadow-[0_16px_38px_rgba(24,191,175,0.28)] transition active:scale-[0.98]"
          >
            Commencer gratuitement
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <TrocoFooter />
    </div>
  );
}
