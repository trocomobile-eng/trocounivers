import { useEffect, useMemo, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Heart, Map, MapPin, Search, SlidersHorizontal, Navigation } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { db } from "../../firebase";
import { getTradePreferences } from "../../components/profile/profileUtils";
import { useAuth } from "../../context/AuthContext";
import CategoryPills from "../../components/CategoryPills";
import TrocoPageHeader from "../../components/TrocoPageHeader";
import MobileLayout from "../../layouts/MobileLayout";

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function belongsToUser(item, uid) {
  if (!uid) return false;

  return [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid]
    .filter(Boolean)
    .includes(uid);
}

function getGeoPoint(value) {
  if (!value) return null;

  if (typeof value.lat === "number" && typeof value.lng === "number") {
    return { lat: value.lat, lng: value.lng };
  }

  if (typeof value.latitude === "number" && typeof value.longitude === "number") {
    return { lat: value.latitude, lng: value.longitude };
  }

  return null;
}

function getItemGeoPoint(item) {
  return (
    getGeoPoint(item?.geo) ||
    getGeoPoint(item?.locationCoords) ||
    getGeoPoint(item?.coordinates) ||
    getGeoPoint(item?.location) ||
    (typeof item?.lat === "number" && typeof item?.lng === "number"
      ? { lat: item.lat, lng: item.lng }
      : null)
  );
}

