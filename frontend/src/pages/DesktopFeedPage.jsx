import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Repeat2,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { formatCondition } from "../../utils/format";
import useFeedItems, {
  getItemImage,
  getItemTitle,
  getItemLocation,
  RADIUS_OPTIONS,
} from "../../hooks/useFeedItems";

import imgHero from "../../assets/hero.png";
import imgJeux from "../../assets/univers/univ-jeux.png";
import imgMusique from "../../assets/univers/univ-musique.png";
import imgDeco from "../../assets/univers/univ-deco_maison.png";
import imgPhoto from "../../assets/univers/univ-photo.png";
import imgSport from "../../assets/univers/univ-sport.png";

const UNIVERS = [
  {
    id: "musique",
    label: "Musique",
    eyebrow: "Vinyles, instruments, audio",
    accent: "#2F7F8F",
    img: imgMusique,
  },
  {
    id: "jeux",
    label: "Jeux",
    eyebrow: "Jeux de société, cartes, puzzles",
    accent: "#9A8131",
    img: imgJeux,
  },
  {
    id: "deco",
    label: "Déco & Maison",
    eyebrow: "Mobilier, luminaires, objets",
    accent: "#A46332",
    img: imgDeco,
  },
  {
    id: "photo",
    label: "Photo",
    eyebrow: "Appareils, objectifs, argentique",
    accent: "#6B5698",
    img: imgPhoto,
  },
  {
    id: "sport",
    label: "Sport",
    eyebrow: "Outdoor, vélo, équipements",
    accent: "#3F8052",
    img: imgSport,
  },
];

const SIDEBAR_LINKS = [
  { to: "/feed", label: "Explorer", icon: Home },
  { to: "/library", label: "Ma bibliothèque", icon: BookOpen },
  { to: "/favorites", label: "Favoris", icon: Heart },
  { to: "/exchanges", label: "Trocs", icon: Repeat2 },
  { to: "/messages", label: "Messages", icon: MessageCircle, badge: 3 },
  { to: "/profile", label: "Profil", icon: UserRound },
];

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function itemMatchesUniverse(item, universId) {
  if (!universId) return true;

  const haystack = [
    item?.category,
    item?.subCategory,
    item?.type,
    item?.itemType,
    item?.title,
    item?.name,
    item?.description,
    item?.details,
  ]
    .map(normalizeText)
    .join(" ");

  const keywords = {
    musique: [
      "musique",
      "instrument",
      "vinyle",
      "guitare",
      "piano",
      "audio",
      "enceinte",
      "casque",
      "platine",
      "disque",
    ],
    jeux: [
      "jeux",
      "jeu",
      "societe",
      "société",
      "puzzle",
      "carte",
      "cartes",
      "catan",
      "echecs",
      "échecs",
    ],
    deco: [
      "deco",
      "déco",
      "maison",
      "mobilier",
      "meuble",
      "lampe",
      "luminaire",
      "plante",
      "vaisselle",
      "tapis",
    ],
    photo: [
      "photo",
      "camera",
      "caméra",
      "appareil",
      "objectif",
      "argentique",
      "canon",
      "nikon",
      "polaroid",
    ],
    sport: [
      "sport",
      "velo",
      "vélo",
      "outdoor",
      "fitness",
      "basket",
      "tennis",
      "raquette",
      "skate",
      "yoga",
    ],
  };

  return (keywords[universId] || [universId]).some((keyword) =>
    haystack.includes(normalizeText(keyword))
  );
}

function cleanName(value = "") {
  const name = String(value || "").trim();
  if (!name) return "";
  if (name.includes("@")) return name.split("@")[0];

  const parts = name.split(/\s+/);
  if (parts.length > 1) return `${parts[0]} ${parts[1].charAt(0)}.`;

  return name;
}

function getOwnerName(item) {
  return cleanName(
    item?.ownerName ||
      item?.ownerDisplayName ||
      item?.userName ||
      item?.displayName ||
      ""
  );
}

function getOwnerId(item) {
  return (
    item?.ownerId ||
    item?.userId ||
    item?.ownerUid ||
    item?.createdBy ||
    item?.uid ||
    ""
  );
}

function getInitial(value = "") {
  const clean = cleanName(value);
  return (clean || "T").charAt(0).toUpperCase();
}

