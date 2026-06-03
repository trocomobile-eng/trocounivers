import { useCallback, useEffect, useRef, useState } from "react";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { SkeletonGrid } from "../../components/SkeletonCard";
import { Heart, Map, Navigation, Search, SlidersHorizontal, Zap } from "lucide-react";
import TrocoMap from "../../components/TrocoMap";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CategoryPills from "../../components/CategoryPills";
import TrocoPageHeader from "../../components/TrocoPageHeader";
import useFeedItems, { getItemImage, getItemTitle, getItemLocation } from "../../hooks/useFeedItems";

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

function getOwnerProfilePath(item) {
  const ownerId = getOwnerId(item);
  return ownerId ? `/users/${ownerId}` : "";
}

function getOwnerName(item) {
  const value =
    item?.ownerName || item?.ownerDisplayName || item?.userName ||
    item?.displayName || item?.createdByName || "";
  if (!value) return "Utilisateur Troco";
  if (String(value).includes("@")) return String(value).split("@")[0];
  const parts = clean(value).split(" ");
  if (parts.length > 1) return `${parts[0]} ${parts[1].charAt(0)}.`;
  return clean(value);
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

function OwnerAvatar({ item, name }) {
  const photo = getOwnerPhoto(item);
  const color = getAvatarColor(name);
  return (
    <span className={["flex h-[22px] w-[22px] shrink-0 overflow-hidden rounded-full text-white", photo ? "" : color].join(" ")}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          draggable="false"
          className="pointer-events-none h-full w-full select-none object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] font-black">
          {getInitial(name)}
        </span>
      )}
    </span>
  );
}

