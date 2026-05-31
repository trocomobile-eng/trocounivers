import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  PenLine,
  Repeat2,
  Share2,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

import {
  formatLocation,
  getDisplayItemDetails,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";

function clean(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function getOwnerId(item) {
  return item?.ownerId || item?.userId || item?.ownerUid || item?.createdBy || item?.uid || "";
}

function isOwnItem(item, user) {
  if (!item || !user?.uid) return false;

  const userId = String(user.uid);
  const email = String(user.email || "").toLowerCase();

  return (
    String(item.ownerId || "") === userId ||
    String(item.userId || "") === userId ||
    String(item.ownerUid || "") === userId ||
    String(item.createdBy || "") === userId ||
    String(item.uid || "") === userId ||
    (email && String(item.ownerEmail || "").toLowerCase() === email) ||
    (email && String(item.userEmail || "").toLowerCase() === email) ||
    (email && String(item.createdByEmail || "").toLowerCase() === email)
  );
}

function getOwnerName(item, ownerProfile) {
  return (
    clean(item?.ownerName) ||
    clean(item?.ownerDisplayName) ||
    clean(ownerProfile?.displayName) ||
    clean(item?.ownerEmail) ||
    "Utilisateur Troco"
  );
}

function getOwnerAvatar(item, ownerProfile) {
  return (
    item?.ownerPhotoURL ||
    item?.ownerAvatar ||
    ownerProfile?.photoURL ||
    ownerProfile?.avatar ||
    ""
  );
}

function getCondition(item) {
  return item?.condition || item?.conditionLabel || item?.itemCondition || item?.state || "Très bon état";
}

function getPostedDate(item) {
  const raw =
    item?.createdAt ||
    item?.publishedAt ||
    item?.postedAt ||
    item?.updatedAt ||
    item?.date ||
    null;

  if (!raw) return "Posté récemment";

  let date;

  if (typeof raw?.toDate === "function") {
    date = raw.toDate();
  } else if (raw?.seconds) {
    date = new Date(raw.seconds * 1000);
  } else {
    date = new Date(raw);
  }

  if (!date || Number.isNaN(date.getTime())) return "Posté récemment";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 5) return "Posté à l’instant";
  if (diffMinutes < 60) return `Posté il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Posté il y a ${diffHours} h`;
  if (diffDays === 1) return "Posté hier";
  if (diffDays < 7) return `Posté il y a ${diffDays} jours`;
  if (diffDays < 31) return `Posté il y a ${Math.floor(diffDays / 7)} sem.`;

  return `Posté le ${date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })}`;
}

function getImages(item) {
  const images = [
    ...(Array.isArray(item?.images) ? item.images : []),
    ...(Array.isArray(item?.imageUrls) ? item.imageUrls : []),
    ...(Array.isArray(item?.photos) ? item.photos : []),
    item?.imageUrl,
    item?.photoURL,
    item?.photoUrl,
  ].filter(Boolean);

  return [...new Set(images)];
}

function shortName(name = "") {
  const cleaned = clean(name);
  if (!cleaned) return "Utilisateur";
  if (cleaned.includes("@")) return cleaned.split("@")[0];

  const parts = cleaned.split(" ");
  if (parts.length <= 1) return cleaned;

  return `${parts[0]} ${parts[1]?.charAt(0) || ""}.`.trim();
}

function PreferenceChip({ children }) {
  return (
    <span className="rounded-[14px] bg-slate-50 px-4 py-2 text-[14px] font-bold text-slate-700">
      {children}
    </span>
  );
}

export default function ItemDetailPage() {
  const { id, itemId } = useParams();
  const requestedItemId = id || itemId;

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [item, setItem] = useState(location.state?.item || null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(!location.state?.item);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function loadItem() {
      if (!requestedItemId) return;

      setLoading(true);

      try {
        const snapshot = await getDoc(doc(db, "items", requestedItemId));

        if (!snapshot.exists()) {
          setItem(null);
          setOwnerProfile(null);
          return;
        }

        const loadedItem = { id: snapshot.id, ...snapshot.data() };
        setItem(loadedItem);

        const ownerId = getOwnerId(loadedItem);

        if (ownerId) {
          try {
            const ownerSnapshot = await getDoc(doc(db, "users", ownerId));
            setOwnerProfile(ownerSnapshot.exists() ? ownerSnapshot.data() : null);
          } catch (error) {
            console.error("Erreur chargement profil propriétaire :", error);
            setOwnerProfile(null);
          }
        }
      } catch (error) {
        console.error("Erreur chargement objet :", error);
        setItem(null);
        setOwnerProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [requestedItemId]);

  const images = useMemo(() => getImages(item), [item]);
  const mainImage = images[activeImageIndex] || getItemImage(item);

  const ownerName = getOwnerName(item, ownerProfile);
  const ownerAvatar = getOwnerAvatar(item, ownerProfile);
  const isOwner = isOwnItem(item, user);
  const { favoriteIds, toggle: toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.includes(item?.id);

  const title = getDisplayItemType(item) || item?.title || item?.itemType || item?.type || "Objet";
  const details = getDisplayItemDetails(item) || item?.category || "";
  const condition = getCondition(item);
  const itemLocation = item ? formatLocation(item) : "Paris";
  const postedDate = getPostedDate(item);
  const description =
    clean(item?.description || item?.details || item?.itemDetails) ||
    "Encore en bon état, disponible pour un échange.";

  function goToEdit() {
    if (!item?.id) return;

    navigate(`/items/${item.id}/edit`, {
      state: { item },
    });
  }

  function proposeExchange() {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    if (!item?.id) return;

    if (isOwner) {
      goToEdit();
      return;
    }

    navigate(`/propose/${item.id}`);
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-400">
        Chargement de l'objet...
      </div>
    );
  }

  if (!item) {
    return (
      <>
        <button type="button" onClick={() => navigate(-1)} className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-[#E4ECE8] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)]" aria-label="Retour">
          <ArrowLeft size={18} strokeWidth={2.3} className="text-[#0d1b2a]" />
        </button>
        <div className="rounded-[20px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <p className="text-[17px] font-extrabold text-[#0d1b2a]">Objet introuvable</p>
          <p className="mt-2 text-[14px] font-medium text-slate-500">Cet objet n'existe plus ou n'est pas disponible.</p>
          <button type="button" onClick={() => navigate("/feed")} className="troco-primary-btn mt-5 rounded-full">Retour au feed</button>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[760px] pb-10">
        <section className="relative">
          <div className="overflow-hidden rounded-[32px] bg-slate-100 shadow-[0_12px_34px_rgba(15,23,42,0.07)]">
            <div className="aspect-[1.3/1] w-full">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl text-slate-300">
                  📦
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d1b2a] shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
            aria-label="Retour"
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>

          <button
            type="button"
            onClick={isOwner ? goToEdit : () => toggleFavorite(item?.id)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0d1b2a] shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
            aria-label={isOwner ? "Modifier l’objet" : "Ajouter aux favoris"}
          >
            {isOwner ? (
              <PenLine size={20} strokeWidth={2.25} />
            ) : (
              <Heart size={21} strokeWidth={2.2} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-[#1ABEA3]" : ""} />
            )}
          </button>

          {images.length > 1 && (
            <>
              <div className="absolute bottom-4 left-1/2 rounded-full bg-black/42 px-3 py-1 text-[12px] font-black text-white backdrop-blur-md -translate-x-1/2">
                {activeImageIndex + 1}/{images.length}
              </div>

              <div className="mt-3 flex justify-center gap-2">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={[
                      "h-2 rounded-full transition",
                      index === activeImageIndex ? "w-5 bg-[#0f9f9a]" : "w-2 bg-slate-300",
                    ].join(" ")}
                    aria-label={`Voir l’image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
                {isOwner ? "Ton objet" : "Objet proposé"}
              </p>

              <h1 className="mt-2 text-[24px] font-black leading-[0.98] tracking-[-0.055em] text-[#081225] sm:text-[28px]">
                {title}
              </h1>
            </div>

            <button
              type="button"
              onClick={isOwner ? goToEdit : undefined}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#1ABEA3] shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
              aria-label={isOwner ? "Modifier l’objet" : "Partager"}
            >
              {isOwner ? (
                <PenLine size={20} strokeWidth={2.25} />
              ) : (
                <Share2 size={20} strokeWidth={2.25} />
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-slate-500">
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt={ownerName}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[12px] font-black text-slate-500">
                {ownerName.charAt(0).toUpperCase()}
              </span>
            )}

            <span>
              {postedDate} par{" "}
              <span className="font-black text-slate-700">
                {isOwner ? "toi" : shortName(ownerName)}
              </span>
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-[14px] bg-[#F0FAF7] px-3 py-1.5 text-[14px] font-black text-[#1ABEA3]">
              {condition}
            </span>

            {details && (
              <span className="rounded-[14px] bg-slate-50 px-3 py-1.5 text-[14px] font-bold text-slate-600">
                {details}
              </span>
            )}

            {isOwner && (
              <span className="rounded-[14px] bg-sky-50 px-3 py-1.5 text-[14px] font-black text-sky-700">
                Visible dans ta bibliothèque
              </span>
            )}
          </div>

          <p className="mt-5 flex items-center gap-3 text-[17px] font-semibold text-slate-500">
            <MapPin size={21} className="text-[#1ABEA3]" strokeWidth={2.25} />
            {itemLocation}
          </p>

          <div className="mt-6 h-px bg-slate-100" />

          <div className="mt-5">
            <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
              Description
            </p>

            <p className="mt-3 text-[16px] font-medium leading-relaxed text-slate-600">
              {description}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          {isOwner ? (
            <>
              <p className="text-[17px] font-semibold leading-relaxed text-[#081225]">
                C’est ton objet. Tu peux modifier les photos, le titre, la catégorie ou le retirer de Troco.
              </p>

              <button
                type="button"
                onClick={goToEdit}
                className="mt-4 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] text-[17px] font-black text-white shadow-[0_14px_30px_rgba(16,185,129,0.18)] transition active:scale-[0.98]"
              >
                <PenLine size={20} strokeWidth={2.4} />
                Modifier mon objet
              </button>
            </>
          ) : (
            <>
              <p className="text-[17px] font-semibold leading-relaxed text-[#081225]">
                Tu as un objet qui pourrait plaire à {shortName(ownerName)} ?
              </p>

              <button
                type="button"
                onClick={proposeExchange}
                className="mt-4 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1ABEA3] to-[#36C982] text-[17px] font-black text-white shadow-[0_14px_30px_rgba(16,185,129,0.18)] transition active:scale-[0.98]"
              >
                <Repeat2 size={20} strokeWidth={2.4} />
                Proposer un troc
              </button>

              <button
                type="button"
                onClick={() => navigate("/messages")}
                className="mt-4 flex w-full items-center justify-center gap-2 text-[16px] font-black text-[#1ABEA3]"
              >
                <MessageCircle size={20} strokeWidth={2.3} />
                Ou envoyer un message
              </button>
            </>
          )}
        </section>

        {!isOwner && (
          <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FAF7] text-[#1ABEA3]">
                <Gift size={22} strokeWidth={2.25} />
              </div>

              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#1ABEA3]">
                  Ses envies
                </p>

                <h3 className="mt-1 text-[24px] font-black leading-[1] tracking-[-0.04em] text-[#081225]">
                  Ce qu’il recherche
                </h3>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <PreferenceChip>🎸 Instruments</PreferenceChip>
              <PreferenceChip>📚 Livres</PreferenceChip>
              <PreferenceChip>☕ Café / déco</PreferenceChip>
            </div>

            <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-500">
              Ces indices t’aident à proposer un objet qui pourrait vraiment lui plaire.
            </p>

            <div className="mt-5 rounded-[20px] bg-[#F0FAF7]/60 p-4 text-[15px] font-medium leading-relaxed text-slate-700">
              {shortName(ownerName)} n’a pas encore précisé ses envies.
              <span className="font-bold text-[#1ABEA3]">
                {" "}Tu peux quand même proposer un troc.
              </span>
            </div>
          </section>
        )}
      </main>

    </>
  );
}