function formatRelativeTime(value) {
  const raw =
    value?.toDate?.() ||
    (value?.seconds ? new Date(value.seconds * 1000) : null) ||
    (value ? new Date(value) : null);

  if (!raw || Number.isNaN(raw.getTime())) return "récemment";

  const diff = Date.now() - raw.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;

  return raw.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getExchangeImage(exchange, side) {
  if (side === "a") {
    return (
      exchange?.requestedItemImage ||
      exchange?.requestedImage ||
      exchange?.requestedItemImages?.[0] ||
      exchange?.itemImage ||
      ""
    );
  }

  return (
    exchange?.offeredItemImage ||
    exchange?.offeredImage ||
    exchange?.offeredItemImages?.[0] ||
    exchange?.proposedItemImage ||
    ""
  );
}

function getExchangeTitle(exchange, side) {
  if (side === "a") {
    return (
      exchange?.requestedItemTitle ||
      exchange?.requestedTitle ||
      exchange?.itemTitle ||
      "Objet"
    );
  }

  return (
    exchange?.offeredItemTitle ||
    exchange?.offeredTitle ||
    exchange?.proposedItemTitle ||
    "Objet"
  );
}

async function loadItemPreview(itemId) {
  if (!itemId) return null;

  try {
    const snapshot = await getDoc(doc(db, "items", String(itemId)));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    return {
      title: getItemTitle({ id: snapshot.id, ...data }),
      image:
        data?.images?.[0] ||
        data?.photos?.[0] ||
        data?.imageUrl ||
        data?.image ||
        "",
    };
  } catch {
    return null;
  }
}

function DesktopSidebar({ user }) {
  const navigate = useNavigate();
  const initial = getInitial(user?.displayName || user?.email || "Alex");
  const photo = user?.photoURL || user?.photoUrl || "";
  const userName = cleanName(user?.displayName || user?.email || "Alex R.");

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[248px] border-r border-slate-200/70 bg-white/86 px-6 pb-6 pt-8 shadow-[18px_0_60px_rgba(15,23,42,0.035)] backdrop-blur-2xl lg:flex lg:flex-col">
      <button
        type="button"
        onClick={() => navigate("/feed")}
        className="mb-8 flex w-fit items-center transition active:scale-95"
        aria-label="Accueil Troco"
      >
        <img src="/logo.png" alt="Troco" className="h-auto w-[118px] object-contain" />
      </button>

      <button
        type="button"
        onClick={() => navigate("/add")}
        className="mb-7 flex h-[56px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#0F7F45] text-[15px] font-black text-white shadow-[0_16px_30px_rgba(15,127,69,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b733d] active:scale-[0.98]"
      >
        <Plus size={17} strokeWidth={2.7} />
        Publier
      </button>

      <nav className="space-y-2">
        {SIDEBAR_LINKS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex h-[52px] items-center gap-4 rounded-[18px] px-4 text-[14px] font-black transition",
                isActive
                  ? "bg-emerald-50/90 text-[#0B7145] shadow-[0_10px_28px_rgba(15,23,42,0.045)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              ].join(" ")
            }
          >
            <Icon size={18} strokeWidth={2.25} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {badge ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0F8B5A] px-1.5 text-[11px] font-black text-white">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-5">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#0F8B5A] text-white">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[15px] font-black">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-slate-950">{userName}</p>
            <p className="text-[12px] font-semibold text-slate-500">Voir mon profil</p>
          </div>
          <ArrowRight size={16} className="text-slate-400" />
        </Link>

        <div className="rounded-[24px] border border-slate-200/80 bg-white/82 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#0F8B5A]">
            <Sparkles size={17} strokeWidth={2.3} />
          </div>
          <p className="text-[13px] font-semibold leading-relaxed text-slate-500">
            Des objets qui circulent autrement.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-2 text-[13px] font-black text-[#0B7145]"
          >
            Aide / Contact
            <ArrowRight size={14} strokeWidth={2.6} />
          </Link>
        </div>

        <p className="pl-1 text-[11px] font-semibold text-slate-400">© 2026 Troco</p>
      </div>
    </aside>
  );
}

function HeroSearch({ search, setSearch }) {
  return (
    <div className="flex h-[58px] w-full max-w-[720px] items-center gap-4 rounded-[20px] border border-white/80 bg-white/88 px-5 shadow-[0_18px_42px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
      <Search size={21} className="shrink-0 text-slate-600" strokeWidth={2.2} />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un objet, un univers, une personne..."
        className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-800 outline-none placeholder:text-slate-500"
      />
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-slate-800 shadow-[0_10px_22px_rgba(15,23,42,0.09)] transition hover:-translate-y-0.5 active:scale-95"
        aria-label="Filtres"
      >
        <SlidersHorizontal size={19} strokeWidth={2.3} />
      </button>
    </div>
  );
}

function HeroStat({ icon, title, subtitle }) {
  return (
    <div className="flex min-w-[205px] items-center justify-center gap-4 border-r border-slate-200/90 px-7 py-4 last:border-r-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#0F8B5A]">
        {icon}
      </span>
      <div>
        <p className="text-[16px] font-black leading-tight text-slate-950">{title}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function DesktopHero({ search, setSearch }) {
  return (
    <section className="relative w-full overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <img
        src={imgHero}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/28 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/34 via-transparent to-black/12" />

      <div className="relative z-10 min-h-[424px] px-10 pb-0 pt-6 xl:px-14">
        <div className="flex items-start justify-between gap-6">
          <HeroSearch search={search} setSearch={setSearch} />

          <div className="flex shrink-0 items-center gap-3">
            <button className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/92 text-slate-800 shadow-[0_16px_34px_rgba(15,23,42,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 active:scale-95">
              <Bell size={20} />
              <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full border border-white bg-[#0F8B5A]" />
            </button>
            <button className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/92 text-slate-800 shadow-[0_16px_34px_rgba(15,23,42,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 active:scale-95">
              <Heart size={21} />
            </button>
          </div>
        </div>

        <div className="mt-12 max-w-[640px]">
          <p className="mb-3 text-[13px] font-black uppercase tracking-[0.24em] text-emerald-300 drop-shadow">
            Troco local
          </p>
          <h1 className="max-w-[590px] text-[56px] font-black leading-[0.96] tracking-[-0.065em] text-white drop-shadow-[0_5px_22px_rgba(0,0,0,0.42)] xl:text-[60px]">
            Échange local,
            <br />
            impact réel.
          </h1>
          <p className="mt-5 max-w-[450px] text-[18px] font-bold leading-snug text-white/92 drop-shadow-[0_3px_16px_rgba(0,0,0,0.36)]">
            Découvre des objets près de chez toi et échange autrement.
          </p>
        </div>

        <div className="absolute bottom-4 left-10 right-auto flex overflow-hidden rounded-[24px] border border-white/80 bg-white/94 shadow-[0_22px_52px_rgba(15,23,42,0.18)] backdrop-blur-2xl xl:left-14">
          <HeroStat
            icon={<Sparkles size={18} strokeWidth={2.4} />}
            title="12 échanges"
            subtitle="aujourd’hui près de toi"
          />
          <HeroStat
            icon={<MapPin size={18} strokeWidth={2.4} />}
            title="Paris 11e"
            subtitle="Rayon : 5 km"
          />
          <HeroStat
            icon={<UsersRound size={18} strokeWidth={2.4} />}
            title="1 243 membres"
            subtitle="actifs autour de toi"
          />
        </div>
      </div>
    </section>
  );
}

function UniversCard({ univers, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative h-[150px] overflow-hidden rounded-[20px] border bg-slate-950 text-left shadow-[0_14px_36px_rgba(15,23,42,0.09)] transition hover:-translate-y-1 active:scale-[0.985]",
        active ? "border-[#0F8B5A] ring-2 ring-[#0F8B5A]/20" : "border-white/80",
      ].join(" ")}
    >
      {univers.img ? (
        <img
          src={univers.img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
          style={{ objectPosition: "center" }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/32 to-black/5" />
      <div
        className="absolute left-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 text-white shadow-[0_10px_22px_rgba(15,23,42,0.22)] backdrop-blur-xl"
        style={{ background: `${univers.accent}CC` }}
      >
        <Sparkles size={17} strokeWidth={2.5} />
      </div>

      {active ? (
        <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-black text-[#0F8B5A] shadow-sm">
          Actif
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-[23px] font-black leading-none tracking-[-0.055em] text-white drop-shadow">
          {univers.label}
        </h3>
        <p className="mt-2 line-clamp-1 text-[12.5px] font-semibold text-white/86 drop-shadow">
          {univers.eyebrow}
        </p>
      </div>
    </button>
  );
}

function RecentExchangeCard({ exchange }) {
  const initial = getInitial(exchange.senderName || "Troco");

  return (
    <Link
      to={`/troc/${exchange.id}`}
      className="group block min-w-[260px] overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.075)] transition hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[13px] font-black text-[#0F8B5A]">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-1 text-[12.5px] font-black text-slate-900">
            {exchange.senderName || "Quelqu’un"} a échangé
          </p>
          <p className="mt-0.5 text-[11.5px] font-semibold text-slate-400">
            {exchange.relativeTime || "récemment"}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex gap-2 px-4 pb-3">
        <div className="aspect-[1.05/1] flex-1 overflow-hidden rounded-[16px] bg-slate-100">
          {exchange.imgA ? (
            <img
              src={exchange.imgA}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-slate-300">📦</div>
          )}
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-[#0F8B5A] text-white shadow-[0_9px_18px_rgba(15,23,42,0.22)]">
          <Repeat2 size={15} strokeWidth={2.8} />
        </div>

        <div className="aspect-[1.05/1] flex-1 overflow-hidden rounded-[16px] bg-slate-100">
          {exchange.imgB ? (
            <img
              src={exchange.imgB}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-slate-300">📦</div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="line-clamp-1 text-[13px] font-black text-slate-950">
          {exchange.titleA} <span className="text-slate-400">⇄</span> {exchange.titleB}
        </p>
      </div>
    </Link>
  );
}

function DesktopFeedCard({ item, favorite, onToggleFavorite }) {
  const navigate = useNavigate();

  const title = getItemTitle(item);
  const location = getItemLocation(item);
  const ownerName = getOwnerName(item);
  const ownerId = getOwnerId(item);
  const image = getItemImage(item);
  const condition = formatCondition(
    item?.conditionLabel || item?.condition || item?.state || ""
  );

  return (
    <Link to={`/items/${item.id}`} className="group block">
      <article className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_46px_rgba(15,23,42,0.1)]">
        <div
          className="relative aspect-[1.18/1] overflow-hidden bg-slate-100"
          onDragStart={(event) => event.preventDefault()}
        >
          {image ? (
            <img
              src={image}
              alt={title}
              draggable="false"
              className="pointer-events-none h-full w-full select-none object-cover transition duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-slate-200">
              📦
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={[
              "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/86 shadow-[0_10px_22px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 active:scale-95",
              favorite ? "text-rose-500" : "text-slate-500",
            ].join(" ")}
            aria-label="Favori"
          >
            <Heart
              size={17}
              fill={favorite ? "currentColor" : "none"}
              strokeWidth={2.3}
            />
          </button>

          {item.distanceLabel ? (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/52 px-3 py-1.5 text-[11px] font-black text-white shadow-sm backdrop-blur-md">
              <MapPin size={11} strokeWidth={2.7} />
              {item.distanceLabel}
            </span>
          ) : null}
        </div>

        <div className="p-4">
          <h2 className="line-clamp-1 text-[15px] font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h2>

          {ownerId ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                navigate(`/users/${ownerId}`);
              }}
              className="mt-1.5 line-clamp-1 text-left text-[13px] font-bold text-[#0F8B5A]"
            >
              {ownerName || "Utilisateur Troco"}
            </button>
          ) : (
            <p className="mt-1.5 line-clamp-1 text-[13px] font-bold text-[#0F8B5A]">
              {ownerName || "Utilisateur Troco"}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="line-clamp-1 text-[12px] font-semibold text-slate-500">
              {location || "Près de toi"}
            </p>

            {condition ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-black text-emerald-700">
                {condition}
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}

function SectionHeader({ eyebrow, title, action, to }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F8B5A]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-[25px] font-black tracking-[-0.05em] text-[#102033]">
          {title}
        </h2>
      </div>

      {action && to ? (
        <Link
          to={to}
          className="inline-flex items-center gap-1.5 text-[13px] font-black text-[#0B7145] transition hover:translate-x-0.5"
        >
          {action}
          <ArrowRight size={15} strokeWidth={2.7} />
        </Link>
      ) : null}
    </div>
  );
}

export default function DesktopFeedPage() {
  const { user } = useAuth();

  const {
    visibleItems,
    favoriteItemIds,
    search,
    setSearch,
    radius,
    setRadius,
    toggleFavorite,
  } = useFeedItems();

  const [recentExchanges, setRecentExchanges] = useState([]);
  const [activeUniverse, setActiveUniverse] = useState(null);

  useEffect(() => {
    const exchangesQuery = query(
      collection(db, "exchanges"),
      orderBy("updatedAt", "desc"),
      limit(12)
    );

    const unsubscribe = onSnapshot(
      exchangesQuery,
      async (snapshot) => {
        const list = await Promise.all(
          snapshot.docs.map(async (documentSnapshot) => {
            const exchange = {
              id: documentSnapshot.id,
              ...documentSnapshot.data(),
            };

            let imgA = getExchangeImage(exchange, "a");
            let imgB = getExchangeImage(exchange, "b");
            let titleA = getExchangeTitle(exchange, "a");
            let titleB = getExchangeTitle(exchange, "b");

            if ((!imgA || titleA === "Objet") && (exchange.requestedItemId || exchange.itemId)) {
              const preview = await loadItemPreview(exchange.requestedItemId || exchange.itemId);
              if (preview) {
                imgA = imgA || preview.image;
                titleA = titleA === "Objet" ? preview.title : titleA;
              }
            }

            if ((!imgB || titleB === "Objet") && (exchange.offeredItemId || exchange.proposedItemId)) {
              const preview = await loadItemPreview(exchange.offeredItemId || exchange.proposedItemId);
              if (preview) {
                imgB = imgB || preview.image;
                titleB = titleB === "Objet" ? preview.title : titleB;
              }
            }

            return {
              id: exchange.id,
              imgA,
              imgB,
              titleA,
              titleB,
              senderName: cleanName(exchange.senderName || exchange.senderDisplayName || "Alex"),
              relativeTime: formatRelativeTime(exchange.updatedAt || exchange.completedAt || exchange.createdAt),
            };
          })
        );

        setRecentExchanges(
          list
            .filter((exchange) => exchange.imgA || exchange.imgB)
            .slice(0, 8)
        );
      },
      () => {
        setRecentExchanges([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredVisibleItems = useMemo(() => {
    return visibleItems.filter((item) => itemMatchesUniverse(item, activeUniverse));
  }, [visibleItems, activeUniverse]);

  const activeUniverseLabel = UNIVERS.find((univers) => univers.id === activeUniverse)?.label;

  return (
    <div className="min-h-screen bg-[#F4FBF8] text-[#102033]">
      <DesktopSidebar user={user} />

      <main className="px-4 pb-24 pt-4 lg:pl-[272px] lg:pr-6 lg:pt-6 xl:pr-8 2xl:pr-10">
        <DesktopHero search={search} setSearch={setSearch} />

        <section className="mt-9">
          <SectionHeader title="Explorer les univers" action="Voir tout" to="/univers" />
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {UNIVERS.map((univers) => (
              <UniversCard
                key={univers.id}
                univers={univers}
                active={activeUniverse === univers.id}
                onClick={() =>
                  setActiveUniverse((current) => (current === univers.id ? null : univers.id))
                }
              />
            ))}
          </div>

          {activeUniverse ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200/80 bg-white/82 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.055)] backdrop-blur-xl">
              <p className="text-[13px] font-bold text-slate-600">
                Univers actif : <span className="text-[#0F8B5A]">{activeUniverseLabel}</span>
              </p>
              <button
                type="button"
                onClick={() => setActiveUniverse(null)}
                className="rounded-full bg-[#0F8B5A] px-4 py-2 text-[12px] font-black text-white transition hover:-translate-y-0.5 active:scale-95"
              >
                Voir tous les objets
              </button>
            </div>
          ) : null}
        </section>

        <section className="mt-9">
          <SectionHeader title="Échanges récents près de toi" action="Voir tout" to="/exchanges" />

          {recentExchanges.length ? (
            <div className="troco-scrollbar-hide flex gap-5 overflow-x-auto pb-2">
              {recentExchanges.map((exchange) => (
                <RecentExchangeCard key={exchange.id} exchange={exchange} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200/80 bg-white/82 px-5 py-7 text-[14px] font-semibold text-slate-500 shadow-[0_12px_32px_rgba(15,23,42,0.055)] backdrop-blur-xl">
              Les échanges récents apparaîtront ici dès qu’ils seront disponibles.
            </div>
          )}
        </section>

        <section className="mt-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <SectionHeader title={activeUniverse ? `Objets ${activeUniverseLabel}` : "Objets près de toi"} />
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setRadius(option.value)}
                  className={[
                    "rounded-full px-4 py-2 text-[12px] font-black transition hover:-translate-y-0.5 active:scale-95",
                    radius === option.value
                      ? "bg-[#0F8B5A] text-white shadow-[0_12px_26px_rgba(15,139,90,0.18)]"
                      : "bg-white/86 text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.045)]",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white/86 px-4 py-2 text-[12px] font-black text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 active:scale-95"
              >
                Plus de filtres
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {filteredVisibleItems.length ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 2xl:grid-cols-3">
              {filteredVisibleItems.map((item) => (
                <DesktopFeedCard
                  key={item.id}
                  item={item}
                  favorite={favoriteItemIds.includes(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200/80 bg-white/86 p-10 text-center shadow-[0_12px_36px_rgba(15,23,42,0.055)]">
              <p className="text-[18px] font-black tracking-[-0.035em] text-[#102033]">
                Aucun objet trouvé.
              </p>
              <p className="mt-2 text-[14px] font-medium text-slate-500">
                Essaie une autre recherche, un autre rayon ou un autre univers.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
