export function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function belongsToUser(item, uid, email) {
  if (!uid && !email) return false;

  const ids = [
    item.ownerId,
    item.userId,
    item.ownerUid,
    item.createdBy,
    item.uid,
  ]
    .filter(Boolean)
    .map(String);

  const emails = [
    item.ownerEmail,
    item.userEmail,
    item.createdByEmail,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return (
    ids.includes(String(uid || "")) ||
    emails.includes(String(email || "").toLowerCase())
  );
}

export function getInitial(profile) {
  const name =
    profile?.displayName ||
    profile?.username ||
    profile?.email ||
    "Utilisateur";

  return clean(name).charAt(0).toUpperCase() || "U";
}

export function getDisplayName(profile) {
  return (
    clean(profile?.displayName) ||
    clean(profile?.username) ||
    clean(profile?.email)?.split("@")[0] ||
    "Utilisateur Troco"
  );
}

export function getHandle(profile, userId) {
  const raw =
    clean(profile?.handle) ||
    clean(profile?.username) ||
    clean(profile?.displayName);

  const handle = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  if (handle) return `@${handle}`;

  return `@troco.${String(userId || "").slice(0, 5)}`;
}

export function getBio(profile) {
  return (
    clean(profile?.bio) ||
    clean(profile?.description) ||
    clean(profile?.about) ||
    "Aime chiner, réparer et donner une seconde vie aux objets 🌿"
  );
}

export function getLocation(profile) {
  return (
    clean(profile?.arrondissement) ||
    clean(profile?.district) ||
    clean(profile?.location) ||
    clean(profile?.city) ||
    "Paris"
  );
}

export function getPhoto(profile) {
  return (
    profile?.photoURL ||
    profile?.photoUrl ||
    profile?.avatarUrl ||
    profile?.avatar ||
    ""
  );
}

export function formatRelativeTime(value) {
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

  return raw.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function normalizePreferenceLabel(value = "") {
  const label = clean(value);
  if (!label) return "";

  const lower = label.toLowerCase();

  if (lower.includes("photo") || lower.includes("appareil")) return "🎞 " + label;
  if (lower.includes("livre")) return "📚 " + label;
  if (lower.includes("plante")) return "🌿 " + label;
  if (lower.includes("musique") || lower.includes("instrument") || lower.includes("guitare")) return "🎸 " + label;
  if (lower.includes("café") || lower.includes("cafe")) return "☕ " + label;
  if (lower.includes("vélo") || lower.includes("velo")) return "🚲 " + label;
  if (lower.includes("design") || lower.includes("déco") || lower.includes("deco") || lower.includes("meuble")) return "🪑 " + label;

  return label;
}

export function getTradePreferences(profile = {}) {
  const preferences = profile?.tradePreferences || {};

  const lookingFor =
    preferences.lookingFor ||
    profile?.lookingFor ||
    profile?.wantedItems ||
    profile?.wantedCategories ||
    profile?.searchingFor ||
    profile?.tradeWants ||
    [];

  const notLookingFor =
    preferences.notLookingFor ||
    profile?.notLookingFor ||
    profile?.excludedItems ||
    profile?.avoidItems ||
    profile?.notInterestedIn ||
    [];

  const universe =
    preferences.universe ||
    profile?.universe ||
    profile?.interests ||
    profile?.tags ||
    profile?.lifestyleTags ||
    [];

  const note =
    preferences.note ||
    profile?.tradePreferencesNote ||
    profile?.preferencesNote ||
    "";

  return {
    lookingFor: Array.isArray(lookingFor) ? lookingFor.filter(Boolean) : [],
    notLookingFor: Array.isArray(notLookingFor) ? notLookingFor.filter(Boolean) : [],
    universe: Array.isArray(universe) ? universe.filter(Boolean) : [],
    note: clean(note),
  };
}
export function getCompletedExchangeCount(profile) {
  return profile?.completedExchanges || profile?.exchangeCount || profile?.stats?.completedExchanges || 0;
}

export function getMemberSince(profile) {
  const raw = profile?.createdAt || profile?.joinedAt || profile?.memberSince;
  const date =
    raw?.toDate?.() ||
    (raw?.seconds ? new Date(raw.seconds * 1000) : null) ||
    (raw ? new Date(raw) : null);

  if (!date || Number.isNaN(date.getTime())) return "membre actif";

  return `depuis ${date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
}
