import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TrocoLogo from "../../components/TrocoLogo";
import TrocoFooter from "../../components/TrocoFooter";
import SEOMeta from "../../components/SEOMeta";

const CATEGORIES = [
  "Vêtements et accessoires",
  "Livres et BD",
  "Instruments de musique",
  "Jeux de société et jouets",
  "Décoration et art",
  "Petits électroménagers",
  "Matériel sportif",
  "Plantes",
  "Électronique et high-tech",
  "Mobilier",
];

export default function TrocLocalParisPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans">
      <SEOMeta
        title="Troc local à Paris — Échangez vos objets autour de vous"
        description="À Paris, échangez vos objets sans argent avec Troco. Vêtements, livres, instruments, déco : trouvez des objets près de chez vous et proposez un troc simple."
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
          Troc local à Paris
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
          À Paris, les appartements sont petits et les placards débordent. Des milliers d'objets
          dorment, inutilisés, alors qu'ils pourraient trouver une nouvelle vie chez quelqu'un
          d'autre. Troco permet de les faire circuler autrement — sans argent, sans livraison,
          entre Parisiens.
        </p>

        {/* Section catégories */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Quels objets peut-on troquer à Paris&nbsp;?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Tout ce qui peut se transporter à pied ou en métro est trocanle. Les utilisateurs
            parisiens échangent principalement&nbsp;:
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="rounded-xl border border-[#E4ECE8] bg-white px-4 py-3 text-[14px] font-semibold text-[#334155]"
              >
                {cat}
              </div>
            ))}
          </div>
        </section>

        {/* Section pourquoi Paris */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Pourquoi commencer par Paris&nbsp;?
          </h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#E4ECE8] bg-white p-6">
              <h3 className="text-[16px] font-black text-[#081225]">Une densité unique</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                Paris regroupe plus de 2 millions d'habitants dans 105 km². Plus vous êtes nombreux
                dans un périmètre réduit, plus les échanges sont rapides et faciles à organiser.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E4ECE8] bg-white p-6">
              <h3 className="text-[16px] font-black text-[#081225]">Une culture de l'échange</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                Paris a une longue tradition de marchés aux puces, de vide-greniers et d'économie
                de partage. Troco s'inscrit dans cette logique, avec la simplicité d'une application
                mobile.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E4ECE8] bg-white p-6">
              <h3 className="text-[16px] font-black text-[#081225]">Une communauté engagée</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">
                Les premiers utilisateurs Troco sont majoritairement parisiens. La communauté
                grandit arrondissement par arrondissement, créant un réseau d'échange de plus en
                plus riche.
              </p>
            </div>
          </div>
        </section>

        {/* Section autres villes */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-[#18BFAF]/10 to-[#2ECC8A]/10 p-7">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#081225]">
            Troco dans d'autres villes
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Paris est le point de départ, mais Troco est disponible partout en France. Lyon,
            Marseille, Bordeaux, Lille, Nantes, Toulouse — la communauté se développe dans toutes
            les grandes villes. Si vous n'êtes pas à Paris, vous pouvez tout à fait utiliser
            Troco : l'application affiche en priorité les objets proches de votre position.
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
            Rejoindre la communauté
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <TrocoFooter />
    </div>
  );
}
