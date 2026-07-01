import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TrocoLogo from "../../components/TrocoLogo";
import TrocoFooter from "../../components/TrocoFooter";
import SEOMeta from "../../components/SEOMeta";

const STEPS = [
  {
    number: "1",
    title: "Créez votre compte gratuitement",
    description:
      "Inscrivez-vous en quelques secondes avec votre adresse email. Aucune carte bancaire, aucun abonnement. Troco est 100% gratuit.",
  },
  {
    number: "2",
    title: "Publiez un objet que vous n'utilisez plus",
    description:
      "Ajoutez une photo, une description, choisissez une catégorie. En deux minutes, votre objet est visible par les utilisateurs autour de chez vous.",
  },
  {
    number: "3",
    title: "Découvrez les objets disponibles autour de vous",
    description:
      "Parcourez le fil d'objets proposés près de chez vous. Vêtements, livres, instruments, déco, électronique — chaque utilisateur a ses propres trésors à proposer.",
  },
  {
    number: "4",
    title: "Proposez un échange sans argent",
    description:
      "Vous avez trouvé un objet qui vous intéresse ? Proposez un ou plusieurs de vos objets en échange. L'autre personne peut accepter, ajuster ou décliner.",
  },
  {
    number: "5",
    title: "Rencontrez-vous localement pour échanger",
    description:
      "Une fois le troc accepté, choisissez ensemble un lieu public et un créneau. Vous vous retrouvez, vous échangez vos objets — c'est aussi simple que ça.",
  },
];

export default function CommentCaMarchePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans">
      <SEOMeta
        title="Comment fonctionne Troco ? — Application de troc local"
        description="Découvrez comment fonctionne Troco en 5 étapes simples : publiez un objet, découvrez les objets autour de vous, proposez un échange sans argent."
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
          Comment fonctionne Troco&nbsp;?
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
          Troco fonctionne en 5 étapes simples. De la publication de votre objet à la rencontre
          physique pour l'échange — tout est conçu pour être le plus fluide possible.
        </p>

        {/* Steps */}
        <div className="mt-10 space-y-4">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex gap-5 rounded-2xl border border-[#E4ECE8] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#18BFAF] to-[#2ECC8A] text-[15px] font-black text-white">
                {step.number}
              </div>
              <div>
                <h2 className="text-[17px] font-black text-[#081225]">{step.title}</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#64748B]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-[#18BFAF]/10 to-[#2ECC8A]/10 p-6">
          <p className="text-[15px] font-semibold leading-relaxed text-[#0f9f9a]">
            Troco est disponible sur le web, iOS et Android. Aucune livraison, aucun paiement —
            juste deux personnes qui se retrouvent pour échanger des objets.
          </p>
        </div>

        {/* Liens internes */}
        <nav className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/quest-ce-que-troco"
            className="rounded-full border border-[#E4ECE8] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0f9f9a] transition hover:border-[#18BFAF] hover:shadow-sm"
          >
            Qu'est-ce que Troco ?
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
            onClick={() => navigate("/onboarding")}
            className="inline-flex items-center gap-2 rounded-[22px] bg-gradient-to-r from-[#18BFAF] to-[#2ECC8A] px-8 py-4 text-[17px] font-black text-white shadow-[0_16px_38px_rgba(24,191,175,0.28)] transition active:scale-[0.98]"
          >
            Essayer gratuitement
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </main>

      <TrocoFooter />
    </div>
  );
}
