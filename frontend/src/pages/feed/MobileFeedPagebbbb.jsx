import { Heart, Map, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CategoryPills from "../../components/CategoryPills";
import TrocoPageHeader from "../../components/TrocoPageHeader";
import MobileLayout from "../../layouts/MobileLayout";
import useFeedItems, { getItemImage, getItemTitle, getItemLocation } from "../../hooks/useFeedItems";
import useFeedFilters, { RADIUS_OPTIONS } from "../../hooks/useFeedFilters";

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

function OwnerAvatar({ item, name }) {
  const photo = getOwnerPhoto(item);
  return (
    <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#E8F4EF] via-[#DDF1EA] to-[#F5EFE4] text-[#4C7468] shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
      {photo ? (
        <img
          src={photo}
          alt={name}
          draggable="false"
          className="pointer-events-none h-full w-full select-none object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[11px] font-black">
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
          ? "border-transparent bg-gradient-to-br from-[#19B79D] to-[#36C982] text-white shadow-[0_12px_26px_rgba(24,184,157,0.18)]"
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
  const location = getItemLocation(item);
  const ownerName = getOwnerName(item);
  const relativeTime = formatRelativeTime(item.createdAt || item.updatedAt);

  return (
    <Link
      to={`/items/${item.id}`}
      className="group block overflow-hidden rounded-[18px] border border-[#E4ECE8] bg-white/[0.985] shadow-[0_14px_34px_rgba(15,23,42,0.065)] transition active:scale-[0.992]"
    >
      <div className="relative overflow-hidden bg-[#F5F7F5]">
        <img
          src={getItemImage(item)}
          alt={title}
          className="aspect-[1.22/1] w-full object-cover contrast-[1.03] brightness-[1.01] saturate-[1.02] transition duration-500 group-active:scale-[0.995]"
        />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={[
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 shadow-[0_6px_14px_rgba(15,23,42,0.06)] backdrop-blur-md transition active:scale-95",
            favorite ? "text-rose-500" : "text-slate-400",
          ].join(" ")}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} strokeWidth={2.05} />
        </button>
      </div>

      <div className="relative p-2.5 pb-3">
        <h2 className="line-clamp-2 text-[12.5px] font-extrabold leading-tight tracking-[-0.04em] text-[#102033]">
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
            <span className="min-w-0 truncate text-[10.5px] leading-tight">
              <span className="font-semibold text-[#6b8a86]">par </span>
              <span className="font-black text-[#18A98E]">{ownerName}</span>
            </span>
          </button>
        ) : (
          <div className="mt-2 flex min-w-0 items-center gap-1.5">
            <OwnerAvatar item={item} name={ownerName} />
            <span className="min-w-0 truncate text-[10.5px] leading-tight">
              <span className="font-semibold text-[#6b8a86]">par </span>
              <span className="font-black text-[#18A98E]">{ownerName}</span>
            </span>
          </div>
        )}

        <p className="mt-2 flex items-center gap-1.5 truncate text-[10.5px] font-semibold text-[#66758A]">
          <MapPin size={13.5} className="text-[#18A98E]" strokeWidth={2.3} />
          <span>{location}</span>
          {relativeTime && (
            <>
              <span className="mx-1 text-slate-300">•</span>
              <span>{relativeTime}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MobileFeedPage({ showFilters, setShowFilters }) {
  const { user } = useAuth();

  const {
    visibleItems: allItems,
    favoriteItemIds,
    toggleFavorite,
  } = useFeedItems();

  const {
    search, setSearch,
    activeCategory, setActiveCategory,
    viewMode, setViewMode,
    radius, setRadius,
    hasActiveFilters,
    applyFilters,
  } = useFeedFilters();

  const visibleItems = applyFilters(allItems);

  return (
    <MobileLayout>
      <TrocoPageHeader variant="brand" user={user} className="-mt-1" />

      <section className="mt-0 space-y-3">
        {/* Barre de recherche */}
        <div className="flex items-center gap-2">
          <div className="flex h-[52px] flex-1 items-center gap-3 rounded-[17px] border border-[#E7DED2] bg-white px-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <Search size={21} strokeWidth={2.1} className="shrink-0 text-[#102033]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un objet..."
              className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#102033] outline-none placeholder:text-[#94A0AF]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters?.(true)}
            className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[17px] border border-[#E7DED2] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
          >
            <SlidersHorizontal size={20} strokeWidth={2.1} className="text-[#102033]" />
            {hasActiveFilters && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#18A98E]" />
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
                className="text-[13px] font-black text-[#18A98E]"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.20em] text-[#168A78]">
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

      {/* Résultats */}
      {visibleItems.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-[#E7DED2] bg-white p-7 text-center text-sm font-semibold text-[#66758A] shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          Aucun objet trouvé.
        </div>
      ) : viewMode === "map" ? (
        <div className="mt-5 rounded-[24px] border border-[#E7DED2] bg-white p-7 text-sm font-semibold text-[#66758A] shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          Carte en préparation.
        </div>
      ) : (
        <section className="mt-2 grid grid-cols-3 gap-2.5">
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
    </MobileLayout>
  );
}
