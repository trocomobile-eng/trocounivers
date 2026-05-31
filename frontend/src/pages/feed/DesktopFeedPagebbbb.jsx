import { useState } from "react";
import { Heart, Map, Navigation, Search, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CategoryPills from "../../components/CategoryPills";
import { TrocoCard, TrocoInput } from "../../components/ui";
import { formatCondition } from "../../utils/format";
import useFeedItems, {
  getItemImage,
  getItemTitle,
  getItemLocation,
} from "../../hooks/useFeedItems";

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
        "inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[14px] border px-3.5 text-[12px] font-extrabold transition active:scale-[0.98]",
        active
          ? "border-transparent bg-[#18A98E] text-white shadow-[0_10px_22px_rgba(24,169,142,0.18)]"
          : "border-[#E4ECE8] bg-white text-[#102033] shadow-[0_6px_16px_rgba(15,23,42,0.035)]",
      ].join(" ")}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
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

function DesktopFeedCard({ item, favorite, onToggleFavorite }) {
  const navigate = useNavigate();
  const title = getItemTitle(item);
  const location = getItemLocation(item);
  const ownerName = getOwnerName(item);
  const relativeTime = formatRelativeTime(item?.createdAt || item?.postedAt || item?.updatedAt);
  const condition = formatCondition(item?.conditionLabel || item?.condition || item?.state || item?.itemCondition || "");

  return (
    <TrocoCard
      as={Link}
      to={`/items/${item.id}`}
      variant="plain"
      className="group block overflow-hidden rounded-[24px] border border-[#E4ECE8] bg-white/[0.985] p-0 text-left shadow-[0_14px_34px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5"
    >
      <div className="relative overflow-hidden bg-slate-100">
        <img
          src={getItemImage(item)}
          alt={title}
          className="aspect-[1.04/1] w-full object-cover object-center contrast-[1.03] brightness-[1.01] saturate-[1.02] transition duration-700 group-hover:scale-[1.025]"
        />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={[
            "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/64 shadow-[0_8px_22px_rgba(15,23,42,0.065)] backdrop-blur-md transition active:scale-95",
            favorite ? "text-rose-500" : "text-slate-500",
          ].join(" ")}
        >
          <Heart size={16} fill={favorite ? "currentColor" : "none"} strokeWidth={2.15} />
        </button>
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <h2 className="line-clamp-2 text-[16px] font-extrabold leading-tight tracking-[-0.035em] text-[#081225]">
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
            className="mt-1.5 line-clamp-1 text-left text-[12.5px] leading-relaxed"
          >
            <span className="font-medium text-[#6b8a86]">par </span>
            <span className="font-semibold text-[#18A98E]">{ownerName || "Utilisateur Troco"}</span>
          </button>
        ) : (
          <p className="mt-1.5 line-clamp-1 text-[12.5px] leading-relaxed">
            <span className="font-medium text-[#6b8a86]">par </span>
            <span className="font-semibold text-[#18A98E]">{ownerName || "Utilisateur Troco"}</span>
          </p>
        )}

        <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-slate-400">
          {[location, relativeTime].filter(Boolean).join(" · ")}
        </p>

        {condition && (
          <div className="mt-2.5">
            <span className="inline-flex items-center rounded-full bg-emerald-50/90 px-2.5 py-1 text-[10.5px] font-bold leading-none text-[#0f8f7f]">
              {condition}
            </span>
          </div>
        )}
      </div>
    </TrocoCard>
  );
}

export default function DesktopFeedPage() {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);

  const {
    visibleItems,
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
  } = useFeedItems();

  return (
    <main className="mx-auto w-full max-w-[1480px] px-8 py-6">
        <section>
          <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
            <div className="min-w-0">
              <h1 className="troco-soft-title text-[35px] font-extrabold leading-[1.5] tracking-[-0.045em] text-[#102033]">
                Autour de toi
              </h1>
            </div>

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
          </div>
        </section>

        <section className="mt-2 overflow-x-auto pb-1 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
        </section>

        {showFilters && (
          <>
            {/* Overlay transparent pour fermer */}
            <button
              type="button"
              aria-label="Fermer les filtres"
              className="fixed inset-0 z-30 cursor-default bg-transparent"
              onClick={() => setShowFilters(false)}
            />

            {/* Dropdown ancré à droite sous la search bar */}
            <div className="relative z-40 flex justify-end">
              <div className="absolute right-0 top-2 w-[360px] rounded-[20px] border border-[#E4ECE8] bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
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

                  <DesktopFilterPill
                    active={viewMode === "map"}
                    icon={Map}
                    onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
                  >
                    Carte
                  </DesktopFilterPill>
                </div>
              </div>
            </div>
          </>
        )}

        {visibleItems.length === 0 ? (
          <TrocoCard className="troco-card-surface mt-8 p-8 text-center">
            Aucun objet trouvé.
          </TrocoCard>
        ) : (
          <section className="mt-7 grid grid-cols-3 gap-5 xl:grid-cols-4">
            {visibleItems.map((item) => (
              <DesktopFeedCard
                key={item.id}
                item={item}
                favorite={favoriteItemIds.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </section>
        )}
    </main>
  );
}
