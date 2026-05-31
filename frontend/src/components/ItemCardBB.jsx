import { Check, Heart, MapPin, PenLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function clean(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatLocation(item) {
  const arrondissement = clean(
    item?.arrondissement ||
      item?.locationArea ||
      item?.location_area ||
      item?.district ||
      ""
  );

  const location = clean(item?.location || item?.city || item?.ville || "");

  const match =
    arrondissement.match(/(\d{1,2})(?:er|e|ème|eme)?/i) ||
    location.match(/^paris\s+(\d{1,2})/i);

  if (match?.[1]) {
    const number = Number(match[1]);
    if (number >= 1 && number <= 20) {
      return `Paris ${number === 1 ? "1er" : `${number}e`}`;
    }
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
    "https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=1200&auto=format&fit=crop"
  );
}

function getTitle(item) {
  return item?.title || item?.itemType || item?.type || "Objet";
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

function OwnerAvatar({ item, name }) {
  const photo = getOwnerPhoto(item);

  return (
    <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#E8F4EF] via-[#DDF1EA] to-[#F5EFE4] text-[#4C7468] shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
      {photo ? (
        <img src={photo} alt={name} draggable="false" className="pointer-events-none h-full w-full select-none object-cover contrast-[1.03] brightness-[1.01] saturate-[1.02]" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[11px] font-black">
          {getInitial(name)}
        </span>
      )}
    </span>
  );
}

export default function ItemCard({
  item,
  selectable = false,
  selected = false,
  onSelect,
  compact = false,
  owned = false,
  mode,
}) {
  const navigate = useNavigate();

  const effectiveMode =
    mode ||
    (selectable ? "select" : owned ? "owned" : "browse");

  const image = getImage(item);
  const title = getTitle(item);
  const location = formatLocation(item);
  const ownerName = getOwnerName(item);
  const relativeTime = formatRelativeTime(item?.createdAt || item?.updatedAt);

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
        "group relative overflow-hidden rounded-[20px] border border-[#E4ECE8] bg-white/[0.985] shadow-[0_14px_34px_rgba(15,23,42,0.065)] transition duration-200",
        effectiveMode === "owned" || effectiveMode === "select"
          ? "active:scale-[0.985]"
          : "hover:-translate-y-[1px] hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]",
        selected ? "ring-2 ring-[#18B89D]/35" : "",
      ].join(" ")}
    >
      <div className="relative aspect-[1.05/1] overflow-hidden bg-[#F5F7F5]" onDragStart={(event) => event.preventDefault()}>
        <img
          src={image}
          alt={title}
          draggable="false"
          className="pointer-events-none h-full w-full select-none object-cover contrast-[1.03] brightness-[1.01] saturate-[1.02] transition duration-500 group-hover:scale-[1.018]"
        />

        {effectiveMode === "select" ? (
          <span
            className={[
              "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-[0_6px_14px_rgba(15,23,42,0.06)]",
              selected ? "bg-[#18B89D] text-white" : "bg-white/78 text-slate-400",
            ].join(" ")}
          >
            {selected ? <Check size={17} strokeWidth={3} /> : null}
          </span>
        ) : effectiveMode === "owned" ? (
          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/78 text-[#102033] shadow-[0_6px_14px_rgba(15,23,42,0.06)] backdrop-blur-md">
            <PenLine size={16} strokeWidth={2.25} />
          </span>
        ) : (
          <button
            type="button"
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-400 shadow-[0_6px_14px_rgba(15,23,42,0.06)] backdrop-blur-md transition active:scale-95"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            aria-label="Ajouter aux favoris"
          >
            <Heart size={15} strokeWidth={2.1} />
          </button>
        )}
      </div>

      <div className={compact ? "p-3.5 " : "p-3.5"}>
        <h3 className="line-clamp-2 text-[15px] font-extrabold leading-tight tracking-[-0.04em] text-[#102033]">
          {title}
        </h3>

        <div className="mt-3 flex min-w-0 items-center gap-2">
          <OwnerAvatar item={item} name={ownerName} />

          <p className="truncate text-[12px] font-semibold text-[#66758A]">
            par {ownerName}
          </p>
        </div>

        <p className="mt-2 flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-[#66758A]">
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