function DistancePill({ active, children, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-[42px] shrink-0 items-center gap-2 rounded-[16px] border px-4 text-[11.5px] font-black tracking-[-0.015em] transition active:scale-[0.98]",
        active
          ? "border-transparent bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-white shadow-[0_12px_26px_rgba(24,184,157,0.18)]"
          : "border-[#E6EFEB] bg-white/96 text-[#1F2A37] shadow-[0_8px_22px_rgba(15,23,42,0.045)]",
      ].join(" ")}
    >
      {Icon && <Icon size={18} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

function MobileItemCard({ item, favorite, onToggleFavorite }) {
  const navigate = useNavigate();
  const title = getItemTitle(item);
  const location = item.distanceLabel || getItemLocation(item);
  const ownerName = getOwnerName(item);
  const relativeTime = formatRelativeTime(item.createdAt || item.updatedAt);

  return (
    <Link
      to={`/items/${item.id}`}
      className="group block overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.07)] transition active:scale-[0.98]"
    >
      <div className="relative overflow-hidden bg-[#F0F0EE]">
        <img
          src={getItemImage(item)}
          alt={title}
          className="aspect-square w-full object-cover transition duration-300 group-active:scale-[0.99]"
        />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={[
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition active:scale-95",
            favorite ? "text-[#1ABEA3]" : "text-slate-400",
          ].join(" ")}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} strokeWidth={2.1} />
        </button>

        {item.isMatch && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[#1ABEA3] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            <Zap size={9} strokeWidth={2.5} fill="currentColor" />
            Match
          </span>
        )}
      </div>

      <div className="p-3">
        <h2 className="line-clamp-2 text-[14px] font-extrabold leading-snug tracking-[-0.02em] text-[#0d1b2a]">
          {title}
        </h2>

        {getOwnerProfilePath(item) ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigate(getOwnerProfilePath(item));
            }}
            className="mt-2 flex min-w-0 items-center gap-1.5 rounded-full text-left transition active:scale-[0.98]"
          >
            <OwnerAvatar item={item} name={ownerName} />
            <span className="min-w-0 truncate text-[12px] font-bold text-[#1ABEA3]">
              {ownerName}
            </span>
          </button>
        ) : (
          <div className="mt-2 flex min-w-0 items-center gap-1.5">
            <OwnerAvatar item={item} name={ownerName} />
            <span className="min-w-0 truncate text-[12px] font-bold text-[#1ABEA3]">
              {ownerName}
            </span>
          </div>
        )}

        <p className="mt-1.5 truncate text-[11.5px] font-medium text-[#94a3b8]">
          {[location, relativeTime].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
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
    loading,
  } = useFeedItems();

  const MIN_SECTION = 5;

  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = useCallback(async () => {
    // Force reload des items
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

  return (
    <>
      {/* Pull to refresh indicator */}
      {(pulling || refreshing) && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4 transition-all"
          style={{ transform: `translateY(${Math.min(pullDistance * 0.4, 32)}px)` }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(15,23,42,0.12)]">
            {refreshing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1ABEA3] border-t-transparent" />
            ) : (
              <div
                className="h-4 w-4 rounded-full border-2 border-[#1ABEA3] border-t-transparent"
                style={{ transform: `rotate(${progress * 360}deg)` }}
              />
            )}
          </div>
        </div>
      )}
      <TrocoPageHeader variant="brand" user={user} className="-mt-1" />

      <section className="mt-0 space-y-3">
        {/* Barre de recherche */}
        <div className="flex items-center gap-2">
          <div className="flex h-[52px] flex-1 items-center gap-3 rounded-[17px] border border-[#E4ECE8] bg-white px-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <Search size={21} strokeWidth={2.1} className="shrink-0 text-[#102033]" />
            <input
              value={localSearch}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Rechercher un objet..."
              className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#102033] outline-none placeholder:text-[#94A0AF]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters?.(true)}
            className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[17px] border border-[#E4ECE8] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
          >
            <SlidersHorizontal size={20} strokeWidth={2.1} className="text-[#102033]" />
            {hasActiveFilters && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#1ABEA3]" />
            )}
          </button>
        </div>

        {/* Catégories */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>
      </section>

      {/* Panneau filtres */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setShowFilters?.(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5 shadow-[0_-20px_60px_rgba(15,23,42,0.18)]">
            <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[#D7E4DF]" />

            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-black tracking-[-0.04em] text-[#102033]">
                Filtres
              </h3>
              <button
                type="button"
                onClick={() => setShowFilters?.(false)}
                className="text-[13px] font-black text-[#1ABEA3]"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6">
              {/* Géolocalisation */}
              {!locationEnabled && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="mb-5 flex w-full items-center gap-3 rounded-[18px] border border-[#E4ECE8] bg-white px-4 py-3.5 text-left shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7EF] text-[#1ABEA3]">
                    <Navigation size={16} strokeWidth={2.3} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#0d1b2a]">Activer ma position</p>
                    <p className="text-[11px] font-medium text-[#94a3b8]">Pour voir les distances autour de toi</p>
                  </div>
                </button>
              )}

              {locationEnabled && (
                <div className="mb-5 flex items-center gap-3 rounded-[18px] bg-[#E8F7EF] px-4 py-3">
                  <Navigation size={15} strokeWidth={2.3} className="shrink-0 text-[#1ABEA3]" />
                  <p className="text-[12px] font-bold text-[#0f9f9a]">Position activée</p>
                </div>
              )}

              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.20em] text-[#1ABEA3]">
                Distance
              </p>

              <div className="flex flex-wrap gap-2.5">
                {RADIUS_OPTIONS.map((option) => (
                  <DistancePill
                    key={option.label}
                    active={radius === option.value}
                    onClick={() => setRadius(option.value)}
                  >
                    {option.label}
                  </DistancePill>
                ))}

                <DistancePill
                  active={viewMode === "map"}
                  icon={Map}
                  onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
                >
                  Carte
                </DistancePill>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Carrousel Nouveautés */}
      {!search.trim() && activeCategory === "Tout" && recentItems.length >= MIN_SECTION && (
        <section className="mt-4">
          <p className="mb-3 text-[13px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
            ✨ Nouveautés
          </p>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3">
              {recentItems.map((item) => (
                <div key={item.id} className="w-[150px] shrink-0">
                  <MobileItemCard
                    item={item}
                    favorite={favoriteItemIds.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Résultats */}
      {!search.trim() && activeCategory === "Tout" && recentItems.length >= MIN_SECTION && (
        <p className="mt-5 mb-2 text-[13px] font-black uppercase tracking-[0.18em] text-slate-400">
          Tous les objets
        </p>
      )}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : visibleItems.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-[#E4ECE8] bg-white p-7 text-center text-sm font-semibold text-[#66758A] shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          Aucun objet trouvé.
        </div>
      ) : viewMode === "map" ? (
        <TrocoMap items={visibleItems} className="mt-2 h-[calc(100vh-280px)]" onBackToList={() => setViewMode("list")} />
      ) : (
        <section className="mt-2 grid grid-cols-2 gap-3">
          {visibleItems.map((item) => (
            <MobileItemCard
              key={item.id}
              item={item}
              favorite={favoriteItemIds.includes(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </section>
      )}
    </>
  );
}
