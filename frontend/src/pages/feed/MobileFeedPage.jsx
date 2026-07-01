import { useCallback, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import FavoriteUsersFeedSection from "../../components/FavoriteUsersFeedSection";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { SkeletonGrid } from "../../components/SkeletonCard";
import { Heart, List, Map, Navigation, Search, SlidersHorizontal, Zap } from "lucide-react";
import TrocoMap from "../../components/TrocoMap";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CategoryPills from "../../components/CategoryPills";
import TrocoPageHeader from "../../components/TrocoPageHeader";
import useFeedItems, { getItemImage, getItemTitle, getItemLocation, getItemCondition } from "../../hooks/useFeedItems";

const RADIUS_OPTIONS = [
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "Tout Paris", value: "all" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getOwnerId(item) {
  return (
    item?.ownerId || item?.userId || item?.ownerUid || item?.createdBy ||
    item?.uid || item?.owner?.id || item?.owner?.uid || item?.user?.id ||
    item?.user?.uid || item?.createdById || ""
  );
}

function getOwnerName(item) {
  const value =
    item?.ownerName || item?.ownerDisplayName || item?.userName ||
    item?.displayName || item?.createdByName || "";
  if (!value) return "Troqueur";
  if (String(value).includes("@")) return String(value).split("@")[0];
  const parts = clean(value).split(" ");
  return parts[0] || clean(value);
}

function getOwnerPhoto(item) {
  return (
    item?.ownerPhotoURL || item?.ownerPhotoUrl || item?.ownerAvatar ||
    item?.ownerProfilePhoto || item?.userPhotoURL || item?.userPhotoUrl ||
    item?.avatarUrl || ""
  );
}

function getInitial(value = "") {
  return String(value || "T").trim().charAt(0).toUpperCase() || "T";
}

function formatRelativeTime(value) {
  const date =
    value?.toDate?.() ||
    (value?.seconds ? new Date(value.seconds * 1000) : null) ||
    (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-400",
  "bg-green-500", "bg-rose-400", "bg-orange-400", "bg-amber-500",
];
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function OwnerAvatar({ item, name, size = "sm" }) {
  const photo = getOwnerPhoto(item);
  const color = getAvatarColor(name);
  const dim = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const text = size === "sm" ? "text-[8px]" : "text-[11px]";
  return (
    <span className={["flex shrink-0 overflow-hidden rounded-full text-white", dim, photo ? "" : color].join(" ")}>
      {photo ? (
        <img src={photo} alt={name} draggable="false" className="pointer-events-none h-full w-full select-none object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className={["flex h-full w-full items-center justify-center font-black", text].join(" ")}>
          {getInitial(name)}
        </span>
      )}
    </span>
  );
}

function DistancePill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[12px] font-bold transition active:scale-[0.97]",
        active
          ? "border-transparent bg-[#22C58B] text-white shadow-[0_4px_12px_rgba(34,197,139,0.22)]"
          : "border-[#E7ECEB] bg-white text-[#17212B]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MobileItemCard({ item, favorite, onToggleFavorite, carouselMode = false }) {
  const title = getItemTitle(item);
  const location = item.distanceLabel || getItemLocation(item);
  const ownerName = getOwnerName(item);
  const relativeTime = formatRelativeTime(item.createdAt || item.postedAt || item.updatedAt);

  return (
    <Link
      to={`/items/${item.id}`}
      className="group block overflow-hidden rounded-[18px] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] transition active:scale-[0.97]"
    >
      <div className="relative overflow-hidden bg-[#F2F4F3]">
        <img
          src={getItemImage(item)}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`${carouselMode ? "aspect-square" : "aspect-[4/5]"} w-full object-cover transition duration-300 group-active:scale-[0.99]`}
        />

        {/* Dégradé bas pour lisibilité */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={[
            "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition active:scale-90",
            favorite ? "text-[#22C58B]" : "text-[#6F7782]",
          ].join(" ")}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={12} fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
        </button>

        {item.isMatch && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#22C58B] px-2 py-0.5 text-[9px] font-black text-white shadow-[0_2px_8px_rgba(34,197,139,0.35)]">
            <Zap size={9} fill="currentColor" strokeWidth={0} />
            Match
          </span>
        )}

        {location && (
          <span className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
            {item.distanceLabel || location}
          </span>
        )}
      </div>

      <div className="px-2.5 py-2">
        <h2 className="line-clamp-1 text-[12px] font-extrabold leading-snug tracking-[-0.02em] text-[#17212B]">
          {title}
        </h2>
        <div className="mt-1.5 flex items-center gap-1.5">
          <OwnerAvatar item={item} name={ownerName} size="sm" />
          <p className="line-clamp-1 text-[10px] font-semibold text-[#6F7782]">
            {ownerName}
          </p>
          {relativeTime && (
            <p className="ml-auto shrink-0 text-[9.5px] font-medium text-[#b0bec5]">
              {relativeTime}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function SocialProofBlock({ items }) {
  const seen = new Set();
  const owners = [];
  for (const item of items) {
    const id = getOwnerId(item);
    if (id && !seen.has(id) && owners.length < 3) {
      seen.add(id);
      owners.push(item);
    }
  }

  if (owners.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#E7ECEB] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="flex -space-x-2">
        {owners.map((item, i) => (
          <div key={i} className="ring-2 ring-white rounded-full">
            <OwnerAvatar item={item} name={getOwnerName(item)} size="lg" />
          </div>
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-[#17212B]">
          Troqueurs près de vous
        </p>
        <p className="text-[10.5px] font-medium text-[#6F7782]">
          {items.length} objet{items.length > 1 ? "s" : ""} disponibles
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MobileFeedPage() {
  const { user } = useAuth();

  const {
    visibleItems,
    recentItems,
    favoriteItemIds,
    toggleFavorite,
    search, setSearch,
    activeCategory, setActiveCategory,
    viewMode, setViewMode,
    radius, setRadius,
    locationEnabled,
    loading,
  } = useFeedItems();

  const MIN_SECTION = 5;

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = showFilters ? "hidden" : prev;
    return () => { document.body.style.overflow = prev; };
  }, [showFilters]);

  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  const { pulling, pullDistance, refreshing, progress } = usePullToRefresh(handleRefresh);
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef(null);

  function handleSearchChange(value) {
    setLocalSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  }

  const hasActiveFilters = search.trim() !== "" || activeCategory !== "Tout" || radius !== 3000;
  const isFiltered = search.trim() !== "" || activeCategory !== "Tout";

  return (
    <>
      {/* Pull to refresh indicator */}
      {(pulling || refreshing) && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4 transition-all"
          style={{ transform: `translateY(${Math.min(pullDistance * 0.4, 32)}px)` }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
            {refreshing ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#22C58B] border-t-transparent" />
            ) : (
              <div
                className="h-3.5 w-3.5 rounded-full border-2 border-[#22C58B] border-t-transparent"
                style={{ transform: `rotate(${progress * 360}deg)` }}
              />
            )}
          </div>
        </div>
      )}

      <TrocoPageHeader variant="brand" user={user} className="-mt-1" />

      <section className="mt-1 space-y-2.5">
        {/* Barre de recherche */}
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-[#E7ECEB] bg-white px-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <Search size={15} strokeWidth={2} className="shrink-0 text-[#6F7782]" />
          <input
            value={localSearch}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Rechercher un objet…"
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#17212B] outline-none placeholder:text-[#94a3b8]"
          />
          <div className="h-3.5 w-px shrink-0 bg-[#E7ECEB]" />
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="relative shrink-0 p-0.5"
            aria-label="Filtres"
          >
            <SlidersHorizontal size={15} strokeWidth={2} className={hasActiveFilters ? "text-[#22C58B]" : "text-[#6F7782]"} />
            {hasActiveFilters && (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#22C58B]" />
            )}
          </button>
        </div>

        {/* Catégories */}
        <div className="-mx-4 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Toggle Liste / Carte */}
        <div className="flex w-fit items-center rounded-full bg-[#F0F3F2] p-[3px]">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={[
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition",
              viewMode !== "map"
                ? "bg-white text-[#17212B] shadow-[0_1px_6px_rgba(0,0,0,0.07)]"
                : "text-[#6F7782]",
            ].join(" ")}
          >
            <List size={12} strokeWidth={2.2} />
            Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={[
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition",
              viewMode === "map"
                ? "bg-white text-[#17212B] shadow-[0_1px_6px_rgba(0,0,0,0.07)]"
                : "text-[#6F7782]",
            ].join(" ")}
          >
            <Map size={12} strokeWidth={2.2} />
            Carte
          </button>
        </div>

      </section>

      {/* Panneau filtres */}
      {showFilters && (
        <>
          <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={() => setShowFilters(false)} />
          <div className="fixed inset-x-0 bottom-[80px] z-50 flex max-h-[calc(60vh-80px)] flex-col rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.12)]">
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E7ECEB]" />
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-black tracking-[-0.04em] text-[#17212B]">Filtres</h3>
                <button type="button" onClick={() => setShowFilters(false)} className="text-[13px] font-bold text-[#22C58B]">
                  Fermer
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.20em] text-[#6F7782]">Distance</p>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((option) => (
                  <DistancePill key={option.label} active={radius === option.value} onClick={() => setRadius(option.value)}>
                    {option.label}
                  </DistancePill>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bloc social */}
      {!isFiltered && viewMode !== "map" && visibleItems.length > 0 && (
        <div className="mt-3">
          <SocialProofBlock items={visibleItems} />
        </div>
      )}

      {/* Troqueurs favoris */}
      {!isFiltered && viewMode !== "map" && (
        <FavoriteUsersFeedSection cardWidth="w-[120px]" maxItems={6} />
      )}

      {/* Carrousel Nouveautés */}
      {!isFiltered && viewMode !== "map" && recentItems.length >= MIN_SECTION && (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-black tracking-[-0.01em] text-[#17212B]">
              Nouveautés
            </p>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <motion.div
              className="flex gap-3"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {recentItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="w-[128px] shrink-0"
                  variants={{
                    hidden: { opacity: 0, x: 12 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] } },
                  }}
                >
                  <MobileItemCard
                    item={item}
                    favorite={favoriteItemIds.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                    carouselMode
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Titre grille */}
      {!isFiltered && viewMode !== "map" && recentItems.length >= MIN_SECTION && (
        <p className="mt-5 mb-2.5 text-[12px] font-black tracking-[-0.01em] text-[#17212B]">
          Tous les objets
        </p>
      )}

      {/* Résultats */}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : visibleItems.length === 0 ? (
        <div className="mt-4 rounded-[20px] border border-[#E7ECEB] bg-white p-8 text-center text-[13px] font-semibold text-[#6F7782]">
          Aucun objet trouvé.
        </div>
      ) : viewMode === "map" ? (
        <TrocoMap items={visibleItems} className="mt-2 h-[calc(100vh-200px)]" onBackToList={() => setViewMode("list")} />
      ) : (
        <motion.section
          className="mt-1 grid grid-cols-2 gap-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {visibleItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } },
              }}
            >
              <MobileItemCard
                item={item}
                favorite={favoriteItemIds.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            </motion.div>
          ))}
        </motion.section>
      )}
    </>
  );
}
