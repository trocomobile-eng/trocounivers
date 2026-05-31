import { useEffect, useState } from "react";
import { Check, Heart, PenLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatLocation(item) {
  const arrondissement = clean(
    item?.arrondissement || item?.locationArea || item?.location_area || item?.district || ""
  );
  const location = clean(item?.location || item?.city || item?.ville || "");

  const match =
    arrondissement.match(/(\d{1,2})(?:er|e|ème|eme)?/i) ||
    location.match(/^paris\s+(\d{1,2})/i);

  if (match?.[1]) {
    const n = Number(match[1]);
    if (n >= 1 && n <= 20) return `Paris ${n === 1 ? "1er" : `${n}e`}`;
  }

  return location || arrondissement || "Paris";
}

function getImage(item) {
  return (
    item?.images?.[0] ||
    item?.imageUrls?.[0] ||
    item?.photos?.[0] ||
    item?.imageUrl ||
    item?.photoURL ||
    item?.photoUrl ||
    "/assets/images/empty-item.png"
  );
}

function getTitle(item) {
  return item?.title || item?.itemType || item?.type || "Objet";
}

const CONDITION_FR = {
  "new": "Neuf",
  "like_new": "Comme neuf",
  "very_good": "Très bon état",
  "good": "Bon état",
  "fair": "Quelques traces d'usage",
  "poor": "Usé mais fonctionnel",
  "neuf": "Neuf",
  "comme neuf": "Comme neuf",
  "très bon état": "Très bon état",
  "bon état": "Bon état",
  "quelques traces d'usage": "Quelques traces d'usage",
  "usé mais fonctionnel": "Usé mais fonctionnel",
};

function getCondition(item) {
  const raw = item?.conditionLabel || item?.condition || item?.state || item?.itemCondition || "";
  return CONDITION_FR[raw.toLowerCase()] || raw;
}

function getOwnerId(item) {
  return (
    item?.ownerId || item?.userId || item?.ownerUid || item?.createdBy ||
    item?.uid || item?.owner?.id || item?.owner?.uid ||
    item?.user?.id || item?.user?.uid || item?.createdById || ""
  );
}

function getOwnerProfilePath(item) {
  const id = getOwnerId(item);
  return id ? `/users/${id}` : "";
}

function getOwnerName(item) {
  const value =
    item?.ownerName || item?.ownerDisplayName || item?.userName ||
    item?.displayName || item?.createdByName || "";
  if (!value) return "Utilisateur";
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
  return String(value || "?").trim().charAt(0).toUpperCase();
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

// Palette couleurs avatar par initiale
const AVATAR_COLORS = [
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-violet-500", "bg-pink-500", "bg-orange-500", "bg-amber-500",
];

function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function OwnerAvatar({ item, name }) {
  const photo = getOwnerPhoto(item);
  const color = getAvatarColor(name);

  return (
    <span className={["flex h-[22px] w-[22px] shrink-0 overflow-hidden rounded-full text-white", photo ? "" : color].join(" ")}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          draggable="false"
          className="pointer-events-none h-full w-full select-none object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] font-black">
          {getInitial(name)}
        </span>
      )}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────


// ─── Hook favori autonome ─────────────────────────────────────────────────────

function useFavorite(itemId, defaultFavorite = false) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(defaultFavorite);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hydrated) setIsFavorite(defaultFavorite);
  }, [defaultFavorite, hydrated]);

  useEffect(() => {
    if (!user?.uid || !itemId) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const ids = snap.data()?.favoriteItemIds || [];
      setIsFavorite(ids.includes(itemId));
      setHydrated(true);
    });
    return () => unsub();
  }, [user?.uid, itemId]);

  async function toggle() {
    if (!user?.uid || !itemId) return;
    const ref = doc(db, "users", user.uid);
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await updateDoc(ref, {
        favoriteItemIds: next ? arrayUnion(itemId) : arrayRemove(itemId),
      });
    } catch {
      setIsFavorite(!next);
    }
  }

  return { isFavorite, toggle };
}

export default function ItemCard({
  item,
  selectable = false,
  selected = false,
  onSelect,
  compact = false,
  owned = false,
  mode,
  defaultFavorite = false,
}) {
  const navigate = useNavigate();
  const { isFavorite, toggle: toggleFavorite } = useFavorite(item?.id, defaultFavorite);

  const effectiveMode = mode || (selectable ? "select" : owned ? "owned" : "browse");

  const image       = getImage(item);
  const title       = getTitle(item);
  const location    = formatLocation(item);
  const ownerName   = getOwnerName(item);
  const condition   = getCondition(item);
  const relativeTime = formatRelativeTime(item?.createdAt || item?.updatedAt);
  const profilePath = getOwnerProfilePath(item);

  function handleClick(event) {
    if (!item?.id) return;
    if (effectiveMode === "select") {
      event.preventDefault();
      onSelect?.(item.id, item);
      return;
    }
    if (effectiveMode === "owned") {
      event.preventDefault();
      navigate(`/items/${item.id}/edit`, { state: { item } });
    }
  }

  const content = (
    <article
      className={[
        "group relative overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.07)] transition duration-200",
        effectiveMode === "browse"
          ? "hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
          : "active:scale-[0.985]",
        selected ? "ring-2 ring-[#1ABEA3]/40" : "",
      ].join(" ")}
    >
      {/* Image carrée */}
      <div
        className="relative aspect-[1.45/1] overflow-hidden bg-[#F0F0EE]"
        onDragStart={(e) => e.preventDefault()}
      >
        <img
          src={image}
          alt={title}
          draggable="false"
          className="pointer-events-none h-full w-full select-none object-cover transition duration-500 group-hover:scale-[1.015]"
        />

        {/* Overlay bouton selon mode */}
        {effectiveMode === "select" ? (
          <span className={[
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.12)]",
            selected ? "bg-[#1ABEA3] text-white" : "bg-white text-slate-400",
          ].join(" ")}>
            {selected && <Check size={16} strokeWidth={2.8} />}
          </span>
        ) : effectiveMode === "owned" ? (
          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0d1b2a] shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
            <PenLine size={14} strokeWidth={2.2} />
          </span>
        ) : (
          <button
            type="button"
            className={[
              "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition active:scale-95",
              isFavorite ? "text-[#1ABEA3]" : "text-slate-400",
            ].join(" ")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite();
            }}
            aria-label="Ajouter aux favoris"
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.1} />
          </button>
        )}
      </div>

      {/* Infos */}
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-snug tracking-[-0.02em] text-[#0d1b2a]">
          {title}
        </h3>

        {/* Avatar + nom */}
        {effectiveMode === "browse" && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (profilePath) navigate(profilePath);
            }}
            className="mt-1 flex min-w-0 items-center gap-1.5"
          >
            <OwnerAvatar item={item} name={ownerName} />
            <span className="min-w-0 truncate text-[12px] font-bold text-[#1ABEA3]">
              {ownerName}
            </span>
          </button>
        )}

        {/* Localisation + date */}
        <p className="mt-1 truncate text-[11.5px] font-medium text-[#94a3b8]">
          {[location, relativeTime].filter(Boolean).join(" · ")}
        </p>

        {/* Condition */}
        {condition && (
          <span className="mt-1 inline-flex items-center rounded-full bg-[#F0FAF7] px-2.5 py-0.5 text-[11px] font-bold text-[#1ABEA3]">
            {condition}
          </span>
        )}
      </div>
    </article>
  );

  if (effectiveMode === "owned" || effectiveMode === "select") {
    return (
      <button type="button" onClick={handleClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link to={`/items/${item?.id}`} className="block">
      {content}
    </Link>
  );
}
