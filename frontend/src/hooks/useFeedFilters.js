import { useCallback, useMemo, useState } from "react";

// ─── Constantes ──────────────────────────────────────────────────────────────

export const RADIUS_OPTIONS = [
  { label: "500 m",      value: 500 },
  { label: "1 km",       value: 1000 },
  { label: "3 km",       value: 3000 },
  { label: "Tout Paris", value: "all" },
];

export const CATEGORIES = [
  "Tout",
  "Maison",
  "Mode",
  "Loisirs",
  "Tech",
  "Livres",
  "Musique",
  "Autres",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function matchesCategory(item, category) {
  if (!category || category === "Tout") return true;
  const clean = normalize(category);
  return (
    normalize(item.category ?? "").includes(clean) ||
    normalize(item.type ?? "").includes(clean) ||
    normalize(item.itemType ?? "").includes(clean)
  );
}

export function matchesSearch(item, search) {
  if (!search.trim()) return true;
  const clean = normalize(search);
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
  ].some((v) => normalize(v ?? "").includes(clean));
}

export function matchesRadius(item, radius) {
  if (radius === "all") return true;
  // Si pas de distance calculée, on laisse passer
  if (item.distanceMeters === null || item.distanceMeters === undefined) return true;
  return item.distanceMeters <= radius;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export default function useFeedFilters() {
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [viewMode, setViewMode]           = useState("list");
  const [radius, setRadius]               = useState(3000);

  // Indique si au moins un filtre non-défaut est actif
  const hasActiveFilters = useMemo(
    () => search.trim() !== "" || activeCategory !== "Tout" || radius !== 3000,
    [search, activeCategory, radius]
  );

  // Remet tout à zéro
  const resetFilters = useCallback(() => {
    setSearch("");
    setActiveCategory("Tout");
    setRadius(3000);
  }, []);

  // Applique les filtres à une liste d'items déjà enrichis (avec distanceMeters)
  const applyFilters = useCallback(
    (items) =>
      items
        .filter((item) => matchesCategory(item, activeCategory))
        .filter((item) => matchesSearch(item, search))
        .filter((item) => matchesRadius(item, radius)),
    [activeCategory, search, radius]
  );

  return {
    // état
    search,         setSearch,
    activeCategory, setActiveCategory,
    viewMode,       setViewMode,
    radius,         setRadius,
    // dérivés
    hasActiveFilters,
    // actions
    resetFilters,
    applyFilters,
  };
}
