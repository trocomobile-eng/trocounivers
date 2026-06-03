import { useEffect, useMemo, useState, useCallback } from "react";
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
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─── Géo ────────────────────────────────────────────────────────────────────

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
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function formatDistance(distanceMeters) {
  if (typeof distanceMeters !== "number") return "";
  if (distanceMeters < 120) return "à moins de 100 m";
  if (distanceMeters < 1000) return `à ${Math.round(distanceMeters / 50) * 50} m`;
  const km = distanceMeters / 1000;
  return `à ${km.toLocaleString("fr-FR", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

// ─── Helpers item ────────────────────────────────────────────────────────────

function normalize(value = "") {
  return String(value).toLowerCase().trim().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function belongsToUser(item, uid) {
  if (!uid) return false;
  return [item.ownerId, item.userId, item.ownerUid, item.createdBy, item.uid]
    .filter(Boolean)
    .includes(uid);
}

function getTimeAgo(item) {
  const raw = item?.createdAt || item?.publishedAt || item?.postedAt || item?.updatedAt || null;
  if (!raw) return "";
  let date;
  if (typeof raw?.toDate === "function") date = raw.toDate();
  else if (raw?.seconds) date = new Date(raw.seconds * 1000);
  else date = new Date(raw);
  if (!date || Number.isNaN(date.getTime())) return "";
  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 5) return "Ajouté à l'instant";
  if (diffMin < 60) return `Ajouté il y a ${diffMin} min`;
  if (diffH < 24) return `Ajouté il y a ${diffH} h`;
  if (diffD === 1) return "Ajouté hier";
  if (diffD < 7) return `Ajouté il y a ${diffD} j`;
  return "";
}

function matchesCategory(item, category) {
  if (!category || category === "Tout") return true;
  const clean = normalize(category);
  return (
    normalize(item.category).includes(clean) ||
    normalize(item.type).includes(clean) ||
    normalize(item.itemType).includes(clean)
  );
}

function matchesSearch(item, search) {
  if (!search.trim()) return true;
  const clean = normalize(search);
  return [
    item.title, item.name, item.type, item.itemType,
    item.category, item.description, item.arrondissement,
    item.location, item.city,
  ].some((v) => normalize(v).includes(clean));
}

function enrichItemsWithDistance(items, userLocation) {
  return items.map((item) => {
    const itemLocation = getItemGeoPoint(item);
    const distanceMeters = getDistanceMeters(userLocation, itemLocation);
    const distanceLabel = formatDistance(distanceMeters);
    const timeAgoLabel = getTimeAgo(item);
    return {
      ...item,
      distanceMeters,
      distanceLabel,
      activityLabel:
        distanceMeters !== null && distanceMeters <= 1000
          ? "Nouveau près de toi"
          : timeAgoLabel,
      localHint:
        distanceMeters !== null && distanceMeters <= 3000
          ? "Disponible dans ton quartier"
          : "",
    };
  });
}

// ─── Helpers display (réexportés pour les cards) ────────────────────────────

export function getItemImage(item) {
  return (
    item?.images?.[0] ||
    item?.photos?.[0] ||
    item?.imageUrl ||
    item?.image ||
    item?.photoUrl ||
    "/assets/images/empty-library.png"
  );
}

export function getItemTitle(item) {
  return item?.title || item?.name || item?.itemName || item?.type || "Objet";
}

export function getItemLocation(item) {
  return (
    item?.district ||
    item?.arrondissement ||
    item?.city ||
    item?.locationArea ||
    item?.location ||
    "Paris"
  );
}

// ─── Constantes ─────────────────────────────────────────────────────────────

export const RADIUS_OPTIONS = [
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "Tout Paris", value: "all" },
];

// ─── Hook principal ──────────────────────────────────────────────────────────

export default function useFeedItems() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [viewMode, setViewMode] = useState("list");
  const [radius, setRadius] = useState(3000);

  // Écoute profil utilisateur (favoris + localisation)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        const data = snap.data() || {};
        const loc = getGeoPoint(data.location);
        setFavoriteItemIds(Array.isArray(data.favoriteItemIds) ? data.favoriteItemIds : []);
        setLocationEnabled(Boolean(data.locationEnabled && loc));
        setUserLocation(loc);
      },
      (err) => console.error("Erreur profil :", err)
    );
    return () => unsub();
  }, [user?.uid]);

  // Écoute mes propres items (pour le matching)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "items"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => setMyItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Erreur mes items :", err)
    );
    return () => unsub();
  }, [user?.uid]);

  // Écoute collection items
  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Erreur items :", err)
    );
    return () => unsub();
  }, []);

  const recentItems = useMemo(
    () =>
      items
        .filter((item) => item.status !== "deleted" && !belongsToUser(item, user?.uid))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 10),
    [items, user?.uid]
  );

  const myCategories = useMemo(
    () => new Set(myItems.map((i) => normalize(i.category || "")).filter(Boolean)),
    [myItems]
  );

  // Items visibles filtrés + enrichis
  const visibleItems = useMemo(() => {
    return enrichItemsWithDistance(items, userLocation)
      .filter((item) => item.status !== "deleted")
      .filter((item) => !belongsToUser(item, user?.uid))
      .filter((item) => matchesCategory(item, activeCategory))
      .filter((item) => matchesSearch(item, search))
      .filter(
        (item) =>
          radius === "all" || item.distanceMeters === null || item.distanceMeters <= radius
      )
      .sort((a, b) => {
        if (!userLocation) return 0;
        if (a.distanceMeters === null) return 1;
        if (b.distanceMeters === null) return -1;
        return a.distanceMeters - b.distanceMeters;
      })
      .map((item) => {
        const prefs = item.tradePreferences;
        let isMatch = false;
        if (prefs && myCategories.size > 0) {
          const wantedCats = Array.isArray(prefs.categories) ? prefs.categories : [];
          if (wantedCats.length === 0 && prefs.openToSurprises) {
            isMatch = true;
          } else {
            isMatch = wantedCats.some((cat) => myCategories.has(normalize(cat)));
          }
        }
        return { ...item, isMatch };
      });
  }, [items, user?.uid, activeCategory, search, userLocation, radius, myCategories]);

  // Toggle favori avec optimistic update
  const toggleFavorite = useCallback(async (itemId) => {
    if (!user?.uid) {
      alert("Connecte-toi pour ajouter un favori.");
      return;
    }
    const isFav = favoriteItemIds.includes(itemId);
    const userRef = doc(db, "users", user.uid);
    setFavoriteItemIds((cur) =>
      isFav ? cur.filter((id) => id !== itemId) : [...cur, itemId]
    );
    try {
      await updateDoc(userRef, {
        favoriteItemIds: isFav ? arrayRemove(itemId) : arrayUnion(itemId),
      });
    } catch {
      setFavoriteItemIds((cur) =>
        isFav ? [...cur, itemId] : cur.filter((id) => id !== itemId)
      );
      try {
        await setDoc(userRef, { favoriteItemIds: isFav ? [] : [itemId] }, { merge: true });
      } catch {
        alert("Impossible de modifier les favoris.");
      }
    }
  }, [user?.uid, favoriteItemIds]);

  // Demande de géolocalisation
  const requestLocation = useCallback(async () => {
    if (!user?.uid) {
      alert("Vous devez être connecté pour activer la localisation.");
      return;
    }
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { locationEnabled: true, location: loc, locationUpdatedAt: new Date() },
            { merge: true }
          );
          setUserLocation(loc);
          setLocationEnabled(true);
        } catch {
          alert("La position a été trouvée, mais impossible de l'enregistrer.");
        }
      },
      (err) => {
        if (err.code === 1) {
          alert("Vous avez refusé la localisation. Vous pourrez l'activer plus tard.");
          return;
        }
        alert("Impossible d'accéder à votre position.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [user?.uid]);

  return {
    // données
    visibleItems,
    recentItems,
    favoriteItemIds,
    userLocation,
    locationEnabled,
    // filtres
    search, setSearch,
    activeCategory, setActiveCategory,
    viewMode, setViewMode,
    radius, setRadius,
    // actions
    toggleFavorite,
    requestLocation,
  };
}
