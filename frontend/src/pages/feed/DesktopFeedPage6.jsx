import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Heart,
  MapPin,
  Repeat2,
  Search,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
    accent: "#4BA8B8",
    img: imgMusique,
  },
  {
    id: "jeux",
    label: "Jeux",
    eyebrow: "Jeux de société, cartes, puzzles",
    accent: "#B8A040",
    img: imgJeux,
  },
  {
    id: "deco",
    label: "Déco & Maison",
    eyebrow: "Mobilier, luminaires, objets",
    accent: "#B07840",
    img: imgDeco,
  },
  {
    id: "photo",
    label: "Photo",
    eyebrow: "Appareils, objectifs, argentique",
    accent: "#8060B0",
    img: imgPhoto,
  },
  {
    id: "sport",
    label: "Sport",
    eyebrow: "Outdoor, vélo, équipements",
    accent: "#4F9F67",
    img: imgSport,
  },
];

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

function SidebarLink({ active = false, icon, label, badge, to = "#" }) {
  return (
    <Link
      to={to}
      className={[
        "flex h-11 items-center gap-3 rounded-[16px] px-4 text-[13px] font-black transition",
        active
          ? "bg-white text-[#0b3b2f] shadow-[0_10px_24px_rgba(15,23,42,0.045)]"
          : "text-slate-600 hover:bg-white/62 hover:text-[#0b3b2f]",
      ].join(" ")}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#167a58] px-1.5 text-[10px] text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function DesktopSidebar({ user }) {
  const initial = (user?.displayName || user?.email || "A").charAt(0).toUpperCase();
  const photo = user?.photoURL || user?.photoUrl || "";

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[224px] border-r border-white/70 bg-white/44 px-5 py-8 backdrop-blur-2xl lg:flex lg:flex-col">
      <Link to="/feed" className="mb-9 block">
        <img src="/logo.png" alt="Troco" className="h-auto w-[98px]" />
      </Link>

      <Link
        to="/add"
        className="mb-8 flex h-12 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 text-[13px] font-black text-white shadow-[0_12px_30px_rgba(46,204,138,0.16)] active:scale-95"
      >
        + Publier
      </Link>

      <nav className="flex flex-col gap-2">
        <SidebarLink active to="/feed" icon="⌂" label="Explorer" />
        <SidebarLink to="/library" icon="▣" label="Ma bibliothèque" />
        <SidebarLink to="/favorites" icon="♡" label="Favoris" />
        <SidebarLink to="/exchanges" icon="⇄" label="Trocs" />
        <SidebarLink to="/messages" icon="◌" label="Messages" badge="3" />
        <SidebarLink to="/profile" icon="♙" label="Profil" />
      </nav>

      <div className="mt-auto space-y-4">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-[22px] border border-white/70 bg-white/66 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
        >
          <div className="h-10 w-10 overflow-hidden rounded-full bg-[#167a58] text-white">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[14px] font-black">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-slate-900">
              {user?.displayName || "Alexandre"}
            </p>
            <p className="text-[11px] font-semibold text-slate-400">Voir mon profil</p>
          </div>
          <ArrowRight size={14} className="text-slate-400" />
        </Link>

        <div className="rounded-[24px] border border-white/70 bg-white/52 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
          <p className="text-[12px] font-semibold leading-relaxed text-slate-500">
            Des objets qui circulent autrement.
          </p>
          <Link to="/contact" className="mt-3 block text-[12px] font-black text-[#0b3b2f]">
            Aide / Contact
          </Link>
        </div>
      </div>
    </aside>
  );
}

