import { ArrowLeft, ArrowRight, ChevronRight, Search, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import BottomNav from "../components/BottomNav";

import imgJeux from "../assets/univers/univ-jeux.png";
import imgMusique from "../assets/univers/univ-musique.png";
import imgDeco from "../assets/univers/univ-deco_maison.png";
import imgPhoto from "../assets/univers/univ-photo.png";
import imgSport from "../assets/univers/univ-sport.png";

const UNIVERS = [
  {
    id: "jeux",
    label: "Jeux",
    tagline: "Partager, jouer, s’amuser ensemble.",
    description: "Jeux de société, cartes, puzzles et objets ludiques à échanger près de toi.",
    img: imgJeux,
    accent: "#B8A040",
    icon: "✣",
    count: "823 objets",
  },
  {
    id: "musique",
    label: "Musique",
    tagline: "Écouter, collectionner, faire résonner.",
    description: "Vinyles, instruments, enceintes, pédales et accessoires audio.",
    img: imgMusique,
    accent: "#4BA8B8",
    icon: "♪",
    count: "1 124 objets",
  },
  {
    id: "deco",
    label: "Déco & Maison",
    tagline: "Sublimer, aménager, se sentir bien chez soi.",
    description: "Mobilier, luminaires, plantes, vaisselle et objets de maison.",
    img: imgDeco,
    accent: "#B07840",
    icon: "⌂",
    count: "1 657 objets",
  },
  {
    id: "photo",
    label: "Photo",
    tagline: "Capturer, créer, immortaliser.",
    description: "Appareils, objectifs, argentique, trépieds et accessoires photo.",
    img: imgPhoto,
    accent: "#8060B0",
    icon: "◎",
    count: "947 objets",
  },
  {
    id: "sport",
    label: "Sport",
    tagline: "Bouger, explorer, se dépasser.",
    description: "Outdoor, vélo, fitness doux, raquettes, sacs et équipement sport.",
    img: imgSport,
    accent: "#4F9F67",
    icon: "♧",
    count: "612 objets",
  },
];

function UniverseIcon({ univers }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-[0_10px_26px_rgba(15,23,42,0.08)] backdrop-blur-xl"
      style={{
        background: `${univers.accent}18`,
        borderColor: `${univers.accent}38`,
        color: univers.accent,
      }}
    >
      <span className="text-[19px] font-black">{univers.icon}</span>
    </div>
  );
}

function DesktopHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-slate-900 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-0 grid grid-cols-5">
        {UNIVERS.map((univers) => (
          <img
            key={univers.id}
            src={univers.img}
            alt=""
            className="h-full w-full object-cover"
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/76 via-black/42 to-black/16" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/56 via-black/8 to-transparent" />

      <div className="relative z-10 min-h-[250px] px-8 py-7">
        <div className="flex items-start justify-between gap-5">
          <Link
            to="/feed"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur-xl transition active:scale-95"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex h-12 w-full max-w-[460px] items-center gap-3 rounded-full border border-white/22 bg-white/16 px-4 shadow-[0_14px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <Search size={17} className="text-white/70" />
            <input
              placeholder="Rechercher un univers..."
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-white/82 outline-none placeholder:text-white/55"
            />
          </div>
        </div>

        <div className="mt-12 max-w-[620px]">
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <Sparkles size={13} />
            Explorer
          </p>

          <h1 className="text-[48px] font-black leading-[0.95] tracking-[-0.065em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.32)]">
            Tous les univers
          </h1>

          <p className="mt-3 max-w-[500px] text-[16px] font-semibold leading-relaxed text-white/82">
            Choisis un univers pour explorer Troco comme une collection d’ambiances.
          </p>
        </div>
      </div>
    </section>
  );
}

function DesktopUniverseRow({ univers, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[minmax(0,1fr)_360px] overflow-hidden rounded-[28px] border border-white/75 bg-white/72 text-left shadow-[0_14px_38px_rgba(15,23,42,0.055)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.075)] active:scale-[0.99]"
    >
      <div className="flex min-h-[154px] items-center gap-5 p-5">
        <UniverseIcon univers={univers} />

        <div className="min-w-0 flex-1">
          <p
            className="mb-1 text-[11px] font-black uppercase tracking-[0.16em]"
            style={{ color: univers.accent }}
          >
            {univers.count}
          </p>

          <h2 className="text-[30px] font-black leading-none tracking-[-0.055em] text-[#102033]">
            {univers.label}
          </h2>

          <p className="mt-2 text-[14px] font-black leading-snug text-slate-700">
            {univers.tagline}
          </p>

          <p className="mt-2 max-w-[520px] text-[13px] font-medium leading-relaxed text-slate-500">
            {univers.description}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-[#102033]/5 px-4 py-2 text-[12px] font-black text-[#102033] transition group-hover:bg-[#167a58] group-hover:text-white xl:inline-flex">
          Ouvrir
          <ArrowRight size={14} strokeWidth={2.6} />
        </div>
      </div>

      <div className="relative min-h-[154px] overflow-hidden">
        <img
          src={univers.img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/8 to-transparent" />
        <div className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/18 text-white backdrop-blur-xl transition group-hover:bg-white/26">
          <ChevronRight size={18} strokeWidth={2.7} />
        </div>
      </div>
    </button>
  );
}

function MobileUniverseRow({ univers, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[124px] w-full overflow-hidden rounded-[28px] border border-white/70 bg-slate-900 text-left shadow-[0_14px_34px_rgba(15,23,42,0.075)] active:scale-[0.985]"
    >
      <img
        src={univers.img}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/74 via-black/34 to-black/8" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full items-center gap-4 px-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/36 text-white backdrop-blur-xl"
          style={{ background: `${univers.accent}64` }}
        >
          <span className="text-[18px] font-black">{univers.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[23px] font-black leading-none tracking-[-0.05em] text-white drop-shadow">
            {univers.label}
          </p>
          <p className="mt-2 line-clamp-2 max-w-[240px] text-[12.5px] font-semibold leading-snug text-white/78">
            {univers.tagline}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xl">
          <ChevronRight size={17} strokeWidth={2.8} />
        </div>
      </div>
    </button>
  );
}

function DesktopUniversPage() {
  const navigate = useNavigate();

  return (
    <div className="hidden min-h-screen bg-[var(--troco-bg)] text-[#102033] lg:block">
      <main className="px-5 pb-20 pt-5 lg:px-6 xl:px-7">
        <DesktopHero />

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#167a58]">
                Univers
              </p>
              <h2 className="text-[30px] font-black tracking-[-0.055em] text-[#102033]">
                Choisis ton ambiance
              </h2>
            </div>

            <Link
              to="/feed"
              className="inline-flex items-center gap-1 text-[13px] font-black text-[#167a58]"
            >
              Retour au feed
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {UNIVERS.map((univers) => (
              <DesktopUniverseRow
                key={univers.id}
                univers={univers}
                onClick={() => navigate(`/univers/${univers.id}`)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function MobileUniversPage() {
  const navigate = useNavigate();

  return (
    <div className="troco-universe-screen min-h-screen pb-28">
      <main className="mx-auto w-full max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/76 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.045)] backdrop-blur-xl"
            aria-label="Retour"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#167a58]">
              <Sparkles size={13} />
              Explorer
            </p>
            <h1 className="text-[30px] font-black leading-[0.98] tracking-[-0.06em] text-slate-950">
              Tous les univers
            </h1>
            <p className="mt-2 text-[13px] font-medium leading-snug text-slate-500">
              Explore Troco par grandes familles d’objets.
            </p>
          </div>
        </header>

        <section className="mb-5 rounded-[26px] border border-white/75 bg-white/72 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)] backdrop-blur-xl">
          <p className="text-[13px] font-semibold leading-relaxed text-slate-600">
            Dans le feed, les univers filtrent les objets. Ici, ils deviennent des pages complètes à explorer.
          </p>
        </section>

        <section className="flex flex-col gap-3.5">
          {UNIVERS.map((univers) => (
            <MobileUniverseRow
              key={univers.id}
              univers={univers}
              onClick={() => navigate(`/univers/${univers.id}`)}
            />
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default function UniversPage() {
  return (
    <>
      <DesktopUniversPage />
      <div className="block lg:hidden">
        <MobileUniversPage />
      </div>
    </>
  );
}
