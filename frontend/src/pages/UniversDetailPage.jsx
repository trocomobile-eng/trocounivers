import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowLeft, Heart, MapPin, Plus, Search, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { trackInterest } from "../utils/interestTracking";

import imgJeux from "../assets/univers/univ-jeux.png";
import imgMusique from "../assets/univers/univ-musique.png";
import imgDeco from "../assets/univers/univ-deco_maison.png";
import imgPhoto from "../assets/univers/univ-photo.png";

const UNIVERS_CONFIG = {
  musique: {
    label: "Musique",
    tagline: "Écouter, collectionner, faire résonner.",
    heroTitle: "Objets musicaux autour de toi",
    img: imgMusique,
    accent: "#5EB7C3",
    icon: "♪",
    keywords: ["musique", "instrument", "vinyle", "guitare", "piano", "audio", "basse", "batterie", "casque", "enceinte", "synthé", "pedale", "pédale"],
    subcats: ["Instruments", "Vinyles", "Audio", "Pédales", "Claviers", "Accessoires"],
  },
  jeux: {
    label: "Jeux",
    tagline: "Partager, jouer, s'amuser ensemble.",
    heroTitle: "Jeux et objets ludiques près de toi",
    img: imgJeux,
    accent: "#C7B75F",
    icon: "⬡",
    keywords: ["jeux", "jeu", "board game", "puzzle", "carte", "cartes", "échecs", "dés", "catan", "carcassonne"],
    subcats: ["Société", "Cartes", "Puzzles", "Jeux vidéo", "Échecs", "Enfants"],
  },
  deco: {
    label: "Déco & Maison",
    tagline: "Sublimer, aménager, se sentir bien chez soi.",
    heroTitle: "Objets maison et déco autour de toi",
    img: imgDeco,
    accent: "#C89A63",
    icon: "⌂",
    keywords: ["deco", "déco", "maison", "mobilier", "meuble", "luminaire", "vaisselle", "coussin", "tapis", "lampe"],
    subcats: ["Mobilier", "Luminaires", "Vaisselle", "Textile", "Plantes", "Art"],
  },
  photo: {
    label: "Photo",
    tagline: "Capturer, créer, immortaliser.",
    heroTitle: "Photo, appareils et accessoires",
    img: imgPhoto,
    accent: "#A78BD4",
    icon: "◎",
    keywords: ["photo", "appareil", "objectif", "camera", "caméra", "reflex", "argentique", "trépied", "flash"],
    subcats: ["Appareils", "Objectifs", "Argentique", "Accessoires", "Éclairage", "Trépied"],
  },
  velo: {
    label: "Vélo",
    tagline: "Se déplacer, vivre la ville autrement.",
    heroTitle: "Vélos et accessoires près de toi",
    img: null,
    accent: "#72BE82",
    icon: "⚲",
    keywords: ["velo", "vélo", "bicyclette", "cyclisme", "roue", "selle", "casque vélo"],
    subcats: ["Vélos", "Accessoires", "Casques", "Éclairage", "Sacoches", "Entretien"],
  },
  livres: {
    label: "Livres",
    tagline: "Lire, apprendre, s'évader.",
    heroTitle: "Livres, BD et objets papier",
    img: null,
    accent: "#C9886E",
    icon: "⊟",
    keywords: ["livre", "livres", "roman", "bd", "manga", "essai", "bande dessinée"],
    subcats: ["Romans", "BD & Manga", "Essais", "Jeunesse", "Sciences", "Art & Photo"],
  },
  sport: {
    label: "Sport",
    tagline: "Bouger, se dépasser, explorer.",
    heroTitle: "Équipements sport et outdoor",
    img: null,
    accent: "#E0A860",
    icon: "◈",
    keywords: ["sport", "fitness", "outdoor", "randonnée", "tennis", "foot", "yoga", "ski"],
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
  return getGeoPoint(item?.geo) || getGeoPoint(item?.locationCoords) || getGeoPoint(item?.coordinates) || getGeoPoint(item?.location) || (typeof item?.lat === "number" && typeof item?.lng === "number" ? { lat: item.lat, lng: item.lng } : null);
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
  return item?.title || item?.name || item?.itemName || item?.itemType || item?.type || "Objet";
}

function getItemOwner(item) {
  const name = item?.ownerName || item?.ownerDisplayName || item?.userName || item?.displayName || "";
  if (!name) return null;
  const parts = String(name).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0];
}

