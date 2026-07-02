import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TrocoLogo from "../../components/TrocoLogo";
import TrocoFooter from "../../components/TrocoFooter";
import SEOMeta from "../../components/SEOMeta";

export default function QuestCeQueTrocoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans">
      <SEOMeta
        title="Qu'est-ce que Troco ? L'application de troc local"
        description="Troco est une application de troc local gratuite. Échangez des objets sans argent avec vos voisins, autour de chez vous."
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
          Qu'est-ce que Troco&nbsp;?
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
          Troco est une application de troc local, entièrement gratuite, qui permet d'échanger des
          objets entre particuliers sans argent, sans vente, et sans livraison. Vous proposez ce
          que vous n'utilisez plus, vous trouvez ce dont vous avez besoin, et vous vous retrouvez
          en personne pour échanger.
        </p>

        {/* Section Pourquoi Troco existe */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Pourquoi Troco existe
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Nos placards sont pleins d'objets qui ne servent plus. Une veste portée deux fois, des
            livres lus et posés sur l'étagère, un appareil photo rangé depuis le premier smartphone.
            Ces objets ont encore de la valeur — ils n'ont juste pas trouvé leur prochain
            utilisateur.
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Vendre prend du temps. Donner n'est pas toujours simple. Le troc, lui, remet l'échange
            au centre : deux personnes, deux objets, un accord équitable. Troco rend ça possible
            en quelques minutes, autour de chez vous.
          </p>
        </section>

        {/* Section Ce que Troco n'est pas */}
        <section className="mt-12 rounded-2xl border border-[#E4ECE8] bg-white p-7">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#081225]">
            Ce que Troco n'est pas
          </h2>
          <ul className="mt-4 space-y-3">
            {[
              "Troco n'est pas une application de vente — aucun prix, aucune transaction monétaire.",
              "Troco n'est pas un site de petites annonces comme Leboncoin ou Vinted.",
              "Troco n'est pas une plateforme de don — chaque échange est équilibré entre les deux parties.",
              "Troco ne propose pas de livraison — les échanges se font en main propre, localement.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#94A3B8]" />
                <span className="text-[15px] leading-relaxed text-[#64748B]">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section Ce que Troco est */}
        <section className="mt-10 rounded-2xl bg-gradient-to-br from-[#18BFAF]/10 to-[#2ECC8A]/10 p-7">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#081225]">
            Ce que Troco est
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Troco est une application de troc local entre voisins. Simple, humaine, gratuite. Vous
            publiez vos objets, vous parcourez ce que votre communauté locale propose, et vous
            proposez un échange directement avec la personne.
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            L'échange se fait en personne, dans un lieu public de votre choix. Pas de frais, pas de
            commission, pas d'intermédiaire.
          </p>
        </section>

        {/* Liens internes */}
        <nav className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/comment-ca-marche"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Comment ça marche ?
          </Link>
          <Link
            to="/troc-local-paris"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Troc local à Paris
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
            Commencer gratuitement
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <TrocoFooter />
    </div>
  );
}
