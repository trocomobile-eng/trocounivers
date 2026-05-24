import { Mail, ShieldCheck } from "lucide-react";

const CONTENT = {
  about: {
    eyebrow: "À propos",
    title: "Troco remet les objets en circulation.",
    body:
      "Troco est une application de troc locale pensée pour donner une seconde vie aux objets. L’objectif est simple : échanger sans argent, rencontrer des personnes proches de chez soi et rendre les échanges plus humains.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Une question ? Écris-nous.",
    body:
      "Pour contacter Troco, envoie un message à troco.mobile@gmail.com. Nous reviendrons vers toi dès que possible.",
  },
  safety: {
    eyebrow: "Sécurité",
    title: "Échanger dans un cadre rassurant.",
    body:
      "Privilégie les lieux publics, vérifie l’objet avant l’échange, évite les rendez-vous isolés et utilise les cafés partenaires lorsque c’est possible.",
  },
  privacy: {
    eyebrow: "Confidentialité",
    title: "Tes informations doivent rester utiles et protégées.",
    body:
      "Les informations personnelles servent uniquement au fonctionnement de l’application. Le téléphone n’est utilisé que pour faciliter une rencontre confirmée entre deux personnes.",
  },
  terms: {
    eyebrow: "CGU",
    title: "Conditions générales d’utilisation.",
    body:
      "Troco est un service de mise en relation pour échanges non monétaires. Chaque utilisateur reste responsable des objets qu’il publie, des informations qu’il partage et du bon déroulement de ses rencontres.",
  },
};

export default function InfoPage({ type = "about" }) {
  const page = CONTENT[type] || CONTENT.about;

  return (
    <div className="troco-page-bg min-h-screen text-[#081225]">
      <main className="mx-auto w-full max-w-4xl px-5 py-10 lg:px-8 lg:py-16">
        <section className="rounded-[36px] border border-white/80 bg-white/75 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.045)] backdrop-blur-xl lg:p-10">
          <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">
            {page.eyebrow}
          </p>

          <h1 className="mt-4 text-[42px] font-black leading-[0.95] tracking-[-0.055em] lg:text-[64px]">
            {page.title}
          </h1>

          <p className="mt-6 max-w-2xl text-[17px] font-medium leading-relaxed text-[#64748B]">
            {page.body}
          </p>

          {type === "contact" && (
            <a
              href="mailto:troco.mobile@gmail.com"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ECC8A] to-cyan-400 px-5 py-3 text-sm font-black text-white"
            >
              <Mail size={18} />
              troco.mobile@gmail.com
            </a>
          )}

          {type === "safety" && (
            <div className="mt-8 rounded-[28px] bg-[#E8F7EF] p-5 text-[#0f9f9a]">
              <div className="flex items-center gap-3">
                <ShieldCheck size={22} />
                <p className="font-black">Conseil Troco</p>
              </div>

              <p className="mt-2 text-sm font-semibold leading-relaxed">
                Pour le prototype, les cafés partenaires sont simulés, mais l’intention produit est de créer des lieux de rencontre plus rassurants.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
