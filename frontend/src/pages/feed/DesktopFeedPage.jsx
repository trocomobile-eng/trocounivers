import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, List, Map, MapPin, Navigation, Search, SlidersHorizontal, Zap } from "lucide-react";
import FavoriteUsersFeedSection from "../../components/FavoriteUsersFeedSection";
import CommunautesStrip from "../../components/CommunautesStrip";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CategoryPills from "../../components/CategoryPills";
import TrocoMap from "../../components/TrocoMap";
import { TrocoCard, TrocoInput } from "../../components/ui";
import { formatCondition } from "../../utils/format";
import useFeedItems, {
  getItemImage,
  getItemTitle,
  getItemLocation,
} from "../../hooks/useFeedItems";
import { useRecommendations } from "../../hooks/useRecommendations";

const DESKTOP_RADIUS_OPTIONS = [
  { label: "Autour de moi", value: 500, icon: Navigation },
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "10 km", value: 10000 },
  { label: "20 km+", value: "all" },
];

function DesktopFilterPill({ active, children, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[12px] font-semibold transition active:scale-[0.97]",
        active
          ? "border-transparent bg-[#22C58B] text-white shadow-[0_4px_12px_rgba(34,197,139,0.22)]"
          : "border-[#E7ECEB] bg-white text-[#17212B]",
      ].join(" ")}
    >
      {Icon && <Icon size={14} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function getOwnerName(item) {
  const value =
    item?.ownerName ||
    item?.ownerDisplayName ||
    item?.userName ||
    item?.displayName ||
    "";
  if (!value) return "";
  if (String(value).includes("@")) return String(value).split("@")[0];
  const parts = String(value).trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0]} ${parts[1].charAt(0)}.`;
  return value;
}

function getOwnerId(item) {
  return item?.ownerId || item?.userId || item?.ownerUid || item?.createdBy || item?.uid || item?.owner?.uid || item?.user?.uid || "";
}

function getOwnerProfilePath(item) {
  const ownerId = getOwnerId(item);
  return ownerId ? `/users/${ownerId}` : "";
}

function getOwnerPhoto(item) {
  return item?.ownerPhotoURL || item?.ownerPhotoUrl || item?.ownerAvatar || item?.ownerProfilePhoto || item?.userPhotoURL || "";
}

function formatRelativeTime(value) {
  const raw =
    value?.toDate?.() ||
    (value?.seconds ? new Date(value.seconds * 1000) : null) ||
    (value ? new Date(value) : null);
  if (!raw || Number.isNaN(raw.getTime())) return "";
  const diff = Date.now() - raw.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return raw.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-400",
  "bg-green-500", "bg-rose-400", "bg-orange-400", "bg-amber-500",
];
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export function DesktopFeedCard({ item, favorite, onToggleFavorite }) {
  const navigate = useNavigate();
  const title = getItemTitle(item);
  const location = item.distanceLabel || getItemLocation(item);
  const ownerName = getOwnerName(item);
  const ownerPhoto = getOwnerPhoto(item);
  const relativeTime = formatRelativeTime(item?.createdAt || item?.postedAt || item?.updatedAt);
  const condition = formatCondition(item?.conditionLabel || item?.condition || item?.state || item?.itemCondition || "");

  return (
    <TrocoCard
      as={Link}
      to={`/items/${item.id}`}
      variant="plain"
      className="group block overflow-hidden rounded-[18px] bg-white p-0 text-left transition hover:-translate-y-0.5 shadow-[0_2px_12px_rgba(15,23,42,0.07)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.11)]"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#F2F4F3]">
        <img
          src={getItemImage(item)}
          alt={title}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.012]"
        />

        {item.isMatch && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#22C58B] px-2 py-0.5 text-[9px] font-black text-white shadow-[0_2px_8px_rgba(34,197,139,0.35)]">
            <Zap size={9} fill="currentColor" strokeWidth={0} />
            Match
          </span>
        )}

        <motion.button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite?.(item.id);
          }}
          whileTap={{ scale: 0.78 }}
          className={[
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-[0_2px_8px_rgba(15,23,42,0.10)]",
            favorite ? "text-[#22C58B]" : "text-[#6F7782]",
          ].join(" ")}
        >
          <motion.span
            animate={favorite ? { scale: [1, 1.4, 0.85, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.38 }}
            className="flex"
          >
            <Heart size={14} fill={favorite ? "currentColor" : "none"} strokeWidth={2.1} />
          </motion.span>
        </motion.button>
      </div>

      {/* Infos */}
      <div className="p-3">
        <h2 className="line-clamp-2 text-[13.5px] font-bold leading-snug tracking-[-0.02em] text-[#17212B]">
          {title}
        </h2>

        {/* Owner */}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (getOwnerProfilePath(item)) navigate(getOwnerProfilePath(item));
          }}
          className="mt-2 flex min-w-0 items-center gap-1.5"
        >
          <span className={["flex h-5 w-5 shrink-0 overflow-hidden items-center justify-center rounded-full text-[8px] font-black text-white", ownerPhoto ? "" : getAvatarColor(ownerName)].join(" ")}>
            {ownerPhoto
              ? <img src={ownerPhoto} alt={ownerName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              : (ownerName || "?").charAt(0).toUpperCase()
            }
          </span>
          <span className="min-w-0 truncate text-[11.5px] font-semibold text-[#22C58B]">
            {ownerName || "Utilisateur"}
          </span>
        </button>

        {/* Location */}
        {location && (
          <p className="mt-1 flex items-center gap-1 truncate text-[10.5px] font-medium text-[#94a3b8]">
            <MapPin size={9} strokeWidth={2.2} className="shrink-0" />
            {location}
          </p>
        )}

        {/* Condition + date */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {condition && (
            <span className="inline-flex items-center rounded-full bg-[#F0FAF7] px-2 py-0.5 text-[10px] font-bold text-[#1ABEA3]">
              {condition}
            </span>
          )}
          {relativeTime && (
            <p className="ml-auto shrink-0 truncate text-[10px] font-medium text-[#b0bec5]">
              {relativeTime}
            </p>
          )}
        </div>
      </div>
    </TrocoCard>
  );
}

function CarouselSection({ title, icon, items, favoriteItemIds, toggleFavorite, extra }) {
  const scrollRef = useRef(null);

  function scroll(dir) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 440, behavior: "smooth" });
  }

  return (
    <section className="mt-8 rounded-[20px] bg-white px-5 pt-5 pb-6 shadow-[0_2px_14px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0FAF7] text-[15px]">
            {icon}
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">
            {title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {extra}
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8ecec] bg-white text-[#17212B] shadow-sm transition hover:bg-[#F4F8F6] active:scale-95"
            aria-label="Précédent"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8ecec] bg-white text-[#17212B] shadow-sm transition hover:bg-[#F4F8F6] active:scale-95"
            aria-label="Suivant"
          >
            <ChevronRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <motion.div
          className="flex gap-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="w-[192px] shrink-0"
              variants={{
                hidden: { opacity: 0, x: 16 },
                show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
              }}
            >
              <DesktopFeedCard
                item={item}
                favorite={favoriteItemIds.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function DesktopFeedPage() {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);

  const {
    visibleItems,
    recentItems,
    favoriteItemIds,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    viewMode,
    setViewMode,
    radius,
    setRadius,
    toggleFavorite,
    locationEnabled,
  } = useFeedItems();

  const MIN_SECTION = 5;
  const recommendations = useRecommendations(visibleItems);

  return (
    <main className="mx-auto w-full max-w-[1480px] px-8 py-8">

      {/* ── Header ── */}
      <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,540px)]">
        <div className="min-w-0">
          <h1 className="troco-soft-title text-[48px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#0d1b2a]">
            Autour de toi
          </h1>
          <p className="mt-2 text-[14.5px] font-medium text-[#6F7782]">
            Découvre les objets près de chez toi et donne-leur une seconde vie.
          </p>
        </div>

        <div className="relative">
          <TrocoInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un objet, un membre…"
            icon={<Search size={18} strokeWidth={2.2} />}
            rightIcon={
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowFilters((current) => !current);
                }}
                className="relative -mr-1 flex h-9 w-9 items-center justify-center rounded-full text-[#102033] transition hover:bg-[#F4F8F6] active:scale-95"
                aria-label="Ouvrir les filtres"
              >
                <SlidersHorizontal size={18} strokeWidth={2.1} />
                {(radius !== 500 || viewMode === "map") && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#18A98E]" />
                )}
              </button>
            }
            className="troco-search-surface w-full border-[#E7DED2] bg-white px-4"
            inputClassName="text-[14.5px] font-medium text-[#344256] placeholder:text-[#94A0AF]"
          />

          {showFilters && (
            <>
              <button
                type="button"
                aria-label="Fermer les filtres"
                className="fixed inset-0 z-30 cursor-default bg-transparent"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[480px] rounded-[20px] border border-[#E4ECE8] bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-extrabold text-[#0d1b2a]">Filtres</p>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-[12px] font-bold text-[#1ABEA3] transition hover:opacity-70"
                  >
                    Fermer
                  </button>
                </div>
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                  Distance
                </p>
                <div className="flex flex-wrap gap-2">
                  {DESKTOP_RADIUS_OPTIONS.map((option) => (
                    <DesktopFilterPill
                      key={option.label}
                      active={radius === option.value}
                      icon={option.icon}
                      onClick={() => setRadius(option.value)}
                    >
                      {option.label}
                    </DesktopFilterPill>
                  ))}
                  <div className="h-9 w-px bg-[#E7ECEB]" />
                  <DesktopFilterPill
                    active={viewMode !== "map"}
                    icon={List}
                    onClick={() => { setViewMode("list"); setShowFilters(false); }}
                  >
                    Liste
                  </DesktopFilterPill>
                  <DesktopFilterPill
                    active={viewMode === "map"}
                    icon={Map}
                    onClick={() => { setViewMode("map"); setShowFilters(false); }}
                  >
                    Carte
                  </DesktopFilterPill>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="mt-6 overflow-x-auto pb-1 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* ── Recommandations ── */}
      {!search.trim() && activeCategory === "Tout" && viewMode !== "map" && recommendations.length > 0 && (
        <CarouselSection
          title="Pour toi"
          icon="⭐"
          items={recommendations}
          favoriteItemIds={favoriteItemIds}
          toggleFavorite={toggleFavorite}
        />
      )}

      {/* ── Nouveautés ── */}
      {!search.trim() && activeCategory === "Tout" && viewMode !== "map" && recentItems.length >= MIN_SECTION && (
        <CarouselSection
          title="Nouveautés"
          icon="✨"
          items={recentItems}
          favoriteItemIds={favoriteItemIds}
          toggleFavorite={toggleFavorite}
        />
      )}

      {/* ── Nouveautés de vos favoris ── */}
      {!search.trim() && activeCategory === "Tout" && viewMode !== "map" && (
        <FavoriteUsersFeedSection cardWidth="w-[192px]" maxItems={8} />
      )}

      {/* ── Communautés ── */}
      {!search.trim() && activeCategory === "Tout" && viewMode !== "map" && (
        <div className="mt-8">
          <CommunautesStrip />
        </div>
      )}

      {/* ── Tous les objets ── */}
      {!search.trim() && activeCategory === "Tout" && viewMode !== "map" && recentItems.length >= MIN_SECTION && (
        <p className="mt-8 mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          Tous les objets
        </p>
      )}

      {viewMode === "map" ? (
        <TrocoMap items={visibleItems} className="mt-4 h-[calc(100vh-220px)]" />
      ) : visibleItems.length === 0 ? (
        <div className="mt-4 rounded-[20px] bg-white p-8 text-center text-sm font-medium text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          Aucun objet trouvé.
        </div>
      ) : (
        <motion.section
          className="mt-2 grid grid-cols-3 gap-5 xl:grid-cols-4 2xl:grid-cols-5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.055 } } }}
        >
          {visibleItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } },
              }}
            >
              <DesktopFeedCard
                item={item}
                favorite={favoriteItemIds.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            </motion.div>
          ))}
        </motion.section>
      )}
    </main>
  );
}
