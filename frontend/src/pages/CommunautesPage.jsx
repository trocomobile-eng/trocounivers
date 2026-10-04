import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { COMMUNAUTES } from "../data/communautes";

// Compteurs de membres par communauté
const MEMBERS = {
  musique: "12,4k",
  velo: "8,7k",
  deco: "9,1k",
  mode: "11,3k",
  livres: "14,2k",
  jeux: "6,8k",
  photo: "7,2k",
  maison: "15,2k",
  sport: "10,9k",
  enfants: "13,1k",
};

const HERO_CHIPS = [
  { label: "Musique", emoji: "🎵" },
  { label: "Vélo", emoji: "🚲" },
  { label: "Maison", emoji: "🏠" },
  { label: "Lecture", emoji: "📚" },
  { label: "Jardin", emoji: "🌿" },
  { label: "et plus", emoji: "···" },
];

// Petits cercles avatars placeholder (4 teintes de l'accent)
function MemberAvatars({ accent }) {
  const shades = ["CC", "AA", "88", "66"];
  return (
    <div className="flex -space-x-1.5">
      {shades.map((s, i) => (
        <div
          key={i}
          className="h-[18px] w-[18px] rounded-full border-2 border-white"
          style={{ background: `${accent}${s}` }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO DESKTOP
───────────────────────────────────────────── */
function DesktopHero() {
  const imgMusique = COMMUNAUTES[0].img;
  const imgVelo    = COMMUNAUTES[1].img;
  const imgDeco    = COMMUNAUTES[2].img;
  const imgLivres  = COMMUNAUTES[4].img;

  return (
    <section
      className="relative overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      style={{ height: "318px", background: "#1c3028" }}
    >
      {/* ── Collage 4 panneaux diagonaux ── */}
      <div className="absolute inset-0">
        {/* Panel 1 — Musique */}
        <div
          className="absolute inset-y-0 left-0"
          style={{ right: "40%", clipPath: "polygon(0 0, 100% 0, calc(100% - 48px) 100%, 0 100%)" }}
        >
          <img src={imgMusique} alt="" className="h-full w-full object-cover object-center" style={{ filter: "brightness(1.35) saturate(1.15)" }} />
        </div>
        {/* Panel 2 — Vélo */}
        <div
          className="absolute inset-y-0"
          style={{ left: "52%", right: "24%", clipPath: "polygon(48px 0, 100% 0, calc(100% - 48px) 100%, 0 100%)" }}
        >
          <img src={imgVelo} alt="" className="h-full w-full object-cover object-center" style={{ filter: "brightness(1.25) saturate(1.1)" }} />
        </div>
        {/* Panel 3 — Déco */}
        <div
          className="absolute inset-y-0"
          style={{ left: "68%", right: "9%", clipPath: "polygon(48px 0, 100% 0, calc(100% - 48px) 100%, 0 100%)" }}
        >
          <img src={imgDeco} alt="" className="h-full w-full object-cover object-center" style={{ filter: "brightness(1.2)" }} />
        </div>
        {/* Panel 4 — Livres */}
        <div
          className="absolute inset-y-0 right-0"
          style={{ left: "84%", clipPath: "polygon(48px 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <img src={imgLivres} alt="" className="h-full w-full object-cover object-right" style={{ filter: "brightness(1.2)" }} />
        </div>
      </div>

      {/* Gradient texte — léger, juste pour la lisibilité */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,22,32,0.68) 0%, rgba(8,22,32,0.42) 24%, rgba(8,22,32,0.08) 48%, rgba(8,22,32,0) 62%)",
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex h-full flex-col px-8 py-6">
        {/* Bouton retour */}
        <div>
          <Link
            to="/feed"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/20 active:scale-95"
            style={{ background: "rgba(7,21,30,0.50)", backdropFilter: "blur(12px)" }}
            aria-label="Retour"
          >
            <ArrowLeft size={15} />
          </Link>
        </div>

        {/* Texte centré verticalement dans l'espace restant */}
        <div className="mt-auto max-w-[520px] pb-2">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
            Explorer
          </p>
          <h1 className="text-[56px] font-black leading-[0.90] tracking-[-0.065em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
            Communautés
          </h1>
          <p className="mt-3 max-w-[460px] text-[16.5px] font-medium leading-relaxed text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.50)]" style={{ opacity: 0.82 }}>
            Découvre les objets et les personnes autour de tes centres d'intérêt.
          </p>
          {/* Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {HERO_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12px] font-semibold text-white"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
              >
                <span className="text-[11px] leading-none">{chip.emoji}</span>
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CARTE COMMUNAUTÉ DESKTOP
───────────────────────────────────────────── */
function DesktopCommunauteRow({ communaute, onClick }) {
  const members = MEMBERS[communaute.id] || "5k+";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-[156px] w-full overflow-hidden rounded-[20px] bg-white text-left shadow-[0_2px_10px_rgba(15,23,42,0.055)] transition hover:-translate-y-[2px] hover:shadow-[0_10px_32px_rgba(15,23,42,0.10)] active:scale-[0.995]"
      style={{ border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {/* ── Image droite avec fondu blanc ── */}
      <div className="absolute inset-y-0 right-0 w-[38%] overflow-hidden">
        <img
          src={communaute.img}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        {/* Fondu blanc de gauche vers droite */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.88) 18%, rgba(255,255,255,0.40) 42%, rgba(255,255,255,0) 65%)",
          }}
        />
      </div>

      {/* ── Contenu gauche ── */}
      <div className="relative z-10 flex h-full w-[62%] items-center gap-5 px-6">
        {/* Icône ronde */}
        <div
          className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full"
          style={{ background: `${communaute.accent}1C` }}
        >
          <span className="text-[26px] leading-none">{communaute.emoji}</span>
        </div>

        {/* Texte */}
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-black leading-tight tracking-[-0.045em] text-[#0d1b2a]">
            {communaute.label}
          </h2>
          <p className="mt-0.5 text-[13px] font-bold leading-snug text-slate-700">
            {communaute.tagline}
          </p>
          <p className="mt-1 line-clamp-1 text-[12px] font-medium leading-snug text-slate-400">
            {communaute.description}
          </p>
          {/* Membres */}
          <div className="mt-2.5 flex items-center gap-2">
            <MemberAvatars accent={communaute.accent} />
            <span className="text-[11.5px] font-semibold text-slate-400">
              {members} membres
            </span>
          </div>
        </div>

        {/* Bouton Explorer */}
        <div
          className="ml-2 shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold transition group-hover:bg-[#167a58] group-hover:text-white"
          style={{ background: "#eaf6f1", color: "#167a58" }}
        >
          Explorer
          <ArrowRight size={13} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   CARTE COMMUNAUTÉ MOBILE
───────────────────────────────────────────── */
function MobileCommunauteRow({ communaute, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[140px] w-full overflow-hidden rounded-[22px] text-left shadow-[0_8px_24px_rgba(15,23,42,0.10)] transition-transform active:scale-[0.985]"
    >
      <img
        src={communaute.img}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-active:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full items-center gap-3.5 px-4">
        <div
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
          style={{ background: `${communaute.accent}90` }}
        >
          <span className="text-[22px] leading-none">{communaute.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-black leading-tight tracking-[-0.04em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            {communaute.label}
          </p>
          <p className="mt-1 line-clamp-1 text-[12.5px] font-semibold leading-snug text-white/85">
            {communaute.tagline}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <ChevronRight size={16} strokeWidth={2.8} className="text-white" />
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   HERO MOBILE
───────────────────────────────────────────── */
function MobileHero({ onBack }) {
  const imgMusique = COMMUNAUTES[0].img;
  const imgVelo    = COMMUNAUTES[1].img;

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "420px", borderRadius: "0 0 28px 28px" }}
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-y-0 left-0"
          style={{ right: "18%", clipPath: "polygon(0 0, 100% 0, calc(100% - 32px) 100%, 0 100%)" }}
        >
          <img src={imgMusique} alt="" className="h-full w-full object-cover object-center" />
        </div>
        <div
          className="absolute inset-y-0 right-0"
          style={{ left: "76%", clipPath: "polygon(32px 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <img src={imgVelo} alt="" className="h-full w-full object-cover object-center" />
        </div>
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,21,30,0.55) 0%, rgba(7,21,30,0.18) 35%, rgba(7,21,30,0.60) 68%, rgba(7,21,30,0.90) 100%)",
        }}
      />

      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full text-white transition active:scale-95"
        style={{ top: "max(14px, env(safe-area-inset-top))", background: "rgba(7,21,30,0.48)", backdropFilter: "blur(10px)" }}
        aria-label="Retour"
      >
        <ArrowLeft size={16} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
          Explorer
        </p>
        <h1 className="text-[40px] font-black leading-[0.92] tracking-[-0.06em] text-white">
          Communautés
        </h1>
        <p className="mt-2 text-[14px] font-medium leading-snug text-white/72">
          Découvre les objets et troqueurs qui partagent tes centres d'intérêt.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {HERO_CHIPS.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)" }}
            >
              <span className="text-[10px] leading-none">{chip.emoji}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PAGES ASSEMBLÉES
───────────────────────────────────────────── */
function DesktopCommunautesPage() {
  const navigate = useNavigate();
  return (
    <div className="hidden min-h-screen bg-[var(--troco-bg)] text-[#0d1b2a] lg:block">
      <main className="px-5 pb-24 pt-5 lg:px-6 xl:px-8">
        <DesktopHero />

        {/* En-tête de section */}
        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[10.5px] font-black uppercase tracking-[0.20em] text-[#167a58]">
                Communautés
              </p>
              <h2 className="text-[34px] font-black leading-tight tracking-[-0.055em] text-[#0d1b2a]">
                Explore par centre d'intérêt
              </h2>
            </div>
            <Link
              to="/feed"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#167a58] transition hover:opacity-75"
            >
              Retour au feed
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {COMMUNAUTES.map((c) => (
              <DesktopCommunauteRow
                key={c.id}
                communaute={c}
                onClick={() => navigate(`/communautes/${c.id}`)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function MobileCommunautesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[var(--troco-bg)] pb-28">
      <MobileHero onBack={() => navigate(-1)} />
      <main className="mx-auto w-full max-w-[430px] px-4 pt-5">
        <section className="flex flex-col gap-2.5">
          {COMMUNAUTES.map((c) => (
            <MobileCommunauteRow
              key={c.id}
              communaute={c}
              onClick={() => navigate(`/communautes/${c.id}`)}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

export default function CommunautesPage() {
  return (
    <>
      <DesktopCommunautesPage />
      <div className="block lg:hidden">
        <MobileCommunautesPage />
      </div>
    </>
  );
}