function getDistanceMeters(from, to) {
  if (!from || !to) return null;

  const earthRadius = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(distanceMeters) {
  if (typeof distanceMeters !== "number") return "";

  if (distanceMeters < 120) return "à moins de 100 m";
  if (distanceMeters < 1000) return `à ${Math.round(distanceMeters / 50) * 50} m`;

  const kilometers = distanceMeters / 1000;

  return `à ${kilometers.toLocaleString("fr-FR", {
    maximumFractionDigits: kilometers < 10 ? 1 : 0,
  })} km`;
}

function matchesCategory(item, category) {
  if (!category || category === "Tout") return true;

  const cleanCategory = normalize(category);

  return (
    normalize(item.category).includes(cleanCategory) ||
    normalize(item.type).includes(cleanCategory) ||
    normalize(item.itemType).includes(cleanCategory)
  );
}

function matchesSearch(item, search) {
  if (!search.trim()) return true;

  const cleanSearch = normalize(search);

  return [
    item.title,
    item.name,
    item.type,
    item.itemType,
    item.category,
    item.description,
    item.arrondissement,
    item.location,
    item.city,
  ].some((value) => normalize(value).includes(cleanSearch));
}

function getItemImage(item) {
  return (
    item?.images?.[0] ||
    item?.photos?.[0] ||
    item?.imageUrl ||
    item?.image ||
    item?.photoUrl ||
    "/assets/images/empty-library.png"
  );
}

function getItemTitle(item) {
  return item?.title || item?.name || item?.itemName || item?.type || "Objet";
}

function getItemLocation(item) {
  return (
    item?.district ||
    item?.arrondissement ||
    item?.city ||
    item?.locationArea ||
    item?.location ||
    "Paris"
  );
}


function getOwnerId(item) {
  return (
    item?.ownerId ||
    item?.userId ||
    item?.ownerUid ||
    item?.createdBy ||
    item?.uid ||
    item?.owner?.id ||
    item?.owner?.uid ||
    item?.user?.id ||
    item?.user?.uid ||
    item?.createdById ||
    ""
  );
}

function getOwnerProfilePath(item) {
  const ownerId = getOwnerId(item);
  return ownerId ? `/users/${ownerId}` : "";
}

function getOwnerName(item) {
  const value =
    item?.ownerName ||
    item?.ownerDisplayName ||
    item?.userName ||
    item?.displayName ||
    item?.createdByName ||
    "";

  if (!value) return "Utilisateur Troco";
  if (String(value).includes("@")) return String(value).split("@")[0];

  const parts = clean(value).split(" ");
  if (parts.length > 1) return `${parts[0]} ${parts[1].charAt(0)}.`;

  return clean(value);
}

function getOwnerPhoto(item) {
  return (
    item?.ownerPhotoURL ||
    item?.ownerPhotoUrl ||
    item?.ownerAvatar ||
    item?.ownerProfilePhoto ||
    item?.userPhotoURL ||
    item?.userPhotoUrl ||
    item?.avatarUrl ||
    ""
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

function enrichItemsWithDistance(items, userLocation) {
  return items.map((item) => {
    const itemLocation = getItemGeoPoint(item);
    const distanceMeters = getDistanceMeters(userLocation, itemLocation);
    const distanceLabel = formatDistance(distanceMeters);

    return {
      ...item,
      distanceMeters,
      distanceLabel,
    };
  });
}

const RADIUS_OPTIONS = [
  { label: "Autour de moi", value: 500, icon: Navigation },
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "10 km", value: 10000 },
  { label: "20 km+", value: "all" },
];

function OwnerAvatar({ item, name }) {
  const photo = getOwnerPhoto(item);

  return (
    <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#E8F4EF] via-[#DDF1EA] to-[#F5EFE4] text-[#4C7468] shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[11px] font-black">
          {getInitial(name)}
        </span>
      )}
    </span>
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
      className="group block overflow-hidden rounded-[18px] border border-[#E4ECE8] bg-white/[0.985]/[0.985] shadow-[0_14px_34px_rgba(15,23,42,0.065)] transition active:scale-[0.992]"
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
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-400 shadow-[0_6px_14px_rgba(15,23,42,0.06)] backdrop-blur-md transition active:scale-95",
            favorite ? "text-rose-500" : "text-slate-400",
          ].join(" ")}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} strokeWidth={2.05} />
        </button>
      </div>

      <div className="relative p-2.5">
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
            className="mt-3 flex min-w-0 items-center gap-2 rounded-full text-left transition active:scale-[0.98]"
          >
            <OwnerAvatar item={item} name={ownerName} />
            <span className="max-w-full truncate rounded-full bg-[#EAF6F1] px-2 py-1 text-[10.5px] font-black text-[#2D5F55]">
              {ownerName}
            </span>
          </button>
        ) : (
          <div className="mt-3 flex min-w-0 items-center gap-2">
            <OwnerAvatar item={item} name={ownerName} />

            <span className="max-w-full truncate rounded-full bg-[#EAF6F1] px-2 py-1 text-[10.5px] font-black text-[#2D5F55]">
              {ownerName}
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

function getRelevanceScore(item, userPreferences) {
  if (!userPreferences) return 0;

  const { lookingFor = [], notLookingFor = [] } = userPreferences;

  const itemCategory = normalize(item.category || item.type || item.itemType || "");
  const itemTitle = normalize(item.title || item.name || item.itemType || "");

  const isExcluded = notLookingFor.some((tag) => {
    const normalizedTag = normalize(tag);
    return itemCategory.includes(normalizedTag) || itemTitle.includes(normalizedTag);
  });

  if (isExcluded) return -1;

  return lookingFor.reduce((score, tag) => {
    const normalizedTag = normalize(tag);
    if (itemCategory.includes(normalizedTag) || itemTitle.includes(normalizedTag)) {
      return score + 2;
    }
    return score;
  }, 0);
}

export default function MobileFeedPage() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [userLocation, setUserLocation] = useState(null);
  const [userPreferences, setUserPreferences] = useState({ lookingFor: [], notLookingFor: [], universe: [] });
  const [radius, setRadius] = useState(500);
  const [showFilters, setShowFilters] = useState(false);

  async function toggleFavorite(itemId) {
    if (!user?.uid) {
      alert("Connecte-toi pour ajouter un favori.");
      return;
    }

    const isFavorite = favoriteItemIds.includes(itemId);
    const userRef = doc(db, "users", user.uid);

    setFavoriteItemIds((current) =>
      isFavorite ? current.filter((id) => id !== itemId) : [...current, itemId]
    );

    try {
      await updateDoc(userRef, {
        favoriteItemIds: isFavorite ? arrayRemove(itemId) : arrayUnion(itemId),
      });
    } catch (error) {
      console.error("Erreur favori :", error);

      setFavoriteItemIds((current) =>
        isFavorite ? [...current, itemId] : current.filter((id) => id !== itemId)
      );

      try {
        await setDoc(userRef, { favoriteItemIds: isFavorite ? [] : [itemId] }, { merge: true });
      } catch {
        alert("Impossible de modifier les favoris.");
      }
    }
  }

  useEffect(() => {
    if (!user?.uid) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        const data = snapshot.data() || {};
        const nextLocation = getGeoPoint(data.location);

        setFavoriteItemIds(Array.isArray(data.favoriteItemIds) ? data.favoriteItemIds : []);
        setUserLocation(nextLocation);
        setUserPreferences(getTradePreferences(data));
      },
      (error) => console.error("Erreur chargement utilisateur :", error)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setItems(snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))),
      (error) => console.error("Erreur chargement objets :", error)
    );

    return () => unsubscribe();
  }, []);

  const visibleItems = useMemo(() => {
    return enrichItemsWithDistance(items, userLocation)
      .filter((item) => item.status !== "deleted")
      .filter((item) => !belongsToUser(item, user?.uid))
      .filter((item) => matchesCategory(item, activeCategory))
      .filter((item) => matchesSearch(item, search))
      .filter((item) => radius === "all" || item.distanceMeters === null || item.distanceMeters <= radius)
      .map((item) => ({ ...item, _relevance: getRelevanceScore(item, userPreferences) }))
      .filter((item) => item._relevance >= 0)
      .sort((a, b) => {
        if (b._relevance !== a._relevance) return b._relevance - a._relevance;
        if (!userLocation) return 0;
        if (a.distanceMeters === null) return 1;
        if (b.distanceMeters === null) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [items, user?.uid, activeCategory, search, userLocation, radius, userPreferences]);

  return (
    <MobileLayout>
      <TrocoPageHeader
        variant="brand"
        user={user}
        className="-mt-1"
      />

      <section className="mt-0 space-y-3">
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
            onClick={() => setShowFilters(true)}
            className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[17px] border border-[#E7DED2] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
          >
            <SlidersHorizontal size={20} strokeWidth={2.1} className="text-[#102033]" />

            {(radius !== 500 || viewMode === "map") && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#18A98E]" />
            )}
          </button>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPills activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>
      </section>

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5 shadow-[0_-20px_60px_rgba(15,23,42,0.18)]">
            <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[#D7E4DF]" />

            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-black tracking-[-0.04em] text-[#102033]">
                Filtres
              </h3>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
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
                    icon={option.icon}
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

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[23px] font-extrabold tracking-[-0.045em] text-[#102033]">
            Autour de toi
          </h2>

          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E7DED2] bg-white px-3.5 text-[12.5px] font-black text-[#16A085] shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          >
            <MapPin size={14} strokeWidth={2.4} />
            Paris
          </button>
        </div>
      </section>

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
