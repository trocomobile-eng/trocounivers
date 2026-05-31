import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Gift,
  Heart,
  MapPin,
  PenLine,
  Repeat2,
  Share2,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";

import {
  formatLocation,
  getDisplayItemDetails,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";
import { getTradePreferences, normalizePreferenceLabel } from "../components/profile/profileUtils";

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
      <div className="page">
        <main className="px-5 pb-32 pt-5">
          <div className="rounded-[28px] border border-white/80 bg-white/82 p-6 text-center text-sm font-bold text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            Chargement de l’objet...
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <main className="px-5 pb-32 pt-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/82 text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"
            aria-label="Retour"
          >
            <ArrowLeft size={21} strokeWidth={2.3} />
          </button>

          <div className="rounded-[28px] border border-white/80 bg-white/82 p-7 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <p className="text-lg font-black text-[#081225]">Objet introuvable</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Cet objet n’existe plus ou n’est pas disponible.
            </p>

            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="mt-5 rounded-[20px] bg-gradient-to-r from-[#2ECC8A] to-cyan-400 px-5 py-3 text-sm font-black text-white"
            >
              Retour au feed
            </button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <main className="mx-auto max-w-[760px] px-5 pb-[136px] pt-4 lg:pb-10">
        <section className="relative">
          <div className="overflow-hidden rounded-[32px] bg-slate-100 shadow-[0_12px_34px_rgba(15,23,42,0.07)]">
            <div className="aspect-[1.3/1] w-full">
              {images.length > 0 ? (
                <div
                  className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  onScroll={(event) => {
                    const width = event.currentTarget.clientWidth || 1;
                    const nextIndex = Math.round(event.currentTarget.scrollLeft / width);
                    if (nextIndex !== activeImageIndex) {
                      setActiveImageIndex(Math.max(0, Math.min(nextIndex, images.length - 1)));
                    }
                  }}
                >
                  {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="h-full w-full shrink-0 snap-center">
                      <img
                        src={image}
                        alt={`${title} - photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : mainImage ? (
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
            className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/86 text-[#081225] shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            aria-label="Retour"
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>

          <button
            type="button"
            onClick={isOwner ? goToEdit : undefined}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/86 text-[#081225] shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            aria-label={isOwner ? "Modifier l’objet" : "Ajouter aux favoris"}
          >
            {isOwner ? (
              <PenLine size={20} strokeWidth={2.25} />
            ) : (
              <Heart size={21} strokeWidth={2.2} />
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

        <section className="mt-5 rounded-[30px] border border-white/80 bg-white/88 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">
                {isOwner ? "Ton objet" : "Objet proposé"}
              </p>

              <h1 className="mt-2 text-[24px] font-black leading-[0.98] tracking-[-0.055em] text-[#081225] sm:text-[28px]">
                {title}
              </h1>
            </div>

            <button
              type="button"
              onClick={isOwner ? goToEdit : undefined}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f9a] shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
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
            <span className="rounded-[14px] bg-[#E8F7EF] px-3 py-1.5 text-[14px] font-black text-[#0f9f9a]">
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
            <MapPin size={21} className="text-[#0f9f9a]" strokeWidth={2.25} />
            {itemLocation}
          </p>

          <div className="mt-6 h-px bg-slate-100" />

          <div className="mt-5">
            <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#0f9f9a]">
              Description
            </p>

            <p className="mt-3 text-[16px] font-medium leading-relaxed text-slate-600">
              {description}
            </p>
          </div>
        </section>


        {!isOwner && (() => {
          const ownerPrefs = getTradePreferences(ownerProfile || {});
          const hasLooking = ownerPrefs.lookingFor.length > 0;
          const hasNotLooking = ownerPrefs.notLookingFor.length > 0;

          return (
            <section className="mt-5 rounded-[30px] border border-white/80 bg-white/88 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  const ownerId = getOwnerId(item);
                  if (ownerId) navigate("/users/" + ownerId);
                }}
                className="mb-5 flex w-full items-center gap-3 rounded-[22px] bg-white/78 p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.035)] transition active:scale-[0.99]"
              >
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    alt={ownerName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[18px] font-black text-slate-500">
                    {ownerName.charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[19px] font-black tracking-[-0.035em] text-[#081225]">
                    {shortName(ownerName)}
                  </span>
                  <span className="mt-1 block truncate text-[13px] font-semibold text-slate-500">
                    Membre de la communauté Troco
                  </span>
                </span>

                <span className="text-[20px] font-black text-[#0f9f9a]">›</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Gift size={22} strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    Ses envies
                  </p>
                  <h3 className="mt-1 text-[24px] font-black leading-[1] tracking-[-0.04em] text-[#081225]">
                    Ce qu'il recherche
                  </h3>
                </div>
              </div>

              {hasLooking ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {ownerPrefs.lookingFor.map((tag) => (
                    <PreferenceChip key={normalizePreferenceLabel(tag)}>{normalizePreferenceLabel(tag)}</PreferenceChip>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] bg-slate-50 p-4 text-[15px] font-medium leading-relaxed text-slate-500">
                  {shortName(ownerName)} n'a pas encore précisé ses envies.{" "}
                  <span className="font-bold text-emerald-700">Tu peux quand même proposer un troc.</span>
                </div>
              )}

              {ownerPrefs.note ? (
                <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-500">
                  {ownerPrefs.note}
                </p>
              ) : hasLooking ? (
                <p className="mt-4 text-[14px] font-medium leading-relaxed text-slate-400">
                  Ces indices t'aident à proposer un objet qui pourrait vraiment lui plaire.
                </p>
              ) : null}

              {hasNotLooking && (
                <div className="mt-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Il n'est pas intéressé par
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ownerPrefs.notLookingFor.map((tag) => (
                      <span
                        key={normalizePreferenceLabel(tag)}
                        className="rounded-[14px] bg-slate-100 px-4 py-2 text-[13px] font-bold text-slate-500"
                      >
                        {normalizePreferenceLabel(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const ownerId = getOwnerId(item);
                  if (ownerId) navigate("/users/" + ownerId);
                }}
                className="mt-5 text-[13px] font-black text-[#0f9f9a]"
              >
                Voir le profil complet de {shortName(ownerName)} →
              </button>
            </section>
          );
        })()}

        <section className="mt-6 hidden lg:block">
          <button
            type="button"
            onClick={isOwner ? goToEdit : proposeExchange}
            className="flex h-[62px] w-full items-center justify-center gap-3 rounded-[18px] bg-[#007C6C] text-[19px] font-black text-white shadow-[0_16px_36px_rgba(0,124,108,0.24)] transition active:scale-[0.985]"
          >
            {isOwner ? (
              <PenLine size={22} strokeWidth={2.5} />
            ) : (
              <Repeat2 size={23} strokeWidth={2.5} />
            )}
            {isOwner ? "Modifier mon objet" : "Proposer un échange"}
          </button>
        </section>

      </main>



      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 shadow-[0_-12px_36px_rgba(15,23,42,0.16)] lg:hidden">
        <div className="mx-auto max-w-[760px]">
          <button
            type="button"
            onClick={isOwner ? goToEdit : proposeExchange}
            className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#007C6C] text-[18px] font-black text-white shadow-[0_14px_34px_rgba(0,124,108,0.34)] transition active:scale-[0.98]"
          >
            {isOwner ? (
              <PenLine size={20} strokeWidth={2.5} />
            ) : (
              <Repeat2 size={21} strokeWidth={2.5} />
            )}
            {isOwner ? "Modifier mon objet" : "Proposer un échange"}
          </button>
        </div>
      </div>

      <BottomNav />

    </div>
  );
}
