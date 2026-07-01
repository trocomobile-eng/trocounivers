import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TrocoLogo from "../../components/TrocoLogo";
import TrocoFooter from "../../components/TrocoFooter";
import SEOMeta from "../../components/SEOMeta";

const AVANTAGES = [
  {
    title: "Pas de négociation de prix",
    description:
      "La valeur d'un objet n'est plus fixée en euros mais par ce que chacun est prêt à proposer. L'échange devient une conversation, pas une transaction.",
  },
  {
    title: "Pas de livraison",
    description:
      "Vous vous retrouvez en personne, dans un lieu public près de chez vous. Rapide, simple, sans frais d'expédition ni risque de perte.",
  },
  {
    title: "Une rencontre locale",
    description:
      "Troquer avec un voisin, c'est aussi tisser un lien avec sa communauté locale. Chaque échange Troco est une petite rencontre humaine.",
  },
  {
    title: "Un geste durable",
    description:
      "Moins d'achats neufs, moins de déchets, moins de gaspillage. Chaque échange prolonge la vie d'un objet et évite un achat inutile.",
  },
  {
    title: "100% gratuit",
    description:
      "Troco ne prend aucune commission, ne propose aucun abonnement payant. L'application est entièrement gratuite, pour toujours.",
  },
];

export default function EchangerSansArgentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans">
      <SEOMeta
        title="Échanger des objets sans argent — Une autre façon de consommer"
        description="Troco propose une alternative à l'achat et à la vente : échanger des objets sans argent, entre voisins, localement. Simple, humain, durable."
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
          Échanger des objets sans argent
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
          Acheter n'est pas toujours nécessaire. Parfois, quelqu'un autour de vous a exactement ce
          dont vous avez besoin — et vous avez peut-être ce qu'il cherche. L'échange sans argent,
          c'est cette idée simple que l'économie peut fonctionner sans monnaie, par la réciprocité.
        </p>

        {/* Section philosophie */}
        <section className="mt-10 rounded-2xl bg-gradient-to-br from-[#18BFAF]/10 to-[#2ECC8A]/10 p-7">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#081225]">
            Une autre façon de consommer
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Nous consommons souvent par habitude plutôt que par nécessité. Un besoin ponctuel
            devient un achat, l'objet est utilisé quelques fois, puis oublié dans un placard.
            L'échange sans argent propose une alternative : avant d'acheter, cherchez si quelqu'un
            près de chez vous ne possède pas déjà ce que vous cherchez — et si vous n'avez pas
            quelque chose à lui proposer en retour.
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Ce n'est pas du don. Ce n'est pas de la vente. C'est du troc — la forme d'échange la
            plus ancienne et, d'une certaine façon, la plus honnête.
          </p>
        </section>

        {/* Section comment ça marche */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Comment ça marche concrètement
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Avec Troco, échanger sans argent est aussi simple que d'envoyer un message. Vous
            publiez vos objets, vous proposez un échange à quelqu'un dont l'objet vous intéresse,
            et vous vous retrouvez dans un lieu public pour concrétiser l'échange.
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-[#64748B]">
            Toutes les étapes sont détaillées ici&nbsp;:{" "}
            <Link to="/comment-ca-marche" className="font-semibold text-[#0f9f9a] hover:underline">
              Comment fonctionne Troco
            </Link>
            .
          </p>
        </section>

        {/* Section avantages */}
        <section className="mt-12">
          <h2 className="text-[24px] font-black tracking-[-0.03em] text-[#081225]">
            Les avantages de l'échange sans argent
          </h2>
          <div className="mt-5 space-y-4">
            {AVANTAGES.map((av) => (
              <div
                key={av.title}
                className="rounded-2xl border border-[#E4ECE8] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
              >
                <h3 className="text-[16px] font-black text-[#081225]">{av.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">{av.description}</p>
              </div>
            ))}
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
            onClick={() => navigate("/onboarding")}
            className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-[#18BFAF] to-[#2ECC8A] px-8 py-4 text-[17px] font-black text-white shadow-[0_16px_38px_rgba(24,191,175,0.28)] transition active:scale-[0.98]"
          >
            Commencer à troquer
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <TrocoFooter />
    </div>
  );
}
