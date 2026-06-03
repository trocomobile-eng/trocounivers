import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowLeft, Heart, MapPin, Navigation, Plus, Search, SlidersHorizontal } from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { trackInterest } from "../utils/interestTracking";

import imgJeux from "../assets/univers/univ-jeux.png";
import imgMusique from "../assets/univers/univ-musique.png";
import imgDeco from "../assets/univers/univ-deco_maison.png";
import imgPhoto from "../assets/univers/univ-photo.png";
import imgSport from "../assets/univers/univ-sport.png";

const UNIVERS_CONFIG = {
  musique: {
    label: "Musique",
    tagline: "Des instruments, vinyles et objets. Des gens qui circulent près de toi.",
    img: imgMusique,
    accent: "#4BA8B8",
    icon: "♪",
    keywords: ["musique", "instrument", "vinyle", "guitare", "piano", "audio", "basse", "batterie", "casque", "enceinte", "synthé", "pedale", "pédale"],
    subcats: ["Instruments", "Vinyles", "Audio", "Platines", "Claviers", "Accessoires"],
  },
  jeux: {
    label: "Jeux",
    tagline: "Jeux de société, cartes, puzzles et objets ludiques à échanger près de toi.",
    img: imgJeux,
    accent: "#B8A040",
    icon: "✣",
    keywords: ["jeux", "jeu", "board game", "puzzle", "carte", "cartes", "échecs", "dés", "catan", "carcassonne"],
    subcats: ["Société", "Cartes", "Puzzles", "Jeux vidéo", "Échecs", "Enfants"],
  },
  deco: {
    label: "Déco & Maison",
    tagline: "Mobilier, luminaires, plantes, vaisselle et objets de maison.",
    img: imgDeco,
    accent: "#B07840",
    icon: "⌂",
    keywords: ["deco", "déco", "maison", "mobilier", "meuble", "luminaire", "vaisselle", "coussin", "tapis", "lampe"],
    subcats: ["Mobilier", "Luminaires", "Vaisselle", "Textile", "Plantes", "Art"],
  },
  photo: {
    label: "Photo",
    tagline: "Appareils, objectifs, argentique, trépieds et accessoires photo.",
    img: imgPhoto,
    accent: "#8060B0",
    icon: "◎",
    keywords: ["photo", "appareil", "objectif", "camera", "caméra", "reflex", "argentique", "trépied", "flash"],
    subcats: ["Appareils", "Objectifs", "Argentique", "Accessoires", "Éclairage", "Trépied"],
  },
  sport: {
    label: "Sport",
    tagline: "Outdoor, vélo, fitness doux, raquettes, sacs et équipement sport.",
    img: imgSport,
    accent: "#4F9F67",
    icon: "♧",
    keywords: ["sport", "fitness", "outdoor", "randonnée", "tennis", "foot", "yoga", "ski", "vélo", "velo"],
    subcats: ["Fitness", "Outdoor", "Ballon", "Raquettes", "Ski & Snow", "Yoga"],
  },
};