function HeroSearch({ search, setSearch }) {
  return (
    <div className="flex h-13 w-full max-w-[620px] items-center gap-3 rounded-[22px] border border-white/22 bg-white/16 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <Search size={18} className="shrink-0 text-white/70" strokeWidth={2.2} />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un objet, un univers, une personne..."
        className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-white/82 outline-none placeholder:text-white/55"
      />
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
        aria-label="Filtres"
      >
        <SlidersHorizontal size={17} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function HeroStat({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 border-r border-white/22 px-5 last:border-r-0">
      <span className="text-emerald-300">{icon}</span>
      <div>
        <p className="text-[13px] font-black text-white">{title}</p>
        <p className="text-[11px] font-semibold text-white/62">{subtitle}</p>
      </div>
    </div>
  );
}

function DesktopHero({ search, setSearch }) {
  return (
    <section className="relative w-full overflow-hidden rounded-[38px] border border-white/75 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.075)]">
      <img
        src={imgHero}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/38 to-black/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/52 via-transparent to-transparent" />

      <div className="relative z-10 min-h-[450px] px-10 pb-9 pt-12">
        <div className="flex items-start justify-between gap-6">
          <HeroSearch search={search} setSearch={setSearch} />

          <div className="flex shrink-0 items-center gap-3">
            <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/88 text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-white bg-[#167a58]" />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/88 text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <Heart size={18} />
            </button>
          </div>
        </div>

        <div className="mt-10 max-w-[720px]">
          <p className="mb-3 text-[12px] font-black uppercase tracking-[0.18em] text-emerald-300">
            Troco local
          </p>
          <h1 className="max-w-[560px] text-[54px] font-black leading-[0.94] tracking-[-0.065em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.32)]">
            Échange local, impact réel.
          </h1>
          <p className="mt-5 max-w-[500px] text-[17px] font-semibold leading-relaxed text-white/84 drop-shadow">
            Découvre des objets près de chez toi et échange autrement.
          </p>

          <div className="mt-8 flex w-fit overflow-hidden rounded-[22px] border border-white/22 bg-black/22 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <HeroStat
              icon={<Sparkles size={18} />}
              title="12 échanges"
              subtitle="aujourd’hui près de toi"
            />
            <HeroStat
              icon={<MapPin size={18} />}
              title="Paris 11e"
              subtitle="Rayon : 5 km"
            />
            <HeroStat
              icon={<UsersRound size={18} />}
              title="1 243 membres"
              subtitle="actifs autour de toi"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function UniversCard({ univers }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/univers/${univers.id}`)}
      className="group relative h-[150px] overflow-hidden rounded-[22px] border border-white/70 bg-slate-900 text-left shadow-[0_12px_30px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 active:scale-[0.985]"
    >
      {univers.img ? (
        <img
          src={univers.img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          style={{ objectPosition: "center" }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/22 to-transparent" />
      <div
        className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/22 text-white backdrop-blur-md"
        style={{ background: `${univers.accent}55` }}
      >
        <Sparkles size={16} strokeWidth={2.4} />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-[20px] font-black leading-none tracking-[-0.04em] text-white">
          {univers.label}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-white/78">
          {univers.eyebrow}
        </p>
      </div>
    </button>
  );
}

function RecentExchangeCard({ exchange }) {
  return (
    <Link
      to={`/troc/${exchange.id}`}
      className="group block min-w-[230px] overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5"
    >
      <div className="px-3.5 pt-3.5">
        <p className="line-clamp-1 text-[12px] font-black text-slate-800">
          {exchange.senderName || "Quelqu’un"} a échangé
        </p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
          {exchange.relativeTime || "récemment"}
        </p>
      </div>

      <div className="relative mt-2 flex gap-1.5 px-3.5 pb-3">
        <div className="aspect-[1.1/1] flex-1 overflow-hidden rounded-[14px] bg-slate-100">
          {exchange.imgA ? (
            <img
              src={exchange.imgA}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[#167a58] text-white shadow-[0_6px_14px_rgba(15,23,42,0.18)]">
          <Repeat2 size={14} strokeWidth={2.7} />
        </div>

        <div className="aspect-[1.1/1] flex-1 overflow-hidden rounded-[14px] bg-slate-100">
          {exchange.imgB ? (
            <img
              src={exchange.imgB}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
        </div>
      </div>

      <div className="px-3.5 pb-3.5">
        <p className="line-clamp-1 text-[12px] font-black text-slate-900">
          {exchange.titleA} ⇄ {exchange.titleB}
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
      <article className="overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.075)]">
        <div className="relative aspect-[1.05/1] overflow-hidden bg-slate-100">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-slate-200">
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
              "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/78 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur-md transition active:scale-95",
              favorite ? "text-rose-500" : "text-slate-400",
            ].join(" ")}
            aria-label="Favori"
          >
            <Heart
              size={15}
              fill={favorite ? "currentColor" : "none"}
              strokeWidth={2.2}
            />
          </button>

          {item.distanceLabel && (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/48 px-2.5 py-1 text-[10.5px] font-black text-white backdrop-blur-md">
              <MapPin size={10} strokeWidth={2.6} />
              {item.distanceLabel}
            </span>
          )}
        </div>

        <div className="p-3.5">
          <h2 className="line-clamp-1 text-[14px] font-black tracking-[-0.03em] text-slate-950">
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
              className="mt-1 line-clamp-1 text-left text-[12px] font-semibold text-[#167a58]"
            >
              {ownerName || "Utilisateur Troco"}
            </button>
          ) : (
            <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-[#167a58]">
              {ownerName || "Utilisateur Troco"}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="line-clamp-1 text-[11px] font-semibold text-slate-400">
              {location || "Près de toi"}
            </p>

            {condition && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                {condition}
              </span>
            )}
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
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#167a58]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-[25px] font-black tracking-[-0.045em] text-[#102033]">
          {title}
        </h2>
      </div>

      {action && to ? (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-[12px] font-black text-[#167a58]"
        >
          {action}
          <ArrowRight size={14} strokeWidth={2.6} />
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
              senderName: cleanName(exchange.senderName || exchange.senderDisplayName || "Camille"),
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

  return (
    <div className="min-h-screen bg-[var(--troco-bg)] text-[#102033]">
      <DesktopSidebar user={user} />

      <main className="px-4 pb-20 pt-4 lg:px-6 lg:pt-6 xl:px-7">
        <DesktopHero search={search} setSearch={setSearch} />

        <section className="mt-9">
          <SectionHeader title="Explorer les univers" action="Voir tout" to="/univers" />
          <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-5">
            {UNIVERS.map((univers) => (
              <UniversCard key={univers.id} univers={univers} />
            ))}
          </div>
        </section>

        <section className="mt-9">
          <SectionHeader title="Échanges récents près de toi" action="Voir tout" to="/exchanges" />

          {recentExchanges.length ? (
            <div className="troco-scrollbar-hide flex gap-4 overflow-x-auto pb-1">
              {recentExchanges.map((exchange) => (
                <RecentExchangeCard key={exchange.id} exchange={exchange} />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/80 bg-white/72 px-5 py-6 text-[14px] font-semibold text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
              Les échanges récents apparaîtront ici dès qu’ils seront disponibles.
            </div>
          )}
        </section>

        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-4">
            <SectionHeader title="Objets près de toi" />
            <div className="flex shrink-0 items-center gap-2">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setRadius(option.value)}
                  className={[
                    "rounded-full px-4 py-2 text-[12px] font-black transition",
                    radius === option.value
                      ? "bg-[#167a58] text-white shadow-[0_10px_22px_rgba(22,122,88,0.16)]"
                      : "bg-white/72 text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.035)]",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-[12px] font-black text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.035)]"
              >
                Plus de filtres
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {visibleItems.length ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleItems.map((item) => (
                <DesktopFeedCard
                  key={item.id}
                  item={item}
                  favorite={favoriteItemIds.includes(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-white/80 bg-white/76 p-10 text-center shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
              <p className="text-[18px] font-black tracking-[-0.035em] text-[#102033]">
                Aucun objet trouvé.
              </p>
              <p className="mt-2 text-[14px] font-medium text-slate-500">
                Essaie une autre recherche ou un autre rayon.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
