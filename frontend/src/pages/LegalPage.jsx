import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PAGES = {
  cgu: {
    eyebrow: "CGU",
    title: "Conditions Générales d'Utilisation",
    sections: [
      {
        heading: "1. Présentation du service",
        text: "Troco est une plateforme permettant à des particuliers de proposer et d'organiser des échanges de biens matériels sans transaction monétaire. La plateforme a pour objectif de favoriser le réemploi, la réduction des déchets et les échanges de proximité.",
      },
      {
        heading: "2. Acceptation des conditions",
        text: "L'inscription et l'utilisation de Troco impliquent l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation.",
      },
      {
        heading: "3. Conditions d'inscription",
        text: "L'utilisateur s'engage à :",
        items: [
          "fournir des informations exactes ;",
          "ne créer qu'un seul compte personnel ;",
          "conserver la confidentialité de ses identifiants ;",
          "utiliser la plateforme de manière loyale.",
        ],
      },
      {
        heading: "4. Objets autorisés",
        text: "Peuvent être proposés à l'échange les biens matériels légalement détenus par leur propriétaire.",
      },
      {
        heading: "5. Objets interdits",
        text: "Sont notamment interdits :",
        items: [
          "armes et munitions ;",
          "produits dangereux ;",
          "médicaments ;",
          "alcool et tabac ;",
          "animaux ;",
          "contrefaçons ;",
          "contenus illicites ;",
          "objets volés ;",
          "tout objet dont la vente ou la cession est interdite par la loi.",
        ],
        note: "Troco se réserve le droit de supprimer toute annonce ne respectant pas ces règles.",
      },
      {
        heading: "6. Responsabilité des utilisateurs",
        text: "Chaque utilisateur est seul responsable :",
        items: [
          "des objets qu'il propose ;",
          "de leur description ;",
          "de leur état ;",
          "de la légalité de leur détention ;",
          "des échanges qu'il réalise.",
        ],
        note: "Les utilisateurs sont invités à vérifier les objets avant tout échange.",
      },
      {
        heading: "7. Rôle de Troco",
        text: "Troco agit exclusivement comme intermédiaire de mise en relation. Troco :",
        items: [
          "n'est pas propriétaire des objets proposés ;",
          "ne participe pas aux échanges ;",
          "ne garantit pas la qualité ou la conformité des objets ;",
          "ne garantit pas l'aboutissement d'un échange.",
        ],
      },
      {
        heading: "8. Rencontres entre utilisateurs",
        text: "Les échanges sont organisés librement entre utilisateurs. Il est recommandé :",
        items: [
          "de privilégier les lieux publics ;",
          "de vérifier l'identité de son interlocuteur ;",
          "de rester vigilant lors des rencontres.",
        ],
      },
      {
        heading: "9. Suspension ou suppression de compte",
        text: "Troco peut suspendre ou supprimer un compte en cas de :",
        items: [
          "non-respect des présentes CGU ;",
          "comportement frauduleux ;",
          "usurpation d'identité ;",
          "publication de contenus illicites ;",
          "atteinte à la sécurité de la plateforme.",
        ],
      },
      {
        heading: "10. Évolution du service",
        text: "Troco peut modifier ou faire évoluer ses fonctionnalités à tout moment afin d'améliorer le service.",
      },
      {
        heading: "11. Droit applicable",
        text: "Les présentes CGU sont soumises au droit français.",
      },
    ],
  },

  privacy: {
    eyebrow: "Confidentialité",
    title: "Politique de confidentialité",
    sections: [
      {
        heading: "1. Données collectées",
        text: "Lors de l'utilisation de Troco, les données suivantes peuvent être collectées :",
        items: [
          "adresse e-mail ;",
          "nom ou pseudonyme ;",
          "photo de profil ;",
          "localisation approximative ;",
          "objets publiés ;",
          "préférences de recherche ;",
          "historiques d'échanges ;",
          "données techniques de connexion.",
        ],
      },
      {
        heading: "2. Finalités",
        text: "Ces données sont utilisées pour :",
        items: [
          "créer et gérer le compte utilisateur ;",
          "permettre les échanges entre membres ;",
          "améliorer le fonctionnement de la plateforme ;",
          "assurer la sécurité du service ;",
          "prévenir les abus et la fraude.",
        ],
      },
      {
        heading: "3. Partage des données",
        text: "Les données personnelles ne sont ni vendues ni louées à des tiers. Certaines données peuvent être transmises à des prestataires techniques nécessaires au fonctionnement de Troco, notamment Firebase by Google.",
      },
      {
        heading: "4. Conservation",
        text: "Les données sont conservées pendant la durée d'utilisation du compte. L'utilisateur peut demander la suppression de son compte et de ses données associées.",
      },
      {
        heading: "5. Vos droits",
        text: "Conformément au RGPD, chaque utilisateur dispose des droits suivants :",
        items: [
          "accès ;",
          "rectification ;",
          "suppression ;",
          "limitation ;",
          "opposition ;",
          "portabilité.",
        ],
      },
      {
        heading: "6. Contact",
        text: "Pour toute question relative aux données personnelles : troco.mobile@gmail.com",
      },
      {
        heading: "7. Sécurité",
        text: "Troco met en œuvre des mesures raisonnables de sécurité afin de protéger les données des utilisateurs contre tout accès non autorisé.",
      },
    ],
  },

  mentions: {
    eyebrow: "Mentions légales",
    title: "Mentions légales",
    sections: [
      {
        heading: "Éditeur",
        text: "Troco est un projet indépendant à but non lucratif, en phase de prototype. Contact : troco.mobile@gmail.com",
      },
      {
        heading: "Hébergement",
        text: "L'application est hébergée par Google Firebase (Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis).",
      },
      {
        heading: "Propriété intellectuelle",
        text: "L'ensemble des contenus présents sur Troco (logo, textes, illustrations) sont la propriété exclusive de leurs auteurs. Toute reproduction sans autorisation est interdite.",
      },
      {
        heading: "Données personnelles",
        text: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits : troco.mobile@gmail.com",
      },
      {
        heading: "Limitation de responsabilité",
        text: "Troco ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du service, des échanges effectués entre utilisateurs ou de l'inexactitude des informations publiées.",
      },
      {
        heading: "Droit applicable",
        text: "Les présentes mentions légales sont régies par le droit français. Tout litige sera soumis aux juridictions compétentes.",
      },
    ],
  },
};

