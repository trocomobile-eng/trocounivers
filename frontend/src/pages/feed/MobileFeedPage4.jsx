import { useEffect, useMemo, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Bell, ChevronRight, Heart, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";
import * as categoryConfig from "../../constants/categories";

// ─── assets univers ───────────────────────────────────────────────────────────
import imgJeux      from "../../assets/univers/univ-jeux.png";
import imgMusique   from "../../assets/univers/univ-musique.png";
import imgDeco      from "../../assets/univers/univ-deco_maison.png";
import imgPhoto     from "../../assets/univers/univ-photo.png";

const CATEGORY_FILTERS = (
  categoryConfig.CATEGORY_ITEMS ||
  categoryConfig.CATEGORIES ||
  categoryConfig.default ||
  []
).filter((category) => category?.id && category.id !== "tout");

// ─── config univers ───────────────────────────────────────────────────────────
const UNIVERS = [
  { id: "jeux",    label: "Jeux",         img: imgJeux,    accent: "#c9b96e" },
  { id: "musique", label: "Musique",      img: imgMusique, accent: "#8ec9d4" },
  { id: "deco",    label: "Déco",         img: imgDeco,    accent: "#c9a97e" },
  { id: "photo",   label: "Photo",        img: imgPhoto,   accent: "#b8a0d4" },
  // Vélo, Livres, Sport — assets à brancher plus tard
  { id: "velo",    label: "Vélo",         img: null,       accent: "#8ec99a" },
  { id: "livres",  label: "Livres",       img: null,       accent: "#c9886e" },
  { id: "sport",   label: "Sport",        img: null,       accent: "#e0a860" },
];

// ─── helpers géoloc ───────────────────────────────────────────────────────────
function getGeoPoint(value) {
  if (!value) return null;
  if (typeof value.lat === "number" && typeof value.lng === "number")
    return { lat: value.lat, lng: value.lng };
  if (typeof value.latitude === "number" && typeof value.longitude === "number")
    return { lat: value.latitude, lng: value.longitude };
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
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(m) {
  if (typeof m !== "number") return null;
  if (m < 120) return "< 100 m";
  if (m < 1000) return `${Math.round(m / 50) * 50} m`;
  const km = m / 1000;
  return `${km.toLocaleString("fr-FR", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

// ─── helpers item ─────────────────────────────────────────────────────────────
function normalize(v = "") {
  return String(v).toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function belongsToUser(item, uid) {
  if (!uid) return false;
  return [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid]
    .filter(Boolean)
    .includes(uid);
}

function getItemImage(item) {
  return (
    item?.images?.[0] ||
    item?.photos?.[0] ||
    item?.imageUrl ||
    item?.image ||
    item?.photoUrl ||
    null
  );
}

function getItemTitle(item) {
  return item?.title || item?.name || item?.itemName || item?.type || "Objet";
}

function getItemOwner(item) {
  const name = item?.ownerName || item?.ownerDisplayName || item?.userName || item?.displayName || "";
  if (!name) return null;
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : name;
}

function getItemDescription(item) {
  return item?.description || item?.details || "Disponible autour de vous.";
}

function matchesCategory(item, category) {
  if (!category || category === "tout") return true;
  const c = normalize(category);
  return (
    normalize(item.category).includes(c) ||
    normalize(item.type).includes(c) ||
    normalize(item.itemType).includes(c) ||
    normalize(item.title).includes(c) ||
    normalize(item.description).includes(c)
  );
}

function matchesFilterCategory(item, categoryId) {
  if (!categoryId || categoryId === "tout") return true;

  const category = CATEGORY_FILTERS.find((entry) => entry.id === categoryId);
  if (!category) return true;

  const haystack = [
    item?.category,
    item?.subCategory,
    item?.type,
    item?.itemType,
    item?.title,
    item?.name,
    item?.description,
    item?.details,
  ].map(normalize).join(" ");

  const label = normalize(category.label || "");
  const id = normalize(category.id || "");
  const keywordOk = (category.keywords || []).some((keyword) =>
    haystack.includes(normalize(keyword))
  );

  return haystack.includes(id) || haystack.includes(label) || keywordOk;
}

// ─── sous-composants ──────────────────────────────────────────────────────────

function UniversCard({ univers, active = false, onClick }) {
  const hasImg = Boolean(univers.img);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex-shrink-0 w-[120px] h-[80px] rounded-[14px] overflow-hidden text-left active:scale-[0.97] transition-transform border",
        active ? "border-[#1a7a4a] ring-2 ring-[#1a7a4a]/30" : "border-transparent",
      ].join(" ")}
      style={{ background: hasImg ? "#1a1a1a" : "#1a1a1a" }}
    >
      {hasImg ? (
        <img
          src={univers.img}
          alt={univers.label}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `${univers.accent}22` }}
        />
      )}
      {/* gradient overlay bas */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {active ? (
        <span className="absolute right-2 top-2 rounded-full bg-white/92 px-2 py-0.5 text-[9px] font-black text-[#1a7a4a]">
          Actif
        </span>
      ) : null}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white text-[13px] font-black leading-tight" style={{ letterSpacing: "-0.02em" }}>
          {univers.label}
        </p>
      </div>
    </button>
  );
}

function ItemCard({ item, favorite, onToggleFavorite }) {
  const img = getItemImage(item);
  const title = getItemTitle(item);
  const owner = getItemOwner(item);
  const desc = getItemDescription(item);
  const dist = item.distanceLabel;

  return (
    <Link to={`/items/${item.id}`} className="block">
      <article className="bg-white rounded-[16px] overflow-hidden border border-[#ece8e0]">
        {/* photo */}
        <div className="relative aspect-[4/3] bg-[#f0ebe0] overflow-hidden">
          {img ? (
            <img src={img} alt={title} draggable="false" className="pointer-events-none w-full h-full select-none object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#ccc]">
              <MapPin size={28} strokeWidth={1.5} />
            </div>
          )}
          {/* distance badge */}
          {dist && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold rounded-full px-2 py-0.5">
              <MapPin size={9} strokeWidth={2.5} />
              {dist}
            </span>
          )}
          {/* heart */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(item.id); }}
            className={[
              "absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full backdrop-blur-md shadow-sm transition active:scale-95",
              favorite ? "bg-white text-rose-500" : "bg-white/70 text-slate-400",
            ].join(" ")}
            aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart size={15} strokeWidth={2.2} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* info */}
        <div className="p-3">
          <h3 className="text-[13.5px] font-black leading-tight tracking-tight text-[#111] line-clamp-1">
            {title}
          </h3>
          <p className="mt-0.5 text-[11px] text-[#888] line-clamp-1">{desc}</p>

          {/* footer */}
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-[#e8e4dc] flex items-center justify-center text-[9px] font-black text-[#666]">
                {owner ? owner.charAt(0).toUpperCase() : "?"}
              </div>
              <span className="text-[11px] font-medium text-[#555]">{owner || "Anonyme"}</span>
            </div>
            <span className="text-[10.5px] font-bold text-[#1a7a4a] bg-[#e6f5ee] px-2.5 py-0.5 rounded-full">
              Échange
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── page principale ──────────────────────────────────────────────────────────
export default function MobileFeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems]                     = useState([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);
  const [userLocation, setUserLocation]       = useState(null);
  const [search, setSearch]                   = useState("");
  const [activeUnivers, setActiveUnivers]     = useState(null); // null = tous
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [showFilters, setShowFilters]         = useState(false);
  const [filterRadius, setFilterRadius]       = useState(null); // null = tous
  const [filterSort, setFilterSort]           = useState("distance"); // distance | recent
  const [categoryFilters, setCategoryFilters]   = useState([]);
  const [showAllItems, setShowAllItems]         = useState(false);

  useEffect(() => {
    if (!showFilters) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [showFilters]);

  // ── favoris toggle ──────────────────────────────────────────────────────────
  async function toggleFavorite(itemId) {
    if (!user?.uid) { alert("Connecte-toi pour ajouter un favori."); return; }
    const isFav = favoriteItemIds.includes(itemId);
    const ref = doc(db, "users", user.uid);
    setFavoriteItemIds((cur) => isFav ? cur.filter((id) => id !== itemId) : [...cur, itemId]);
    try {
      await updateDoc(ref, { favoriteItemIds: isFav ? arrayRemove(itemId) : arrayUnion(itemId) });
    } catch {
      try { await setDoc(ref, { favoriteItemIds: isFav ? [] : [itemId] }, { merge: true }); }
      catch { alert("Impossible de modifier les favoris."); }
    }
  }

  // ── écoute user (géoloc + favoris) ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data() || {};
      setFavoriteItemIds(Array.isArray(data.favoriteItemIds) ? data.favoriteItemIds : []);
      setUserLocation(getGeoPoint(data.location) || null);
    });
    return () => unsub();
  }, [user?.uid]);

  // ── écoute items ────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // ── items enrichis + filtrés ────────────────────────────────────────────────
  const visibleItems = useMemo(() => {
    const searchNorm = normalize(search);
    return items
      .filter((item) => item.status !== "deleted")
      .filter((item) => !belongsToUser(item, user?.uid))
      .filter((item) => matchesCategory(item, activeUnivers))
      .filter((item) =>
        categoryFilters.length === 0 ||
        categoryFilters.some((categoryId) => matchesFilterCategory(item, categoryId))
      )
      .filter((item) => {
        if (!searchNorm) return true;
        return [item.title, item.name, item.type, item.category, item.description]
          .some((v) => normalize(v).includes(searchNorm));
      })
      .map((item) => {
        const geo = getItemGeoPoint(item);
        const meters = getDistanceMeters(userLocation, geo);
        return { ...item, distanceMeters: meters, distanceLabel: formatDistance(meters) };
      })
      .filter((item) => {
        if (!filterRadius || !item.distanceMeters) return true;
        return item.distanceMeters <= filterRadius;
      })
      .sort((a, b) => {
        if (filterSort === "recent") {
          const da = a.createdAt?.toDate?.() || new Date(a.createdAt?.seconds * 1000 || 0);
          const db_ = b.createdAt?.toDate?.() || new Date(b.createdAt?.seconds * 1000 || 0);
          return db_ - da;
        }
        if (!userLocation) return 0;
        if (a.distanceMeters === null) return 1;
        if (b.distanceMeters === null) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [items, user?.uid, activeUnivers, search, userLocation, filterRadius, filterSort]);

  // ── échanges récents (Firestore) ───────────────────────────────────────────
  useEffect(() => {
    // On prend les échanges récents sans filtre de status
    // pour éviter l'index composite Firestore manquant
    const q = query(
      collection(db, "exchanges"),
      orderBy("updatedAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // charger les images des objets si pas déjà en cache sur l'exchange
      const enriched = await Promise.all(
        list.map(async (ex) => {
          let imgA = ex.requestedItemImage || ex.offeredItemImage || null;
          let imgB = ex.offeredItemImage   || ex.requestedItemImage || null;

          // essayer de charger depuis Firestore si pas d'image
          if (!imgA && ex.requestedItemId) {
            try {
              const snap = await getDoc(doc(db, "items", ex.requestedItemId));
              if (snap.exists()) {
                const d = snap.data();
                imgA = d.images?.[0] || d.imageUrl || d.photos?.[0] || null;
              }
            } catch { /* silently */ }
          }
          if (!imgB && ex.offeredItemId) {
            try {
              const snap = await getDoc(doc(db, "items", ex.offeredItemId));
              if (snap.exists()) {
                const d = snap.data();
                imgB = d.images?.[0] || d.imageUrl || d.photos?.[0] || null;
              }
            } catch { /* silently */ }
          }

          return {
            id:         ex.id,
            senderName: ex.senderName || ex.senderDisplayName || "Quelqu'un",
            titleA:     ex.requestedItemTitle || ex.requestedTitle || "Objet",
            titleB:     ex.offeredItemTitle   || ex.offeredTitle   || "Objet",
            imgA,
            imgB,
          };
        })
      );

      // Garder tous les échanges avec au moins un titre, avec ou sans image
      const interesting = enriched.filter((ex) =>
        ex.titleA !== "Objet" || ex.titleB !== "Objet" || ex.imgA || ex.imgB
      );
      setRecentExchanges(interesting.slice(0, 8));
    }, () => { /* silently fail */ });

    return () => unsub();
  }, []);

  const locationLabel = userLocation ? "Près de toi" : "Paris";

  return (
    <div
      className="min-h-screen pb-28 text-[#111]"
      style={{ background: "#f7f5f0" }}
    >
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3 bg-[#f7f5f0]">
        <div className="flex items-center justify-between">
          <Link to="/feed">
            <img src="/logo.png" alt="Troco" className="h-auto w-[96px]" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white border border-[#e8e4dc]"
              aria-label="Notifications"
            >
              <Bell size={17} strokeWidth={2} className="text-[#444]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-[#f7f5f0]" />
            </button>
            <Link
              to="/profile"
              className="h-9 w-9 rounded-full bg-[#1a4d2e] flex items-center justify-center text-sm font-black text-white overflow-hidden"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="profil" className="w-full h-full object-cover" />
              ) : (
                (user?.displayName || user?.email || "U").charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-3 flex items-center gap-2 bg-white rounded-full px-4 h-11 border border-[#e8e4dc]">
          <Search size={16} className="text-[#aaa] shrink-0" strokeWidth={2.2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un objet, un univers…"
            className="flex-1 bg-transparent text-[13px] text-[#333] placeholder:text-[#bbb] outline-none font-medium"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-[#aaa] text-xs">✕</button>
          )}
        </div>
      </header>

      <div className="px-4 space-y-6">

        {/* ── Section : Explorer les univers ───────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-black tracking-tight text-[#111]">
              Explorer les univers
            </h2>
            <button
              type="button"
              onClick={() => navigate("/univers")}
              className="flex items-center gap-0.5 text-[12px] font-bold text-[#1a7a4a]"
            >
              Voir tout <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* pill "Tous" */}
            <button
              type="button"
              onClick={() => setActiveUnivers(null)}
              className={[
                "flex-shrink-0 h-[80px] w-[72px] rounded-[14px] flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-[0.97]",
                activeUnivers === null
                  ? "bg-[#1a4d2e] border-[#1a4d2e] text-white"
                  : "bg-white border-[#e8e4dc] text-[#555]",
              ].join(" ")}
            >
              <span className="text-xl">⊞</span>
              <span className="text-[11px] font-black">Tous</span>
            </button>

            {UNIVERS.map((u) => (
              <UniversCard
                key={u.id}
                univers={u}
                active={activeUnivers === u.id}
                onClick={() => setActiveUnivers(activeUnivers === u.id ? null : u.id)}
              />
            ))}
          </div>

          {activeUnivers ? (
            <div className="mt-3 rounded-[18px] border border-[#d8eee5] bg-[#eaf7f1] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1a7a4a]">
                    Univers actif
                  </p>
                  <h3 className="mt-0.5 text-[17px] font-black tracking-[-0.04em] text-[#102033]">
                    {UNIVERS.find((u) => u.id === activeUnivers)?.label} autour de toi
                  </h3>
                  <p className="mt-1 text-[11.5px] font-semibold text-[#5f766d]">
                    {visibleItems.length} objets · filtres conservés
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveUnivers(null)}
                  className="rounded-full bg-[#1a7a4a] px-3 py-1.5 text-[11px] font-black text-white"
                >
                  Tout
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── Section : Objets autour de vous ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-black tracking-tight text-[#111]">
                Objets autour de vous
              </h2>
              <span className="text-[11px] font-bold text-[#1a7a4a] bg-[#e6f5ee] px-2 py-0.5 rounded-full">
                {locationLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1 text-[11px] font-bold bg-white border border-[#e8e4dc] rounded-full px-2.5 py-1"
              style={{ color: (filterRadius || filterSort !== "distance" || categoryFilters.length) ? "#1a7a4a" : "#888" }}
            >
              <SlidersHorizontal size={11} strokeWidth={2.2} />
              Filtres{(filterRadius || filterSort !== "distance" || categoryFilters.length) ? " •" : ""}
            </button>
          </div>

          {visibleItems.length === 0 ? (
            <div className="bg-white rounded-[16px] p-6 text-center text-[13px] text-[#aaa] font-medium border border-[#ece8e0]">
              Aucun objet trouvé dans cette zone.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {(showAllItems ? visibleItems : visibleItems.slice(0, 8)).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  favorite={favoriteItemIds.includes(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          {visibleItems.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllItems(true)}
              className="mt-3 w-full py-3 rounded-[14px] bg-white border border-[#e8e4dc] text-[13px] font-bold text-[#444] flex items-center justify-center gap-1"
            >
              {showAllItems ? "Tous les objets affichés" : `Voir les ${visibleItems.length} objets`} <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          )}
        </section>

        {/* ── Section : Échanges récents ────────────────────────────────────── */}
        {recentExchanges.length > 0 && (
        <section className="pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-black tracking-tight text-[#111]">
              Échanges récents
            </h2>
            <button
              type="button"
              onClick={() => navigate("/exchanges")}
              className="flex items-center gap-0.5 text-[12px] font-bold text-[#1a7a4a]"
            >
              Voir tout <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recentExchanges.map((ex) => (
              <div
                key={ex.id}
                className="flex-shrink-0 w-[148px] bg-white rounded-[14px] border border-[#ece8e0] overflow-hidden"
              >
                {/* photos côte à côte */}
                <div className="flex h-[80px]">
                  <div className="flex-1 bg-[#f0ebe0] overflow-hidden">
                    {ex.imgA
                      ? <img src={ex.imgA} alt={ex.titleA} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-2xl">📦</div>
                    }
                  </div>
                  {/* séparateur ⇄ */}
                  <div className="flex items-center justify-center w-7 shrink-0 bg-white z-10">
                    <span className="text-[10px] font-black text-[#bbb]">⇄</span>
                  </div>
                  <div className="flex-1 bg-[#f0ebe0] overflow-hidden">
                    {ex.imgB
                      ? <img src={ex.imgB} alt={ex.titleB} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-2xl">📦</div>
                    }
                  </div>
                </div>

                {/* légende */}
                <div className="p-2.5">
                  <p className="text-[10.5px] font-black text-[#333] leading-tight line-clamp-1">
                    {ex.senderName.split(" ")[0]} a troqué
                  </p>
                  <p className="text-[10px] text-[#999] mt-0.5 line-clamp-1">
                    {ex.titleA} ↔ {ex.titleB}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

      </div>

      <BottomNav />

      {/* ── Bottom sheet Filtres ── */}
      {showFilters && (
        <div
          className="fixed inset-0 z-50 flex items-end overflow-hidden"
          onClick={() => setShowFilters(false)}
          onTouchMove={(e) => e.preventDefault()}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />

          {/* panel */}
          <div
            className="relative max-h-[82vh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_40px_rgba(15,23,42,0.12)]"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-black text-slate-900">Filtres</h3>
              <button type="button" onClick={() => setShowFilters(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100">
                <X size={15} strokeWidth={2.5} className="text-slate-500" />
              </button>
            </div>

            {/* Catégories */}
            <div className="mb-5">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Catégories précises
                </p>
                {categoryFilters.length ? (
                  <button
                    type="button"
                    onClick={() => setCategoryFilters([])}
                    className="text-[11px] font-black text-[#1a7a4a]"
                  >
                    Effacer
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((category) => {
                  const active = categoryFilters.includes(category.id);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setCategoryFilters((current) =>
                          current.includes(category.id)
                            ? current.filter((id) => id !== category.id)
                            : [...current, category.id]
                        )
                      }
                      className="rounded-full border px-3 py-2 text-[12px] font-bold transition"
                      style={{
                        background: active ? "#1a7a4a" : "white",
                        color: active ? "white" : "#475569",
                        borderColor: active ? "#1a7a4a" : "#e2e8f0",
                      }}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance */}
            <div className="mb-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Distance</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Tous", value: null },
                  { label: "500 m", value: 500 },
                  { label: "1 km",  value: 1000 },
                  { label: "3 km",  value: 3000 },
                  { label: "10 km", value: 10000 },
                ].map(({ label, value }) => (
                  <button key={label} type="button"
                    onClick={() => setFilterRadius(value)}
                    className="rounded-full border px-4 py-2 text-[13px] font-bold transition"
                    style={{
                      background: filterRadius === value ? "#1a7a4a" : "white",
                      color: filterRadius === value ? "white" : "#475569",
                      borderColor: filterRadius === value ? "#1a7a4a" : "#e2e8f0",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Trier par</p>
              <div className="flex gap-2">
                {[
                  { label: "Plus proches", value: "distance" },
                  { label: "Plus récents",  value: "recent"   },
                ].map(({ label, value }) => (
                  <button key={value} type="button"
                    onClick={() => setFilterSort(value)}
                    className="flex-1 rounded-full border py-2.5 text-[13px] font-bold transition"
                    style={{
                      background: filterSort === value ? "#1a7a4a" : "white",
                      color: filterSort === value ? "white" : "#475569",
                      borderColor: filterSort === value ? "#1a7a4a" : "#e2e8f0",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setFilterRadius(null); setFilterSort("distance"); setCategoryFilters([]); }}
                className="flex-1 rounded-full border border-slate-200 py-3 text-[14px] font-bold text-slate-500">
                Réinitialiser
              </button>
              <button type="button"
                onClick={() => setShowFilters(false)}
                className="flex-[2] rounded-full py-3 text-[14px] font-black text-white"
                style={{ background: "#1a7a4a" }}>
                Voir les résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