function normalize(value = "") {
  return String(value).toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function getGeoPoint(value) {
  if (!value) return null;
  if (typeof value.lat === "number" && typeof value.lng === "number") return { lat: value.lat, lng: value.lng };
  if (typeof value.latitude === "number" && typeof value.longitude === "number") return { lat: value.latitude, lng: value.longitude };
  return null;
}

function getItemGeoPoint(item) {
  return getGeoPoint(item?.geo) || getGeoPoint(item?.locationCoords) || getGeoPoint(item?.coordinates) || (typeof item?.lat === "number" ? { lat: item.lat, lng: item.lng } : null);
}

function getDistanceMeters(from, to) {
  if (!from || !to) return null;
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(m) {
  if (typeof m !== "number") return null;
  if (m < 120) return "< 100 m";
  if (m < 1000) return `${Math.round(m / 50) * 50} m`;
  const km = m / 1000;
  return `${km.toLocaleString("fr-FR", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

function belongsToUser(item, uid) {
  if (!uid) return false;
  return [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid].filter(Boolean).includes(uid);
}

function getItemImage(item) {
  return item?.images?.[0] || item?.photos?.[0] || item?.imageUrl || item?.image || item?.photoUrl || null;
}

function getItemTitle(item) {
  return item?.title || item?.name || item?.itemType || item?.type || "Objet";
}

function getItemOwnerName(item) {
  const name = item?.ownerName || item?.ownerDisplayName || item?.userName || item?.displayName || "";
  if (!name) return "Utilisateur Troco";
  if (String(name).includes("@")) return String(name).split("@")[0];
  const parts = String(name).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0];
}

function getSearchFields(item) {
  return [item.category, item.subCategory, item.type, item.itemType, item.title, item.name, item.description].map((v) => normalize(v || "")).join(" ");
}

function matchesUnivers(item, config) {
  const fields = getSearchFields(item);
  return config.keywords.some((kw) => fields.includes(normalize(kw)));
}

function matchesSubcat(item, subcat) {
  if (!subcat || subcat === "Tous") return true;
  return getSearchFields(item).includes(normalize(subcat));
}

function matchesSearch(item, search) {
  if (!search.trim()) return true;
  return getSearchFields(item).includes(normalize(search));
}

function sortItems(items, mode) {
  const copy = [...items];
  if (mode === "near") return copy.sort((a, b) => (a.distanceMeters ?? 99999999) - (b.distanceMeters ?? 99999999));
  if (mode === "popular") return copy.sort((a, b) => Number(b.favoriteCount || 0) - Number(a.favoriteCount || 0));
  return copy.sort((a, b) => Number(b.createdAt?.seconds || 0) - Number(a.createdAt?.seconds || 0));
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function UniversHero({ config, onBack, onAdd }) {
  return (
    <section className="relative mb-5 h-[200px] overflow-hidden rounded-[24px] lg:h-[220px]">
      {config.img ? (
        <img src={config.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${config.accent}44, #0d1b2a)` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5 lg:p-6">
        <div className="flex items-start justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 lg:hidden"
          >
            <ArrowLeft size={16} strokeWidth={2.3} />
          </button>
          <span className="rounded-full bg-[#1ABEA3] px-3 py-1 text-[11px] font-black text-white">
            En vedette
          </span>
        </div>

        <div>
          <h1 className="text-[40px] font-black leading-none tracking-[-0.055em] text-white lg:text-[48px]">
            {config.label}
          </h1>
          <p className="mt-1.5 max-w-[360px] text-[13px] font-medium leading-relaxed text-white/80">
            {config.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────

function UniversItemCard({ item, accent }) {
  const { favoriteIds, toggle } = useFavorites();
  const isFav = favoriteIds.includes(item?.id);
  const img = getItemImage(item);
  const title = getItemTitle(item);
  const owner = getItemOwnerName(item);

  return (
    <Link to={`/items/${item.id}`} className="group block">
      <article className="overflow-hidden rounded-[18px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.11)]">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {img ? (
            <img src={img} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl" style={{ color: accent, opacity: 0.3 }}>
              {accent}
            </div>
          )}
          {item.distanceLabel && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-slate-700 backdrop-blur-sm">
              <MapPin size={9} strokeWidth={2.5} style={{ color: accent }} />
              {item.distanceLabel}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item.id); }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition active:scale-95"
          >
            <Heart size={13} strokeWidth={2.2} fill={isFav ? accent : "none"} style={{ color: isFav ? accent : "#94a3b8" }} />
          </button>
        </div>
        <div className="p-3">
          <h2 className="line-clamp-1 text-[13px] font-extrabold leading-snug tracking-[-0.02em] text-[#0d1b2a]">
            {title}
          </h2>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#94a3b8]">{owner}</p>
        </div>
      </article>
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function PassionnesList({ items, accent }) {
  const people = Array.from(
    new Map(
      items
        .filter((item) => item.ownerId || item.userId || item.ownerUid)
        .map((item) => [item.ownerId || item.userId || item.ownerUid, item])
    ).values()
  ).slice(0, 5);

  if (!people.length) return null;

  return (
    <section className="rounded-[20px] border border-[#E8F1ED] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
      <h3 className="mb-3 text-[13px] font-black tracking-[-0.02em] text-[#0d1b2a]">
        Passionnés près de toi
      </h3>
      <div className="space-y-2.5">
        {people.map((person) => {
          const name = getItemOwnerName(person);
          const avatar = person.ownerPhotoURL || person.ownerAvatar || person.userPhotoURL || null;
          const profileId = person.ownerId || person.userId || person.ownerUid;
          const exchanges = person.ownerExchangeCount || person.exchangeCount || 0;

          return (
            <div key={person.id} className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ background: `${accent}22` }}>
                {avatar ? (
                  <img src={avatar} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[13px] font-black" style={{ color: accent }}>
                    {name.charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-black text-[#0d1b2a]">{name}</p>
                {exchanges > 0 && (
                  <p className="text-[10px] font-semibold text-[#94a3b8]">{exchanges} échanges</p>
                )}
              </div>
              {profileId && (
                <Link
                  to={`/users/${profileId}`}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black transition hover:opacity-80"
                  style={{ background: `${accent}18`, color: accent }}
                >
                  Voir le profil
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-3 w-full rounded-full border border-[#E4ECE8] py-2 text-[11px] font-black text-[#64748b] transition hover:bg-[#F5F5F3]"
      >
        Voir tous les profils
      </button>
    </section>
  );
}

function CategoriesPopulaires({ config, subcat, onSelect }) {
  const acc = config.accent;
  return (
    <section className="mt-3 rounded-[20px] border border-[#E8F1ED] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
      <h3 className="mb-3 text-[13px] font-black tracking-[-0.02em] text-[#0d1b2a]">
        Catégories populaires
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {config.subcats.map((label) => {
          const active = subcat === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(active ? "Tous" : label)}
              className="rounded-full border px-3 py-1.5 text-[11px] font-black transition active:scale-95"
              style={{
                background: active ? acc : `${acc}12`,
                borderColor: active ? acc : `${acc}30`,
                color: active ? "white" : acc,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DerniersObjets({ items, accent }) {
  const last = items.slice(0, 4);
  if (!last.length) return null;

  return (
    <section className="mt-3 rounded-[20px] border border-[#E8F1ED] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
      <h3 className="mb-3 text-[13px] font-black tracking-[-0.02em] text-[#0d1b2a]">
        Derniers dans cet univers
      </h3>
      <div className="grid grid-cols-4 gap-1.5">
        {last.map((item) => {
          const img = getItemImage(item);
          return (
            <Link key={item.id} to={`/items/${item.id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-[10px] bg-slate-100">
                {img ? (
                  <img src={img} alt={getItemTitle(item)} className="h-full w-full object-cover transition group-hover:scale-[1.04]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: accent, opacity: 0.4 }}>?</div>
                )}
              </div>
              <p className="mt-1 line-clamp-1 text-[9px] font-bold text-[#64748b]">{getItemTitle(item)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UniversDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const config = UNIVERS_CONFIG[id] || UNIVERS_CONFIG.musique;
  const accent = config.accent;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subcat, setSubcat] = useState("Tous");
  const [sort, setSort] = useState("recent");
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    if (user?.uid && id) trackInterest(user.uid, id, "view_universe");
  }, [id, user?.uid]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPosition(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((item) => item.status !== "deleted")
        .filter((item) => !belongsToUser(item, user?.uid));
      setItems(loaded);
      setLoading(false);
    }, () => { setItems([]); setLoading(false); });
    return () => unsub();
  }, [user?.uid]);

  const visibleItems = useMemo(() => {
    const enriched = items.map((item) => {
      const distanceMeters = getDistanceMeters(userPosition, getItemGeoPoint(item));
      return { ...item, distanceMeters, distanceLabel: formatDistance(distanceMeters) };
    });
    return sortItems(
      enriched
        .filter((item) => matchesUnivers(item, config))
        .filter((item) => matchesSubcat(item, subcat))
        .filter((item) => matchesSearch(item, search)),
      sort
    );
  }, [config, items, search, sort, subcat, userPosition]);

  const SORT_OPTIONS = [
    { value: "near", label: "Autour de moi", icon: Navigation },
    { value: "recent", label: "Récents" },
    { value: "popular", label: "Populaires" },
  ];

  return (
    <div className="min-h-screen pb-28 lg:pb-10">
      <main className="mx-auto w-full max-w-[1200px] px-4 pt-[max(14px,env(safe-area-inset-top))] lg:px-8 lg:pt-6">

        {/* Back button desktop */}
        <div className="mb-4 hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-sm transition hover:bg-[#F5F5F3]"
          >
            <ArrowLeft size={15} strokeWidth={2.3} />
          </button>
          <Link to="/univers" className="text-[12px] font-bold text-[#94a3b8] transition hover:text-[#1ABEA3]">
            Tous les univers
          </Link>
        </div>

        {/* Hero */}
        <UniversHero config={config} onBack={() => navigate(-1)} onAdd={() => navigate("/add", { state: { universe: id } })} />

        {/* Subcategory pills */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 pb-1">
            {["Tous", ...config.subcats].map((label) => {
              const active = subcat === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSubcat(label)}
                  className="shrink-0 rounded-full border px-4 py-2 text-[12px] font-black transition active:scale-95"
                  style={{
                    background: active ? accent : "white",
                    borderColor: active ? accent : "#E4ECE8",
                    color: active ? "white" : "#475569",
                    boxShadow: active ? `0 8px 20px ${accent}30` : "0 2px 8px rgba(15,23,42,0.04)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort + search row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SORT_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = sort === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSort(value)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-black transition"
                  style={{
                    background: active ? `${accent}14` : "white",
                    borderColor: active ? `${accent}50` : "#E4ECE8",
                    color: active ? accent : "#64748b",
                  }}
                >
                  {Icon && <Icon size={12} strokeWidth={2.3} />}
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-sm"
          >
            <SlidersHorizontal size={14} strokeWidth={2.2} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 flex h-[46px] items-center gap-2.5 rounded-[14px] border border-[#E4ECE8] bg-white px-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <Search size={16} strokeWidth={2.1} className="shrink-0 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher dans ${config.label}…`}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#0d1b2a] outline-none placeholder:text-[#94a3b8]"
          />
        </div>

        {/* Count */}
        <div className="mt-3 mb-4 flex items-center gap-2">
          <p className="text-[13px] font-black text-[#0d1b2a]">
            {loading ? "Chargement…" : `${visibleItems.length} objet${visibleItems.length !== 1 ? "s" : ""} trouvé${visibleItems.length !== 1 ? "s" : ""}`}
          </p>
          {subcat !== "Tous" && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-black"
              style={{ background: `${accent}18`, color: accent }}
            >
              {subcat} ×
            </span>
          )}
        </div>

        {/* Main 2-col layout */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Items grid */}
          <section>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-[18px] bg-slate-100" />
                ))}
              </div>
            ) : visibleItems.length ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {visibleItems.map((item) => (
                  <UniversItemCard key={item.id} item={item} accent={accent} />
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-[#E4ECE8] bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${accent}18`, color: accent }}>
                  <Search size={20} />
                </div>
                <h3 className="text-[16px] font-black text-[#0d1b2a]">Aucun objet trouvé</h3>
                <p className="mt-1.5 text-[13px] font-medium text-[#94a3b8]">
                  Essaie un autre filtre ou ajoute le premier objet.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/add")}
                  className="mt-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-black text-white mx-auto"
                  style={{ background: accent }}
                >
                  <Plus size={14} /> Ajouter un objet
                </button>
              </div>
            )}

            {/* Passionnés mobile */}
            <div className="mt-6 lg:hidden">
              <PassionnesList items={visibleItems} accent={accent} />
              <CategoriesPopulaires config={config} subcat={subcat} onSelect={setSubcat} />
            </div>
          </section>

          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-3">
              <PassionnesList items={visibleItems} accent={accent} />
              <CategoriesPopulaires config={config} subcat={subcat} onSelect={setSubcat} />
              <DerniersObjets items={visibleItems.slice(-4)} accent={accent} />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
