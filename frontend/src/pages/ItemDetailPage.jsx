import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
import AmbassadorBadge from "../components/AmbassadorBadge";
import { isAmbassador } from "../utils/ambassador";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { AIVerificationStatus } from "../components/AIVerification";

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
    <span className="rounded-full border border-[#E7ECEB] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#17212B]">
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
  const details = clean(item?.itemDetails || item?.item_details || item?.brand || "");
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
        <motion.section
          className="relative"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="overflow-hidden rounded-[24px] bg-[#F2F4F3] shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
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
        </motion.section>

        <motion.section
          className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.08)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* Titre + action */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] font-black leading-[1.05] tracking-[-0.05em] text-[#17212B] sm:text-[26px]">
                {title}
              </h1>
            </div>

            <button
              type="button"
              onClick={isOwner ? goToEdit : undefined}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E7ECEB] bg-white text-[#6F7782] shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition active:scale-95"
              aria-label={isOwner ? "Modifier l’objet" : "Partager"}
            >
              {isOwner ? (
                <PenLine size={17} strokeWidth={2.25} />
              ) : (
                <Share2 size={17} strokeWidth={2.25} />
              )}
            </button>
          </div>

          {/* Owner row */}
          <div className="mt-3 flex items-center gap-2.5">
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt={ownerName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22C58B] to-[#1ABEA3] text-[12px] font-black text-white">
                {ownerName.charAt(0).toUpperCase()}
              </span>
            )}

            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#17212B]">
                {isOwner ? (
                  "Ton objet"
                ) : (
                  <>
                    Par{" "}
                    <Link
                      to={`/u/${getOwnerId(item)}`}
                      className="text-[#1ABEA3] hover:underline"
                    >
                      {shortName(ownerName)}
                    </Link>
                    {isAmbassador(ownerProfile) && <AmbassadorBadge className="ml-1" />}
                  </>
                )}
              </p>
              <p className="text-[11px] font-medium text-[#6F7782]">{postedDate}</p>
            </div>
          </div>

          {isAmbassador(ownerProfile) && (
            <p className="mt-2 text-[11.5px] font-medium text-[#94a3b8]">
              Compte créé par l’équipe Troco à titre d’exemple.
            </p>
          )}

          {/* Badges état + détails */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#F0FAF7] px-3 py-1.5 text-[12.5px] font-bold text-[#1ABEA3]">
              {condition}
            </span>

            {details && (
              <span className="rounded-full bg-[#F6F9F8] px-3 py-1.5 text-[12.5px] font-medium text-[#6F7782]">
                {details}
              </span>
            )}

            {isOwner && (
              <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[12.5px] font-bold text-sky-600">
                Dans ta bibliothèque
              </span>
            )}
          </div>

          {/* Vérification IA */}
          {item?.aiVerification && (
            <div className="mt-4">
              <AIVerificationStatus verificationData={item.aiVerification} />
            </div>
          )}

          {/* Lieu */}
          <p className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#6F7782]">
            <MapPin size={16} className="text-[#1ABEA3]" strokeWidth={2.25} />
            {itemLocation}
          </p>

          <div className="mt-5 h-px bg-[#F0F3F2]" />

          {/* Description */}
          <div className="mt-4">
            <p className="text-[11px] font-black uppercase tracking-[0.20em] text-[#1ABEA3]">
              Description
            </p>
            <p className="mt-2.5 text-[15px] font-medium leading-relaxed text-[#6F7782]">
              {description}
            </p>
          </div>
        </motion.section>

        <motion.section
          className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.08)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {isOwner ? (
            <>
              <p className="text-[15px] font-medium leading-relaxed text-[#6F7782]">
                C’est ton objet. Tu peux modifier les photos, le titre ou le retirer de Troco.
              </p>
              <button
                type="button"
                onClick={goToEdit}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#17212B] text-[15px] font-black text-white shadow-[0_6px_18px_rgba(23,33,43,0.18)] transition active:scale-[0.97]"
              >
                <PenLine size={18} strokeWidth={2.4} />
                Modifier mon objet
              </button>
            </>
          ) : isAmbassador(ownerProfile) ? (
            <p className="text-[14px] font-medium leading-relaxed text-[#94a3b8]">
              Cet objet est présenté par l’équipe Troco à titre d’exemple. Il n’est pas disponible à l’échange.
            </p>
          ) : (
            <>
              <p className="text-[15px] font-semibold leading-relaxed text-[#17212B]">
                Tu as quelque chose qui pourrait plaire à {shortName(ownerName)} ?
              </p>
              <button
                type="button"
                onClick={proposeExchange}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#22C58B] text-[15px] font-black text-white shadow-[0_6px_20px_rgba(34,197,139,0.25)] transition active:scale-[0.97]"
              >
                <Repeat2 size={18} strokeWidth={2.4} />
                Proposer un troc
              </button>
            </>
          )}
        </motion.section>

        {!isOwner && !isAmbassador(ownerProfile) && (
          <motion.section
            className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.08)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F0FAF7] text-[#1ABEA3]">
                <Gift size={18} strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">Ses envies</p>
                <h3 className="text-[18px] font-black leading-tight tracking-[-0.04em] text-[#17212B]">
                  Ce qu’il recherche
                </h3>
              </div>
            </div>

            {(() => {
              const prefs = item?.tradePreferences;
              const cats = Array.isArray(prefs?.categories) ? prefs.categories : [];
              const ideas = prefs?.ideas?.trim() || "";
              const hasPrefs = cats.length > 0 || ideas;

              if (!hasPrefs) {
                return (
                  <div className="mt-5 rounded-[20px] bg-[#F0FAF7]/60 p-4 text-[15px] font-medium leading-relaxed text-slate-700">
                    {shortName(ownerName)} n’a pas encore précisé ses envies.
                    <span className="font-bold text-[#1ABEA3]">
                      {" "}Tu peux quand même proposer un troc.
                    </span>
                  </div>
                );
              }

              return (
                <>
                  {cats.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {cats.map((cat) => (
                        <PreferenceChip key={cat}>{cat}</PreferenceChip>
                      ))}
                    </div>
                  )}
                  {ideas && (
                    <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-600">
                      "{ideas}"
                    </p>
                  )}
                  <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-500">
                    Ces indices t’aident à proposer un objet qui pourrait vraiment lui plaire.
                  </p>
                </>
              );
            })()}
          </motion.section>
        )}
      </main>

    </>
  );
}
