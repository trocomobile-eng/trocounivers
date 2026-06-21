import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

import TrocoLogo from "../components/TrocoLogo";
import TrocoFooter from "../components/TrocoFooter";

import mockup1 from "../assets/mockups/mockup-1.png";
import mockup2 from "../assets/mockups/mockup-2.png";
import mockup3 from "../assets/mockups/mockup-3.png";
import lampeVintageImg from "../assets/landing/lampe-vintage.png";
import livreAncienImg from "../assets/landing/livre-ancien.png";
import appareilPhotoImg from "../assets/landing/appareil-photo.png";
import community1 from "../assets/landing/community-1.png";
import community2 from "../assets/landing/community-2.png";
import community3 from "../assets/landing/community-3.png";
/* ─── Language switcher ──────────────────────────────────────── */
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "fr";
  function change(lang) {
    i18n.changeLanguage(lang);
    try { localStorage.setItem("troco-lang", lang); } catch {}
  }
  return (
    <div className="absolute right-5 top-8 z-40 flex items-center rounded-full border border-[#E4ECE8] bg-white/82 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.055)] backdrop-blur-xl lg:right-8 lg:top-8">
      {["fr", "en"].map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => change(lang)}
          className={[
            "rounded-full px-3.5 py-2 text-[12px] font-black uppercase tracking-[0.08em] transition",
            current === lang
              ? "bg-gradient-to-r from-[#22C7B8] to-[#36C982] text-white shadow-[0_8px_18px_rgba(45,212,191,0.22)]"
              : "text-slate-500 hover:text-[#0f9f9a]",
          ].join(" ")}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ─── iPhone mockup ──────────────────────────────────────────── */
function IPhoneMockup({ src, alt, className = "", front = false }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[2.7rem] border-[7px] border-slate-950 bg-slate-950",
        front ? "z-30 shadow-[0_38px_105px_rgba(15,23,42,0.22)]" : "z-10 shadow-[0_24px_70px_rgba(15,23,42,0.13)]",
        className,
      ].join(" ")}
    >
      <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
      <div className="aspect-[9/19.5] overflow-hidden rounded-[2.15rem] bg-white">
        <img src={src} alt={alt} className="h-full w-full bg-white object-cover object-center" draggable="false" />
      </div>
    </div>
  );
}

/* ─── Hero mockups (colonne droite) ─────────────────────────── */
function HeroMockups() {
  return (
    <div className="relative hidden min-h-[700px] items-center justify-center overflow-visible py-12 lg:flex">
      <div className="absolute h-[560px] w-[390px] rounded-full bg-white/80 blur-[115px]" />
      <div className="absolute left-[16%] top-[15%] h-[310px] w-[390px] rounded-full bg-cyan-100/70 blur-[110px]" />
      <div className="absolute bottom-[12%] right-[12%] h-[350px] w-[450px] rounded-full bg-emerald-100/75 blur-[120px]" />
      <div className="absolute right-[30%] top-[8%] h-[210px] w-[270px] rounded-full bg-teal-100/55 blur-[100px]" />
      <IPhoneMockup src={mockup1} alt="Aperçu Troco gauche" className="absolute left-[7%] top-[175px] w-[188px] rotate-[-10deg] opacity-95 xl:w-[210px]" />
      <IPhoneMockup src={mockup2} alt="Aperçu principal Troco" className="relative w-[260px] xl:w-[292px]" front />
      <IPhoneMockup src={mockup3} alt="Aperçu Troco droite" className="absolute right-[7%] top-[175px] w-[188px] rotate-[10deg] opacity-95 xl:w-[210px]" />
    </div>
  );
}

/* ─── Ticker ─────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Lampe vintage", "Vélo pliant", "Appareil photo", "Vinyles", "Livre ancien",
  "Tapis berbère", "Imprimante", "Guitare acoustique", "Veste en cuir", "Plante monstera",
  "Table basse", "Sneakers", "Cafetière Moka", "Encyclopédies", "Trépied photo",
];

function Ticker() {
  return (
    <div className="overflow-hidden border-y border-[#E4ECE8] bg-white py-4">
      <div className="flex animate-[ticker_30s_linear_infinite] items-center gap-8 whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-[13px] font-bold text-[#344256]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1ABEA3]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Trust strip ────────────────────────────────────────────── */
