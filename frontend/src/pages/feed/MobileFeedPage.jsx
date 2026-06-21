import { useCallback, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import FavoriteUsersFeedSection from "../../components/FavoriteUsersFeedSection";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { SkeletonGrid } from "../../components/SkeletonCard";
import { Heart, List, Map, Navigation, Search, SlidersHorizontal } from "lucide-react";
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
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-violet-500", "bg-pink-500", "bg-orange-500", "bg-amber-500",
];
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function OwnerAvatar({ item, name, size = "sm" }) {
  const photo = getOwnerPhoto(item);
  const color = getAvatarColor(name);
  const dim = size === "sm" ? "h-[16px] w-[16px]" : "h-[26px] w-[26px]";
  const text = size === "sm" ? "text-[7px]" : "text-[10px]";
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
        "inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[12px] border px-3.5 text-[11px] font-bold tracking-[-0.01em] transition active:scale-[0.98]",
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
  const relativeTime = formatRelativeTime(item.createdAt || item.updatedAt);
  const condition = getItemCondition(item);

  return (
    <Link
      to={`/items/${item.id}`}
      className="group block overflow-hidden rounded-[16px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition active:scale-[0.97]"
    >
      <div className="relative overflow-hidden bg-[#F0F0EE]">
        <img
          src={getItemImage(item)}
          alt={title}
          className={`${carouselMode ? "aspect-square" : "aspect-[4/5]"} w-full object-cover transition duration-300 group-active:scale-[0.99]`}
        />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={[
            "absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/85 shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition active:scale-90",
            favorite ? "text-[#22C58B]" : "text-[#6F7782]",
          ].join(" ")}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={11} fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
        </button>

        {location && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center rounded-full bg-black/38 px-1.5 py-0.5 text-[8.5px] font-semibold text-white backdrop-blur-sm">
            {item.distanceLabel || location}
          </span>
        )}

        {condition && (
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold text-[#17212B]">
            {condition}
          </span>
        )}
      </div>

      <div className="p-2">
        <h2 className="line-clamp-1 text-[11.5px] font-extrabold leading-snug tracking-[-0.02em] text-[#17212B]">
          {title}
        </h2>
        <div className="mt-1 flex items-center gap-1">
          <OwnerAvatar item={item} name={ownerName} size="sm" />
          <p className="line-clamp-1 text-[9.5px] font-medium text-[#6F7782]">
            {ownerName}
          </p>
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
    <div className="flex items-center gap-3 rounded-[14px] border border-[#EDF2F1] bg-white px-3.5 py-2.5">
      <div className="flex -space-x-1.5">
        {owners.map((item, i) => (
          <OwnerAvatar key={i} item={item} name={getOwnerName(item)} size="lg" />
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[#17212B]">
          Les trocs près de chez vous
        </p>
        <p className="text-[10px] font-medium text-[#6F7782]">
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
    requestLocation,
    locationError,
    clearLocationError,
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

      <section className="mt-0 space-y-2">
        {/* Barre de recherche */}
        <div className="flex h-[42px] items-center gap-2.5 rounded-[21px] border border-[#E7ECEB] bg-white px-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <Search size={16} strokeWidth={2} className="shrink-0 text-[#6F7782]" />
          <input
            value={localSearch}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Rechercher un objet..."
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#17212B] outline-none placeholder:text-[#6F7782]"
          />
          <div className="h-3.5 w-px shrink-0 bg-[#E7ECEB]" />
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="relative shrink-0 p-0.5"
            aria-label="Filtres"
          >
            <SlidersHorizontal size={16} strokeWidth={2} className="text-[#17212B]" />
            {hasActiveFilters && (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#22C58B]" />
            )}
          </button>
        </div>

        {/* Catégories */}
        <div className="-mx-4 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Toggle Liste / Carte — iOS segmented control */}
        <div className="flex w-fit items-center rounded-[11px] bg-[#F2F5F5] p-[3px]">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={[
              "flex items-center gap-1 rounded-[8px] px-3.5 py-1 text-[11.5px] font-semibold transition",
              viewMode !== "map"
                ? "bg-white text-[#17212B] shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
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
              "flex items-center gap-1 rounded-[8px] px-3.5 py-1 text-[11.5px] font-semibold transition",
              viewMode === "map"
                ? "bg-white text-[#17212B] shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                : "text-[#6F7782]",
            ].join(" ")}
          >
            <Map size={12} strokeWidth={2.2} />
            Carte
          </button>
        </div>

        {/* Bannière localisation */}
        {locationError === "denied" ? (
          <div className="flex items-start gap-3 rounded-[14px] border border-amber-100 bg-amber-50 px-3.5 py-2.5">
            <Navigation size={14} strokeWidth={2.2} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-bold text-amber-700">Localisation refusée</p>
              <p className="mt-0.5 text-[10.5px] font-medium leading-relaxed text-amber-600">
                Réglages → Safari → Localisation → Autoriser
              </p>
            </div>
            <button type="button" onClick={clearLocationError} className="shrink-0 text-amber-400 text-[15px] leading-none">×</button>
          </div>
        ) : locationError ? (
          <div className="flex items-center gap-3 rounded-[14px] border border-rose-100 bg-rose-50 px-3.5 py-2.5">
            <Navigation size={14} strokeWidth={2.2} className="shrink-0 text-rose-400" />
            <p className="flex-1 text-[11.5px] font-bold text-rose-600">{locationError}</p>
            <button type="button" onClick={clearLocationError} className="shrink-0 text-rose-300 text-[15px] leading-none">×</button>
          </div>
        ) : !locationEnabled ? (
          <button
            type="button"
            onClick={requestLocation}
            className="flex w-full items-center gap-2.5 rounded-[14px] border border-[#D8EFE9] bg-[#F0FAF7] px-3.5 py-2.5 text-left transition active:scale-[0.98]"
          >
            <Navigation size={14} strokeWidth={2.2} className="shrink-0 text-[#22C58B]" />
            <p className="text-[11.5px] font-semibold text-[#17212B]">
              Activer ma position pour voir les distances
            </p>
          </button>
        ) : null}
      </section>

      {/* Panneau filtres */}
      {showFilters && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowFilters(false)} />
          <div className="fixed inset-x-0 bottom-[80px] z-50 flex max-h-[calc(75vh-80px)] flex-col rounded-t-[28px] bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.14)]">
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E7ECEB]" />
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black tracking-[-0.04em] text-[#17212B]">Filtres</h3>
                <button type="button" onClick={() => setShowFilters(false)} className="text-[13px] font-bold text-[#22C58B]">
                  Fermer
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
              {!locationEnabled && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="mb-4 flex w-full items-center gap-3 rounded-[16px] border border-[#E7ECEB] bg-white px-4 py-3 text-left transition active:scale-[0.98]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF8F3] text-[#22C58B]">
                    <Navigation size={15} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#17212B]">Activer ma position</p>
                    <p className="text-[11px] font-medium text-[#6F7782]">Pour voir les distances autour de toi</p>
                  </div>
                </button>
              )}

              {locationEnabled && (
                <div className="mb-4 flex items-center gap-2.5 rounded-[14px] bg-[#EBF8F3] px-3.5 py-2.5">
                  <Navigation size={14} strokeWidth={2.2} className="shrink-0 text-[#22C58B]" />
                  <p className="text-[12px] font-semibold text-[#17212B]">Position activée</p>
                </div>
              )}

              <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.20em] text-[#22C58B]">Distance</p>
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
      {!isFiltered && visibleItems.length > 0 && (
        <div className="mt-3">
          <SocialProofBlock items={visibleItems} />
        </div>
      )}

      {/* Troqueurs favoris */}
      {!isFiltered && (
        <FavoriteUsersFeedSection cardWidth="w-[120px]" maxItems={6} />
      )}

      {/* Carrousel Nouveautés */}
      {!isFiltered && recentItems.length >= MIN_SECTION && (
        <section className="mt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1E2B36]">
              ✨ Nouveautés
            </p>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <motion.div
              className="flex gap-2.5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {recentItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="w-[115px] shrink-0"
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
      {!isFiltered && recentItems.length >= MIN_SECTION && (
        <p className="mt-4 mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#1E2B36]">
          Tous les objets
        </p>
      )}

      {/* Résultats */}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : visibleItems.length === 0 ? (
        <div className="mt-4 rounded-[20px] border border-[#E7ECEB] bg-white p-6 text-center text-[13px] font-semibold text-[#6F7782]">
          Aucun objet trouvé.
        </div>
      ) : viewMode === "map" ? (
        <TrocoMap items={visibleItems} className="mt-2 h-[calc(100vh-280px)]" onBackToList={() => setViewMode("list")} />
      ) : (
        <motion.section
          className="mt-1.5 grid grid-cols-2 gap-2.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {visibleItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] } },
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
