import { getConditionLabel } from "../constants/itemConditions";

export function formatItemTitle(itemOrTitle) {
  if (!itemOrTitle) return "Objet";

  const title =
    typeof itemOrTitle === "string"
      ? itemOrTitle
      : itemOrTitle.type ||
        itemOrTitle.itemType ||
        itemOrTitle.generatedTitle ||
        itemOrTitle.title ||
        itemOrTitle.subcategory ||
        itemOrTitle.category ||
        "Objet";

  if (String(title).length <= 34) return String(title);
  return `${String(title).slice(0, 34)}…`;
}

export function getDisplayItemType(item) {
  return formatItemTitle(item);
}

export function formatCondition(value) {
  if (!value) return "";

  const fromConstant = getConditionLabel(value);
  if (fromConstant) return fromConstant;

  const raw = String(value).trim().toLowerCase();

  if (["new", "neuf", "comme neuf", "excellent"].includes(raw)) return "Comme neuf";

  if (["very_good", "très bon", "tres bon", "très bon état", "tres bon etat"].includes(raw)) {
    return "Très bon état";
  }

  if (["good", "bon", "bon état", "bon etat"].includes(raw)) return "Bon état";

  if (["used", "usage", "usagé", "usage normal", "vieux"].includes(raw)) {
    return "Quelques traces d’usage";
  }

  if (["functional", "fonctionnel", "usé mais fonctionnel", "use mais fonctionnel"].includes(raw)) {
    return "Usé mais fonctionnel";
  }

  if (["to_restore", "à rénover", "a renover", "à réparer", "a reparer"].includes(raw)) {
    return "À rénover";
  }

  return value;
}

export function formatItemDetails(item) {
  if (!item) return "";

  const details = [];

  if (item.condition) details.push(formatCondition(item.condition));
  if (item.itemCondition) details.push(formatCondition(item.itemCondition));
  if (item.itemDetails) details.push(item.itemDetails);
  if (item.item_details) details.push(item.item_details);
  if (item.details) details.push(item.details);
  if (item.detail) details.push(item.detail);
  if (item.color) details.push(item.color);
  if (item.size) details.push(`taille ${item.size}`);
  if (item.material) details.push(item.material);
  if (item.brand) details.push(item.brand);

  return [...new Set(details.filter(Boolean))].join(" • ");
}

export function getDisplayItemDetails(item) {
  return formatItemDetails(item);
}

export function getItemImages(item) {
  if (!item) return [];

  const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls.filter(Boolean) : [];
  const photos = Array.isArray(item.photos) ? item.photos.filter(Boolean) : [];

  const legacyMain =
    item.imageUrl ||
    item.image_url ||
    item.image ||
    item.photoURL ||
    item.photoUrl ||
    "";

  const all = legacyMain
    ? [legacyMain, ...images, ...imageUrls, ...photos]
    : [...images, ...imageUrls, ...photos];

  return [...new Set(all.filter(Boolean))];
}

export function getItemImage(item) {
  const images = getItemImages(item);

  if (!images.length) return "";

  const mainImageIndex =
    typeof item?.mainImageIndex === "number" ? item.mainImageIndex : 0;

  return images[mainImageIndex] || images[0] || "";
}

export function formatCategory(itemOrCategory) {
  if (!itemOrCategory) return "Autre";
  if (typeof itemOrCategory === "string") return itemOrCategory || "Autre";
  return itemOrCategory.category || "Autre";
}

function normalizeParisArea(value = "") {
  const raw = String(value).trim();
  if (!raw) return "";

  const match = raw.match(/(?:paris\s*)?(\d{1,2})(?:er|e|ème|eme)?/i);

  if (match?.[1]) {
    const number = Number(match[1]);

    if (number >= 1 && number <= 20) {
      return `Paris ${number === 1 ? "1er" : `${number}e`}`;
    }
  }

  return raw;
}

export function formatLocation(item) {
  if (!item) return "Paris";

  const neighborhood = item.neighborhood || item.quartier || item.district || "";

  const arrondissement =
    item.arrondissement ||
    item.locationArea ||
    item.location_area ||
    "";

  const city = item.city || item.ville || "";

  const location =
    item.location ||
    item.locationDetails ||
    item.location_details ||
    "";

  if (location === "Autre") return item.customLocation || item.custom_location || "Autre";

  const cleanArrondissement = normalizeParisArea(arrondissement || location);

  if (neighborhood && cleanArrondissement && neighborhood !== cleanArrondissement) {
    return `${neighborhood} • ${cleanArrondissement}`;
  }

  if (cleanArrondissement) return cleanArrondissement;

  if (city) return city;

  return "Paris";
}

export function formatRelativeDate(timestamp) {
  if (!timestamp) return "";

  try {
    const date =
      timestamp?.toDate?.() ||
      (timestamp?.seconds ? new Date(timestamp.seconds * 1000) : null) ||
      new Date(timestamp);

    const diff = Math.floor((new Date() - date) / 1000);

    if (diff < 60) return "à l’instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return "hier";

    return `il y a ${Math.floor(diff / 86400)} j`;
  } catch {
    return "";
  }
}

export function formatDate(itemOrTimestamp) {
  const timestamp =
    itemOrTimestamp?.createdAt ||
    itemOrTimestamp?.created_at ||
    itemOrTimestamp;

  return formatRelativeDate(timestamp);
}

export function formatShortDate(timestamp) {
  if (!timestamp) return "";

  try {
    const date =
      timestamp?.toDate?.() ||
      (timestamp?.seconds ? new Date(timestamp.seconds * 1000) : null) ||
      new Date(timestamp);

    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