function TrustStrip() {
  const stats = [
    { number: "2 400+", label: "échanges réalisés" },
    { number: "4.9★", label: "note moyenne" },
    { number: "< 8 min", label: "pour trouver un match" },
  ];
  return (
    <section className="bg-white py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-0 px-5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center">
            <p className="bg-gradient-to-r from-[#1ABEA3] to-[#36C982] bg-clip-text text-[42px] font-black tracking-[-0.05em] text-transparent md:text-[58px]">
              {s.number}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#94a3b8]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Object stories ─────────────────────────────────────────── */
const STORIES = [
  {
    image: lampeVintageImg,
    object: "Lampe vintage",
    traded: "contre une plante monstera",
    quote: "Je l'avais depuis 3 ans. Elle méritait un meilleur endroit.",
    from: "Sophie, Bastille",
  },
  {
    image: livreAncienImg,
    object: "Collection Modiano",
    traded: "contre un vélo pliant",
    quote: "On s'est retrouvés au café d'en bas. On a bu un verre.",
    from: "Marc, Belleville",
  },
  {
    image: appareilPhotoImg,
    object: "Argentique Olympus",
    traded: "contre une veste en cuir",
    quote: "Elle cherchait exactement ça. Moi aussi.",
    from: "Léa, Invalides",
  },
];

function ObjectStories() {
  return (
    <section className="bg-[#F8FAF9] py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-14 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
              Ce qui circule en ce moment
            </p>
            <h2 className="mt-3 text-[36px] font-black leading-[1.0] tracking-[-0.05em] text-[#081225] md:text-[52px]">
              Derrière chaque objet,
              <br className="hidden md:block" /> une vraie histoire.
            </h2>
          </div>
          <p className="max-w-[320px] text-[15px] font-medium leading-relaxed text-[#64748B]">
            Des gens ordinaires. Des objets qui trouvent leur place. Dans le même quartier.
          </p>
        </div>

        {/* Offset grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STORIES.map((story, i) => (
            <article
              key={story.object}
              className={["group relative overflow-hidden rounded-[28px]", i === 1 ? "md:mt-8" : i === 2 ? "md:mt-4" : ""].join(" ")}
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={story.image}
                  alt={story.object}
                  className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04]"
                  draggable="false"
                />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071420]/85 via-[#071420]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#36C982]">
                  {story.traded}
                </p>
                <h3 className="mt-1 text-[22px] font-black tracking-[-0.03em] text-white">
                  {story.object}
                </h3>
                <p className="mt-2 text-[13.5px] font-medium italic leading-snug text-white/70">
                  "{story.quote}"
                </p>
                <p className="mt-2 text-[11px] font-bold text-white/45">— {story.from}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    title: "Tu proposes ce que tu n'utilises plus.",
    body: "Pas besoin d'estimer un prix. Pas de livraison, pas de frais. Tu décris l'objet, tu ajoutes une photo, c'est en ligne en 90 secondes.",
    img: community1,
  },
  {
    number: "02",
    title: "Quelqu'un de proche fait une proposition.",
    body: "Tu reçois une notification. Tu vois ce qu'il offre en échange. Si ça t'intéresse, vous entamez une conversation.",
    img: community2,
  },
  {
    number: "03",
    title: "Vous vous retrouvez. Vous échangez.",
    body: "Café du coin, entrée d'immeuble, marché du quartier. L'échange se fait en vrai, entre voisins.",
    img: community3,
  },
];

function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-16">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
            Comment ça marche
          </p>
          <h2 className="mt-3 text-[36px] font-black leading-[1.0] tracking-[-0.05em] text-[#081225] md:text-[52px]">
            Simple comme un bonjour.
          </h2>
        </div>

        <div className="flex flex-col gap-0">
          {STEPS.map((s, i) => (
            <div
              key={s.number}
              className={[
                "grid items-center gap-10 py-12 lg:grid-cols-2",
                i < STEPS.length - 1 ? "border-b border-[#E8EFF0]" : "",
                i % 2 === 1 ? "lg:[direction:rtl]" : "",
              ].join(" ")}
            >
              <div className={i % 2 === 1 ? "lg:[direction:ltr]" : ""}>
                <span className="bg-gradient-to-r from-[#1ABEA3] to-[#36C982] bg-clip-text text-[72px] font-black leading-none tracking-[-0.06em] text-transparent opacity-30 md:text-[96px]">
                  {s.number}
                </span>
                <h3 className="mt-2 text-[26px] font-black leading-[1.1] tracking-[-0.04em] text-[#081225] md:text-[32px]">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-[420px] text-[16px] font-medium leading-relaxed text-[#64748B]">
                  {s.body}
                </p>
              </div>
              <div className={["overflow-hidden rounded-[28px]", i % 2 === 1 ? "lg:[direction:ltr]" : ""].join(" ")}>
                <img
                  src={s.img}
                  alt={s.title}
                  className="aspect-[16/10] w-full object-cover object-center"
                  draggable="false"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "J'avais une planche à repasser qui prenait la poussière depuis deux ans. En 20 minutes j'avais un accord pour un abonnement yoga.",
    name: "Amélie R.",
    location: "Oberkampf, Paris 11e",
    initials: "AR",
    color: "from-teal-400 to-cyan-500",
  },
  {
    quote: "Ce qui m'a surpris : on s'est revus. Le gars avec qui j'ai échangé mon vélo habite à 200m. Maintenant on boit des cafés.",
    name: "Thomas D.",
    location: "Gambetta, Paris 20e",
    initials: "TD",
    color: "from-emerald-400 to-teal-500",
  },
  {
    quote: "C'est la première fois que je me débarrasse d'un objet sans culpabiliser. Je sais exactement où il est allé, et à qui.",
    name: "Clara M.",
    location: "Montparnasse, Paris 14e",
    initials: "CM",
    color: "from-cyan-400 to-emerald-400",
  },
];

function Testimonials() {
  return (
    <section className="bg-[#F8FAF9] py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
            Ils l'ont vécu
          </p>
          <h2 className="mx-auto mt-3 max-w-[500px] text-[36px] font-black leading-[1.0] tracking-[-0.05em] text-[#081225] md:text-[50px]">
            Ce que ça fait, vraiment.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="group flex flex-col rounded-[28px] bg-white p-7 shadow-[0_2px_20px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_36px_rgba(15,23,42,0.10)]"
            >
              <span className="mb-3 text-[48px] font-black leading-none text-[#1ABEA3]/20">"</span>
              <p className="flex-1 text-[16px] font-medium leading-relaxed text-[#344256]">
                {t.quote}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[12px] font-black text-white", t.color].join(" ")}>
                  {t.initials}
                </span>
                <div>
                  <p className="text-[13.5px] font-extrabold text-[#0d1b2a]">{t.name}</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">{t.location}</p>
                </div>
              </div>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Manifesto ──────────────────────────────────────────────── */
function Manifesto() {
  return (
    <section className="relative overflow-hidden bg-[#071420] py-24 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[5%] top-[20%] h-[350px] w-[350px] rounded-full bg-[#1ABEA3]/8 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[300px] w-[300px] rounded-full bg-[#36C982]/6 blur-[100px]" />
        {/* Graphic grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#1ABEA3 1px, transparent 1px), linear-gradient(90deg, #1ABEA3 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative mx-auto max-w-4xl px-5">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#1ABEA3]">
          Notre conviction
        </p>

        <h2 className="mx-auto mt-8 max-w-[760px] text-[40px] font-black leading-[1.0] tracking-[-0.05em] text-white md:text-[60px] lg:text-[72px]">
          La vraie richesse
          <br />
          ne se compte pas.
          <br />
          <span className="bg-gradient-to-r from-[#1ABEA3] to-[#36C982] bg-clip-text text-transparent">
            Elle se transmet.
          </span>
        </h2>

        <p className="mx-auto mt-8 max-w-[520px] text-[17px] font-medium leading-relaxed text-[#8EA8B8] md:text-[19px]">
          Dans nos villes, des milliers d'objets utiles dorment. Pas parce qu'ils n'ont plus de valeur — mais parce qu'ils n'ont pas encore trouvé la bonne personne.
        </p>

        <p className="mt-4 text-[14px] font-semibold text-[#1ABEA3]/70">
          Sans argent. Sans plateforme froide. Entre voisins.
        </p>
      </div>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────── */
function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0d8f7e] via-[#12B08A] to-[#1ABEA3] py-24 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-white/10 blur-[80px]" />
        <div className="absolute -right-20 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-white/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5">
        <h2 className="text-[40px] font-black leading-[1.0] tracking-[-0.05em] text-white md:text-[58px]">
          Ton quartier a sûrement
          <br />quelque chose pour toi.
        </h2>

        <p className="mx-auto mt-5 max-w-[400px] text-[17px] font-medium leading-relaxed text-white/75">
          Rejoins les membres qui échangent autour d'eux, sans argent, sans stress.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-[16px] font-black text-[#0d8f7e] shadow-[0_14px_40px_rgba(0,0,0,0.15)] transition hover:shadow-[0_18px_50px_rgba(0,0,0,0.20)] active:scale-[0.97]"
          >
            Commencer gratuitement
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
          <Link
            to="/login"
            className="inline-flex h-14 items-center rounded-full border border-white/30 bg-white/15 px-8 text-[15px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            J'ai déjà un compte
          </Link>
        </div>

        <p className="mt-6 text-[13px] font-medium text-white/55">
          Gratuit · Sans carte bancaire · 2 min pour commencer
        </p>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <main className="troco-landing-page relative min-h-screen overflow-x-hidden bg-[var(--troco-bg)] text-[#081225]">
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-8 h-[320px] w-[320px] rounded-full bg-cyan-100/30 blur-[115px]" />
        <div className="absolute -right-28 top-[320px] h-[380px] w-[380px] rounded-full bg-emerald-100/34 blur-[130px]" />
        <div className="absolute bottom-[18%] left-[18%] h-[280px] w-[280px] rounded-full bg-teal-100/26 blur-[115px]" />
      </div>

      <LanguageSwitcher />

      {/* Hero — grille 2 colonnes */}
      <section className="relative px-5 pb-12 pt-20 md:pb-20 md:pt-14">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-20 mx-auto w-full max-w-[410px] text-center lg:mx-0 lg:max-w-[420px] lg:text-left">
            <div className="mb-0 flex justify-center lg:mb-5 lg:justify-start">
              <div className="origin-center scale-[1.2] lg:origin-left lg:scale-[1.15]">
                <TrocoLogo size="l" />
              </div>
            </div>
            <h1 className="mx-auto mt-5 max-w-[380px] text-[40px] font-black leading-[0.96] tracking-[-0.06em] text-[#081225] sm:text-[54px] md:text-[52px] lg:mx-0">
              Échange avec
              <br />
              <span className="bg-gradient-to-r from-[#1ABEA3] to-[#36C982] bg-clip-text text-transparent">
                tes voisins.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-[370px] text-[18px] font-medium leading-relaxed text-[#64748B] md:text-[20px] lg:mx-0">
              Troqué des objets sans argent. Rencontré des gens à deux rues. Troco rend ça possible.
            </p>
            <div className="mx-auto mt-7 flex w-full max-w-[370px] flex-col gap-3 lg:mx-0 lg:max-w-none lg:flex-row">
              <button
                type="button"
                onClick={() => navigate("/onboarding")}
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-[#18BFAF] to-[#2ECC8A] px-7 py-3 text-[17px] font-black text-white shadow-[0_16px_38px_rgba(24,191,175,0.30)] ring-1 ring-white/50 transition active:scale-[0.98] lg:w-auto"
              >
                Commencer gratuitement
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
              <Link
                to="/login"
                className="inline-flex min-h-[54px] w-full items-center justify-center rounded-[22px] border border-[#E4ECE8] bg-white/80 px-7 text-[16px] font-bold text-[#344256] backdrop-blur-sm transition hover:bg-white lg:w-auto"
              >
                J'ai déjà un compte
              </Link>
            </div>
            {/* Social proof */}
            <div className="mx-auto mt-6 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-2">
                {[community1, community2, community3].map((src, i) => (
                  <img key={i} src={src} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                ))}
              </div>
              <p className="text-[13px] font-medium text-[#64748B]">
                <span className="font-extrabold text-[#081225]">2 400+</span> échanges à Paris
              </p>
            </div>
          </div>
          <HeroMockups />
        </div>
      </section>
      <Ticker />
      <TrustStrip />
      <ObjectStories />
      <HowItWorks />
      <Testimonials />
      <Manifesto />
      <FinalCTA />

      <div className="border-t border-[#E4ECE8] bg-white">
        <TrocoFooter />
      </div>
      <div className="bg-white pb-6 text-center">
        <Link to="/troco-dossier" className="text-[11px] font-semibold text-slate-300 transition hover:text-slate-400">
          Vision
        </Link>
      </div>
    </main>
  );
}