function Section({ section }) {
  return (
    <div className="mt-6">
      <h2 className="text-[17px] font-black tracking-[-0.03em] text-[#081225]">
        {section.heading}
      </h2>
      {section.text && (
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#64748b]">
          {section.text}
        </p>
      )}
      {section.items && (
        <ul className="mt-2 space-y-1 pl-4">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] font-medium leading-relaxed text-[#64748b]">
              <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1ABEA3]" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.note && (
        <p className="mt-3 rounded-[14px] bg-[#F0FAF7] px-4 py-2.5 text-[13px] font-semibold text-[#0f9f9a]">
          {section.note}
        </p>
      )}
    </div>
  );
}

export default function LegalPage({ type = "cgu" }) {
  const page = PAGES[type] || PAGES.cgu;

  return (
    <div className="min-h-screen bg-[var(--troco-bg)] text-[#081225]">
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-8 lg:px-8 lg:pt-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E4ECE8] bg-white px-4 py-2 text-[13px] font-black text-[#081225] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition hover:text-[#1ABEA3]"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          Retour
        </Link>

        <div className="rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:p-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">
            {page.eyebrow}
          </p>
          <h1 className="mt-3 text-[32px] font-black leading-[0.96] tracking-[-0.05em] lg:text-[48px]">
            {page.title}
          </h1>

          <div className="mt-2 h-px bg-[#E4ECE8]" />

          <div className="divide-y divide-[#F0F5F3]">
            {page.sections.map((section, i) => (
              <Section key={i} section={section} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-[#E4ECE8] pt-6">
            {type !== "cgu" && (
              <Link to="/terms" className="text-[13px] font-bold text-[#1ABEA3] hover:underline">
                CGU
              </Link>
            )}
            {type !== "privacy" && (
              <Link to="/privacy" className="text-[13px] font-bold text-[#1ABEA3] hover:underline">
                Confidentialité
              </Link>
            )}
            {type !== "mentions" && (
              <Link to="/mentions" className="text-[13px] font-bold text-[#1ABEA3] hover:underline">
                Mentions légales
              </Link>
            )}
            <a href="mailto:troco.mobile@gmail.com" className="text-[13px] font-bold text-slate-400 hover:text-[#1ABEA3]">
              troco.mobile@gmail.com
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