function getSearchFields(item) {
  return [item.category, item.subCategory, item.type, item.itemType, item.title, item.name, item.description, item.details].map((v) => normalize(v || "")).join(" ");
}

function matchesUnivers(item, config) {
  const fields = getSearchFields(item);
  return config.keywords.some((keyword) => fields.includes(normalize(keyword)));
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
  if (mode === "popular") return copy.sort((a, b) => Number(b.favoriteCount || b.likes || 0) - Number(a.favoriteCount || a.likes || 0));
  return copy.sort((a, b) => Number(b.createdAt?.seconds || 0) - Number(a.createdAt?.seconds || 0));
}

function UniverseHero({ config, onAdd }) {
  return (
    <section className="troco-universe-card-strong relative mb-5 min-h-[238px] overflow-hidden rounded-[32px]">
      {config.img ? (
        <img src={config.img} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center", opacity: 0.9 }} />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${config.accent}34 0%, rgba(255,255,255,0.66) 100%)` }} />
      )}
      <div className="absolute inset-0" style={{ background: "var(--troco-universe-overlay-bottom)" }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 10%, ${config.accent}38, transparent 36%)` }} />

      <div className="relative z-10 flex min-h-[238px] flex-col justify-end p-6 text-white lg:p-7">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/18 backdrop-blur-xl">
            <span className="text-[18px] font-black">{config.icon}</span>
          </div>
          <span className="rounded-full bg-white/18 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] backdrop-blur-xl">
            Univers
          </span>
        </div>

        <h1 className="max-w-[360px] text-[42px] font-black leading-[0.92] tracking-[-0.065em] drop-shadow-[0_4px_18px_rgba(0,0,0,0.28)] lg:text-[48px]">
          {config.label}
        </h1>
        <p className="mt-3 max-w-[360px] text-[15px] font-semibold leading-relaxed text-white/90 drop-shadow-sm">
          {config.tagline}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-white px-5 text-[13px] font-black text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.20)] transition hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={15} /> Ajouter un objet {config.label.toLowerCase()}
        </button>
      </div>
    </section>
  );
}

function ItemCard({ item, accent, onFavorite }) {
  const img = getItemImage(item);
  const title = getItemTitle(item);
  const owner = getItemOwner(item);
  const [fav, setFav] = useState(false);

  return (
    <Link to={`/items/${item.id}`} className="block">
      <article className="troco-universe-card overflow-hidden bg-white/94 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {img ? (
            <img src={img} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ color: accent, opacity: 0.28 }}>
              <Sparkles size={28} strokeWidth={1.8} />
            </div>
          )}
          {item.distanceLabel && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/88 px-2 py-1 text-[10px] font-black text-slate-700 backdrop-blur-xl">
              <MapPin size={10} strokeWidth={2.5} style={{ color: accent }} /> {item.distanceLabel}
            </span>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setFav((value) => !value);
              onFavorite?.(item);
            }}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/86 shadow-sm backdrop-blur-xl"
            aria-label="Favori"
          >
            <Heart size={15} strokeWidth={2.2} fill={fav ? accent : "none"} style={{ color: fav ? accent : "#64748b" }} />
          </button>
        </div>
        <div className="p-3">
          <h2 className="line-clamp-1 text-[14px] font-black leading-tight tracking-[-0.03em] text-slate-900">{title}</h2>
          <div className="mt-2 flex items-center justify-between gap-2">
            {(item.ownerId || item.userId || item.ownerUid) ? (
              <Link
                to={`/users/${item.ownerId || item.userId || item.ownerUid}`}
                onClick={(e) => e.stopPropagation()}
                className="line-clamp-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                {owner || "Utilisateur Troco"}
              </Link>
            ) : (
              <p className="line-clamp-1 text-[11px] font-semibold text-slate-500">{owner || "Utilisateur Troco"}</p>
            )}
            <span className="rounded-full px-2 py-1 text-[10px] font-black" style={{ background: `${accent}20`, color: accent }}>
              Troc
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function PassionRow({ items, accent, compact = false }) {
  const people = Array.from(
    new Map(
      items
        .filter((item) => item.ownerName || item.ownerDisplayName || item.userName || item.ownerEmail)
        .map((item) => [item.ownerId || item.userId || item.ownerEmail || item.id, item])
    ).values()
  ).slice(0, compact ? 5 : 8);

  if (!people.length) return null;

  if (compact) {
    return (
      <section className="rounded-[28px] border border-white/85 bg-white/86 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="troco-caption">Couche humaine</p>
            <h2 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.045em] text-slate-950">
              Passionnés près de toi
            </h2>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <UsersRound size={18} />
          </div>
        </div>

        <div className="space-y-3">
          {people.map((person) => {
            const name = getItemOwner(person) || "Troco";
            const avatar = person.ownerPhotoURL || person.ownerAvatar || person.userPhotoURL || null;
            const profileId = person.ownerId || person.userId || person.ownerUid;

            return (
              <Link
                key={person.id}
                to={profileId ? `/users/${profileId}` : "#"}
                className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/72 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 active:scale-95"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full" style={{ background: `${accent}22` }}>
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[15px] font-black" style={{ color: accent }}>
                      {name.charAt(0)}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white" style={{ background: accent }} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-slate-900">{name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                    {person.distanceLabel || "local"} · passionné
                  </p>
                </div>

                <span className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: `${accent}18`, color: accent }}>
                  Troco
                </span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-[13px] font-black text-slate-800 transition hover:bg-slate-50 active:scale-95"
        >
          Explorer plus de passionnés
          <span>→</span>
        </button>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="troco-caption">Couche humaine</p>
          <h2 className="text-[20px] font-black tracking-[-0.045em] text-slate-950">Passionnés près de toi</h2>
        </div>
        <UsersRound size={18} className="text-slate-400" />
      </div>

      <div className="troco-scrollbar-hide flex gap-3 overflow-x-auto pb-1">
        {people.map((person) => {
          const name = getItemOwner(person) || "Troco";
          const avatar = person.ownerPhotoURL || person.ownerAvatar || person.userPhotoURL || null;
          const profileId = person.ownerId || person.userId || person.ownerUid;
          return (
            <Link
              key={person.id}
              to={profileId ? `/users/${profileId}` : "#"}
              className="min-w-[92px] rounded-[22px] border border-white/80 bg-white/82 p-3 text-center shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl transition hover:-translate-y-0.5 active:scale-95"
            >
              <div className="mx-auto mb-2 h-12 w-12 overflow-hidden rounded-full" style={{ background: `${accent}22` }}>
                {avatar
                  ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-[15px] font-black" style={{ color: accent }}>{name.charAt(0)}</div>
                }
              </div>
              <p className="line-clamp-1 text-[12px] font-black text-slate-800">{name}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">{person.distanceLabel || "local"}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PopularCategoriesPanel({ config }) {
  return (
    <section className="mt-5 rounded-[28px] border border-white/85 bg-white/82 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <h3 className="text-[16px] font-black tracking-[-0.035em] text-slate-950">
        Catégories populaires
      </h3>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {config.subcats.slice(0, 4).map((label) => (
          <div key={label} className="text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-black"
              style={{ background: `${config.accent}20`, color: config.accent }}
            >
              {label.charAt(0)}
            </div>
            <p className="mt-2 line-clamp-1 text-[11px] font-bold text-slate-500">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function UniversDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const config = UNIVERS_CONFIG[id] || UNIVERS_CONFIG.musique;

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
      (position) => setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setUserPosition(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }))
          .filter((item) => item.status !== "deleted")
          .filter((item) => !belongsToUser(item, user?.uid));
        setItems(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur chargement univers :", error);
        setItems([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!search.trim() || !user?.uid) return;
    const timer = window.setTimeout(() => trackInterest(user.uid, id, "search_universe"), 650);
    return () => window.clearTimeout(timer);
  }, [id, search, user?.uid]);

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

  const featuredItems = visibleItems.slice(0, 6);

  return (
    <div className="troco-universe-screen min-h-screen pb-28">
      <main className="mx-auto w-full max-w-[1200px] px-4 pt-[max(14px,env(safe-area-inset-top))] lg:px-8 lg:pt-8">
        <header className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="troco-floating-action flex h-10 w-10 items-center justify-center" aria-label="Retour">
            <ArrowLeft size={17} className="text-slate-700" />
          </button>
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">Univers</p>
          <button type="button" className="troco-floating-action flex h-10 w-10 items-center justify-center" aria-label="Filtres">
            <SlidersHorizontal size={16} className="text-slate-700" />
          </button>
        </header>

        <UniverseHero config={config} onAdd={() => navigate("/add-item", { state: { universe: id, category: config.label } })} />

        <section className="mb-4">
          <div className="troco-search h-[54px] border-white/95 bg-white/95 px-4 shadow-[0_14px_34px_rgba(15,23,42,0.055)]">
            <Search size={17} className="mr-2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Rechercher dans ${config.label}...`}
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </section>

        <section className="mb-4">
          <div className="troco-scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {["Tous", ...config.subcats].map((label) => {
              const active = subcat === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSubcat(label)}
                  className="shrink-0 rounded-full border px-4.5 py-2.5 text-[12px] font-black transition hover:-translate-y-0.5 active:scale-95"
                  style={{
                    background: active ? config.accent : "rgba(255,255,255,0.86)",
                    borderColor: active ? config.accent : "rgba(255,255,255,0.9)",
                    color: active ? "white" : "#475569",
                    boxShadow: active ? `0 10px 22px ${config.accent}30` : "0 8px 20px rgba(15,23,42,0.035)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6 rounded-[24px] border border-white/85 bg-white/86 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.045)] backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["near", "Plus proches"],
              ["recent", "Récents"],
              ["popular", "Populaires"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSort(value)}
                className="rounded-[18px] px-2 py-3 text-[12px] font-black transition hover:bg-white/60 active:scale-95"
                style={{ background: sort === value ? `${config.accent}20` : "transparent", color: sort === value ? config.accent : "#64748b" }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-8 lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* col objets */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="troco-caption" style={{ color: config.accent }}>{config.heroTitle}</p>
              <h2 className="text-[25px] font-black leading-tight tracking-[-0.055em] text-slate-950">
                {visibleItems.length ? `${visibleItems.length} objets trouvés` : "Objets autour de toi"}
              </h2>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                style={{ background: `${config.accent}18`, color: config.accent }}
                aria-label="Vue grille"
              >
                ⊞
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                aria-label="Vue liste"
              >
                ☰
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/80 bg-white/72 p-8 text-center text-[13px] font-semibold text-slate-500 shadow-sm backdrop-blur-xl">
              Chargement des objets…
            </div>
          ) : visibleItems.length ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <ItemCard key={item.id} item={item} accent={config.accent} onFavorite={() => user?.uid && trackInterest(user.uid, id, "favorite_item")} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/80 bg-white/78 p-7 text-center shadow-[0_12px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${config.accent}20`, color: config.accent }}>
                <Search size={22} />
              </div>
              <h3 className="text-[18px] font-black tracking-[-0.04em] text-slate-900">Aucun objet pour l’instant</h3>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-500">
                Essaie une autre recherche ou ajoute le premier objet dans cet univers.
              </p>
              <button type="button" onClick={() => navigate("/add-item", { state: { universe: id, category: config.label } })} className="mt-5 rounded-full px-5 py-3 text-[13px] font-black text-white" style={{ background: config.accent }}>
                Ajouter un objet
              </button>
            </div>
          )}
          {/* Passionnés mobile — sous les objets */}
          <div className="mt-8 lg:hidden">
            <PassionRow items={featuredItems} accent={config.accent} />
          </div>
        </section>

        {/* Passionnés desktop — sidebar droite sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <PassionRow items={featuredItems} accent={config.accent} compact />
            <PopularCategoriesPanel config={config} />
          </div>
        </aside>

        </div>{/* fin grid */}
      </main>

    </div>
  );
}
