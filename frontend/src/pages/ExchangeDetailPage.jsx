import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import MeetingValidationModal from "../components/MeetingValidationModal";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { TrocoCard, TrocoButton, TrocoPill } from "../components/UI";

import {
  formatDate,
  formatLocation,
  getDisplayItemDetails,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";

const STATUS_LABELS = {
  pending: "En attente",
  accepted: "Troc accepté",
  scheduling_time: "Disponibilités",
  time_confirmed: "Horaire validé",
  choosing_place: "Choix du lieu",
  meeting_confirmed: "Rencontre confirmée",
  chat_open: "Messagerie ouverte",
  completed: "Terminé",
  declined: "Refusé",
  cancelled: "Annulé",
};

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function uniqueItems(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item) return false;

    const id = String(item.id || item.itemId || "").trim();
    const title = String(item.title || item.itemType || item.generatedTitle || "").trim().toLowerCase();
    const image = String(item.imageUrl || item.photoUrl || item.images?.[0] || "").trim();

    const key =
      id && !id.startsWith("fallback") && !id.startsWith("embedded")
        ? `id:${id}`
        : `fallback:${title}:${image}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function sameItem(a, b) {
  if (!a || !b) return false;

  const aId = String(a.id || a.itemId || "").trim();
  const bId = String(b.id || b.itemId || "").trim();

  if (aId && bId && aId === bId) return true;

  const aTitle = String(a.title || a.itemType || a.generatedTitle || "").trim().toLowerCase();
  const bTitle = String(b.title || b.itemType || b.generatedTitle || "").trim().toLowerCase();

  const aImage = String(a.imageUrl || a.photoUrl || a.images?.[0] || "").trim();
  const bImage = String(b.imageUrl || b.photoUrl || b.images?.[0] || "").trim();

  return Boolean(aTitle && bTitle && aTitle === bTitle && (!aImage || !bImage || aImage === bImage));
}

function clean(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function shortName(name = "") {
  const cleaned = clean(name);
  if (!cleaned) return "Utilisateur";
  if (cleaned.includes("@")) return cleaned.split("@")[0];
  const parts = cleaned.split(" ");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]} ${parts[1]?.charAt(0) || ""}.`.trim();
}

function cleanTitle(value) {
  const text = String(value || "").trim();
  if (!text) return "Objet";
  if (/^objet proposé à\s+/i.test(text)) return "Objet proposé";
  if (/^objet demandé à\s+/i.test(text)) return "Objet demandé";
  return text;
}

function cleanDetails(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^paris(\s+\d+(er|e))?$/i.test(text)) return "";
  if (/^objet proposé à\s+/i.test(text)) return "";
  if (/^objet demandé à\s+/i.test(text)) return "";
  return text;
}

function getSenderName(exchange) {
  return (
    exchange?.senderName ||
    exchange?.senderDisplayName ||
    exchange?.senderEmail ||
    "Utilisateur Troco"
  );
}

function getReceiverName(exchange) {
  return (
    exchange?.receiverName ||
    exchange?.receiverDisplayName ||
    exchange?.receiverEmail ||
    "Utilisateur Troco"
  );
}

function getOtherName(exchange, uid) {
  if (!exchange || !uid) return "l’autre personne";
  return exchange.senderId === uid ? getReceiverName(exchange) : getSenderName(exchange);
}

function getOtherUserId(exchange, uid) {
  if (!exchange || !uid) return "";
  return exchange.senderId === uid ? exchange.receiverId : exchange.senderId;
}

function getRequestedItemId(exchange) {
  return (
    exchange?.requestedItemId ||
    exchange?.requestedId ||
    exchange?.itemId ||
    exchange?.targetItemId ||
    ""
  );
}

function getBaseOfferedItemIds(exchange) {
  return unique([
    ...(exchange?.offeredItemIds || []),
    ...(exchange?.offeredItemsIds || []),
    ...(exchange?.selectedItemIds || []),
    ...(exchange?.proposedItemIds || []),
    exchange?.offeredItemId,
    exchange?.offeredId,
    exchange?.proposedItemId,
    exchange?.senderItemId,
  ]);
}

function getExtraItemIds(exchange) {
  return unique([
    ...(exchange?.counterRequestedItemIds || []),
    ...(exchange?.extraRequestedItemIds || []),
    exchange?.extraRequestedItemId,
    exchange?.counterItemId,
    exchange?.extraItemId,
  ]);
}

function hasOpenExtraItemRequest(exchange) {
  return Boolean(
    exchange?.extraItemRequestOpen ||
    exchange?.counterStatus === "extra_item_requested" ||
    exchange?.counterStatus === "extra_requested_open" ||
    exchange?.notificationType === "extra_item_requested"
  );
}

function getOfferedItemIds(exchange) {
  const extraIds = new Set(getExtraItemIds(exchange).map(String));

  return unique([
    ...(exchange?.finalOfferedItemIds || []),
    ...getBaseOfferedItemIds(exchange),
  ]).filter((id) => !extraIds.has(String(id)));
}

function fallbackRequestedItem(exchange) {
  const title =
    exchange?.requestedItemTitle ||
    exchange?.requestedTitle ||
    exchange?.itemTitle ||
    exchange?.targetItemTitle ||
    "Objet demandé";

  return {
    id: getRequestedItemId(exchange) || "requested",
    itemType: cleanTitle(title),
    title: cleanTitle(title),
    category:
      exchange?.requestedItemCategory ||
      exchange?.requestedCategory ||
      exchange?.itemCategory ||
      "Objet",
    itemDetails:
      exchange?.requestedItemDetails ||
      exchange?.requestedDetails ||
      "",
    imageUrl:
      exchange?.requestedItemImage ||
      exchange?.requestedImage ||
      exchange?.itemImage ||
      "",
    images:
      exchange?.requestedItemImages ||
      exchange?.requestedImages ||
      [],
  };
}

function fallbackOfferedItems(exchange) {
  const extraIds = new Set(getExtraItemIds(exchange).map(String));

  const embedded = [
    ...(Array.isArray(exchange?.offeredItems) ? exchange.offeredItems : []),
    ...(Array.isArray(exchange?.proposedItems) ? exchange.proposedItems : []),
    ...(Array.isArray(exchange?.selectedItems) ? exchange.selectedItems : []),
  ].filter(Boolean);

  if (embedded.length) {
    return embedded
      .map((item, index) => ({
        id: item.id || item.itemId || `embedded-${index}`,
        ...item,
        title: cleanTitle(item.title || item.itemType || item.generatedTitle || ""),
        itemType: cleanTitle(item.itemType || item.title || item.generatedTitle || ""),
      }))
      .filter((item) => !extraIds.has(String(item.id)));
  }

  const titles = [
    ...(exchange?.offeredItemTitles || []),
    ...(exchange?.offeredItemsTitles || []),
    ...(exchange?.proposedItemTitles || []),
    exchange?.offeredItemTitle,
    exchange?.offeredTitle,
    exchange?.proposedItemTitle,
  ].filter(Boolean);

  const images = [
    ...(exchange?.offeredItemImages || []),
    ...(exchange?.offeredImages || []),
    exchange?.offeredItemImage,
    exchange?.offeredImage,
    exchange?.proposedItemImage,
  ].filter(Boolean);

  if (!titles.length && !images.length) return [];

  const max = Math.max(titles.length, images.length, 1);

  return Array.from({ length: max }).map((_, index) => ({
    id: `fallback-offered-${index}`,
    itemType: cleanTitle(titles[index] || titles[0] || "Objet proposé"),
    title: cleanTitle(titles[index] || titles[0] || "Objet proposé"),
    category:
      exchange?.offeredItemCategory ||
      exchange?.offeredCategory ||
      exchange?.proposedItemCategory ||
      "Objet",
    imageUrl: images[index] || images[0] || "",
  }));
}

function fallbackExtraItems(exchange) {
  const titles = [
    ...(exchange?.extraRequestedItemTitles || []),
    ...(exchange?.counterRequestedItemTitles || []),
    exchange?.extraRequestedItemTitle,
    exchange?.counterRequestedItemTitle,
    exchange?.extraItemTitle,
    exchange?.counterItemTitle,
  ].filter(Boolean);

  const images = [
    ...(exchange?.extraRequestedItemImages || []),
    ...(exchange?.counterRequestedItemImages || []),
    exchange?.extraRequestedItemImage,
    exchange?.counterRequestedItemImage,
    exchange?.extraItemImage,
    exchange?.counterItemImage,
  ].filter(Boolean);

  if (!titles.length && !images.length) return [];

  return [
    {
      id: getExtraItemIds(exchange)[0] || "extra-fallback",
      itemType: cleanTitle(titles[0] || "Objet en plus"),
      title: cleanTitle(titles[0] || "Objet en plus"),
      category: exchange?.extraItemCategory || exchange?.counterItemCategory || "Objet",
      imageUrl: images[0] || "",
    },
  ];
}

async function loadItem(itemId) {
  if (!itemId) return null;

  try {
    const snap = await getDoc(doc(db, "items", String(itemId)));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error("Erreur chargement objet :", itemId, error);
    return null;
  }
}

async function loadItems(ids = []) {
  const cleanIds = unique(ids);
  const items = await Promise.all(cleanIds.map(loadItem));
  return uniqueItems(items.filter(Boolean));
}

async function loadUserItems(userId, excludeIds = [], userEmail = "") {
  if (!userId && !userEmail) return [];

  const excluded = new Set(excludeIds.filter(Boolean).map(String));
  const normalizedEmail = String(userEmail || "").toLowerCase();

  function belongsToCurrentUser(item) {
    return (
      String(item.ownerId || "") === String(userId || "") ||
      String(item.userId || "") === String(userId || "") ||
      String(item.ownerUid || "") === String(userId || "") ||
      String(item.createdBy || "") === String(userId || "") ||
      String(item.uid || "") === String(userId || "") ||
      (normalizedEmail && String(item.ownerEmail || "").toLowerCase() === normalizedEmail) ||
      (normalizedEmail && String(item.userEmail || "").toLowerCase() === normalizedEmail) ||
      (normalizedEmail && String(item.createdByEmail || "").toLowerCase() === normalizedEmail)
    );
  }

  try {
    const snapshot = await getDocs(collection(db, "items"));

    return uniqueItems(
      snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .filter((item) => item.status !== "deleted")
        .filter((item) => belongsToCurrentUser(item))
        .filter((item) => !excluded.has(String(item.id)))
        .slice(0, 12)
    );
  } catch (error) {
    console.error("Erreur chargement objets utilisateur :", error);
    return [];
  }
}

function formatAvailability(option) {
  if (!option) return "";
  if (typeof option === "string") return option;
  return option.label || [option.day, option.time].filter(Boolean).join(" · ");
}

function getExchangeStage(exchange, currentUserId) {
  if (!exchange) return "loading";

  const status = exchange.status || "pending";

  const hasTimeOptions =
    Array.isArray(exchange.availabilityOptions) &&
    exchange.availabilityOptions.length > 0 &&
    !exchange.selectedAvailability;

  const hasPlaceOptions =
    Array.isArray(exchange.placeOptions) &&
    exchange.placeOptions.length > 0 &&
    !exchange.selectedPlace;

  if (status === "completed") return "completed";
  if (status === "declined") return "declined";
  if (status === "cancelled") return "cancelled";

  if (
    status === "meeting_confirmed" ||
    exchange.meetingConfirmed ||
    (exchange.selectedAvailability && exchange.selectedPlace)
  ) {
    return "confirmed";
  }

  if (status === "chat_open" || exchange.chatOpened || exchange.chatOpen) {
    return "chat";
  }

  if (hasPlaceOptions && exchange.placeProposedBy !== currentUserId) {
    return "respond_place";
  }

  if (hasPlaceOptions && exchange.placeProposedBy === currentUserId) {
    return "waiting_place";
  }

  if (exchange.selectedAvailability && !exchange.selectedPlace) {
    return "start_place";
  }

  if (hasTimeOptions && exchange.availabilityProposedBy !== currentUserId) {
    return "respond_time";
  }

  if (hasTimeOptions && exchange.availabilityProposedBy === currentUserId) {
    return "waiting_time";
  }

  if (status === "accepted" || status === "scheduling_time" || status === "time_confirmed" || status === "choosing_place") {
    return "start_time";
  }

  return "pending";
}

function getStageCopy(stage, exchange, currentUserId) {
  const otherName = shortName(getOtherName(exchange, currentUserId));

  switch (stage) {
    case "waiting_time":
      return {
        eyebrow: "Disponibilités envoyées",
        title: "En attente de réponse",
        text: `${otherName} doit choisir un créneau ou proposer une alternative.`,
        cta: "Proposer d’autres horaires",
        tone: "emerald",
      };

    case "respond_time":
      return {
        eyebrow: "Disponibilités reçues",
        title: `${exchange.availabilityProposedByName || otherName} a proposé des créneaux`,
        text: "Choisis un créneau ou propose une alternative.",
        cta: "Répondre aux disponibilités",
        tone: "sky",
      };

    case "start_place":
      return {
        eyebrow: "Horaire validé",
        title: "Choisissez un lieu",
        text: `Horaire validé : ${formatAvailability(exchange.selectedAvailability)}.`,
        cta: "Choisir un lieu",
        tone: "emerald",
      };

    case "waiting_place":
      return {
        eyebrow: "Lieu envoyé",
        title: "En attente de réponse",
        text: `${otherName} doit accepter le lieu ou proposer l’autre option.`,
        cta: "Modifier le lieu",
        tone: "emerald",
      };

    case "respond_place":
      return {
        eyebrow: "Lieu reçu",
        title: `${exchange.placeProposedByName || otherName} propose ${exchange.placeOptions?.[0]?.title || "un lieu"}`,
        text: "Tu peux accepter ou proposer l’autre option.",
        cta: "Répondre au lieu",
        tone: "sky",
      };

    case "confirmed":
      return {
        eyebrow: "Rencontre confirmée",
        title: "Troc accepté 🎉",
        text: "Bravo, votre rencontre est confirmée. Il ne vous reste plus qu’à vous retrouver au bon moment.",
        cta: "Voir la rencontre confirmée",
        tone: "emerald",
      };

    case "chat":
      return {
        eyebrow: "Messagerie ouverte",
        title: "Continuez par message",
        text: "La messagerie est ouverte pour finaliser les derniers détails.",
        cta: "Ouvrir la messagerie",
        tone: "sky",
      };

    case "completed":
      return {
        eyebrow: "Terminé",
        title: "Échange terminé",
        text: "Ce troc est marqué comme terminé.",
        cta: "Retour aux trocs",
        tone: "slate",
      };

    case "declined":
      return {
        eyebrow: "Refusé",
        title: "Échange refusé",
        text: "Ce troc n’est plus actif.",
        cta: "Retour aux trocs",
        tone: "rose",
      };

    case "cancelled":
      return {
        eyebrow: "Annulé",
        title: "Échange annulé",
        text: "Ce troc n’est plus actif.",
        cta: "Retour aux trocs",
        tone: "slate",
      };

    case "start_time":
      return {
        eyebrow: "Troc accepté",
        title: "Votre troc est accepté 🎉",
        text: "Il ne reste plus qu’à organiser la rencontre.",
        cta: "Choisir mes disponibilités",
        tone: "emerald",
      };

    case "pending":
    default:
      return {
        eyebrow: "Proposition",
        title: "En attente",
        text: "La proposition de troc est en attente de réponse.",
        cta: "Retour aux trocs",
        tone: "slate",
      };
  }
}

function MiniItemCard({ item, label, compact = false, onClick }) {
  const title = cleanTitle(getDisplayItemType(item));
  const details = cleanDetails(getDisplayItemDetails(item) || item?.category || "");
  const image = getItemImage(item);

  const Wrapper = onClick ? "button" : "div";

  if (compact) {
    return (
      <Wrapper
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-[22px] border border-slate-100 bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.035)]"
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-slate-100">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">📦</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-black text-[#081225]">{title}</p>
          <p className="mt-1 truncate text-[13px] font-semibold text-slate-500">
            {details || formatLocation(item)}
          </p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="w-full overflow-hidden rounded-[26px] border border-slate-100 bg-white text-left shadow-[0_10px_26px_rgba(15,23,42,0.045)]"
    >
      {label && (
        <p className="px-4 pt-4 text-center text-[12px] font-black text-slate-500">
          {label}
        </p>
      )}

      <div className="mt-3 aspect-[1.12/0.9] w-full overflow-hidden bg-slate-100">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">📦</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-[20px] font-black tracking-[-0.04em] text-[#081225]">
          {title}
        </h3>

        <p className="mt-1 line-clamp-1 text-[14px] font-semibold text-slate-500">
          {details || "Objet disponible"}
        </p>

        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
          <MapPin size={14} strokeWidth={2.2} />
          {formatLocation(item)}
        </p>
      </div>
    </Wrapper>
  );
}


function getConfirmedBy(exchange) {
  return [
    ...(exchange?.tradeConfirmedBy || []),
    ...(exchange?.confirmedBy || []),
  ].filter(Boolean).map(String);
}

function hasUserConfirmedTrade(exchange, userId) {
  if (!userId) return false;
  return getConfirmedBy(exchange).includes(String(userId));
}

function hasOtherConfirmedTrade(exchange, userId) {
  if (!exchange || !userId) return false;

  const otherId = getOtherUserId(exchange, userId);
  if (!otherId) return false;

  return getConfirmedBy(exchange).includes(String(otherId));
}

function bothUsersConfirmedTrade(exchange, userId) {
  if (!exchange || !userId) return false;

  const confirmedBy = new Set(getConfirmedBy(exchange));
  const senderId = String(exchange.senderId || "");
  const receiverId = String(exchange.receiverId || "");

  return Boolean(senderId && receiverId && confirmedBy.has(senderId) && confirmedBy.has(receiverId));
}

function getMeetingLabel(exchange) {
  const availability = exchange?.selectedAvailability;

  if (!availability) return "Rencontre prévue";

  if (typeof availability === "string") return availability;

  return (
    availability.label ||
    [availability.day, availability.time].filter(Boolean).join(" · ") ||
    "Rencontre prévue"
  );
}

function getMeetingTime(exchange) {
  const availability = exchange?.selectedAvailability;

  if (!availability || typeof availability === "string") return null;

  const rawDate =
    availability.dateValue ||
    availability.dateISO ||
    availability.fullDate ||
    availability.date ||
    "";

  const rawTime =
    availability.time ||
    availability.hour ||
    "";

  if (!rawDate || !rawTime) return null;

  const safeTime = String(rawTime).replace("h", ":").replace(/:$/, ":00");
  const date = new Date(`${rawDate}T${safeTime}`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isAfterMeetingTime(exchange) {
  const date = getMeetingTime(exchange);

  if (!date) return true;

  return new Date().getTime() >= date.getTime();
}

function shouldShowMeetingValidation(exchange) {
  if (!exchange) return false;

  return (
    exchange.status === "meeting_confirmed" ||
    exchange.status === "meeting_scheduled" ||
    exchange.status === "awaiting_other_confirmation" ||
    exchange.meetingConfirmed ||
    (exchange.selectedAvailability && exchange.selectedPlace)
  );
}

function StatusHero({ stage, exchange, userId, navigate }) {
  const copy = getStageCopy(stage, exchange, userId);
  const isConfirmed = stage === "confirmed";
  const isWaitingTime = stage === "waiting_time";
  const isRespondTime = stage === "respond_time";
  const isWaitingPlace = stage === "waiting_place";
  const isRespondPlace = stage === "respond_place";

  function go() {
    if (stage === "chat") {
      navigate(`/exchanges/${exchange.id}/chat`);
      return;
    }

    if (["start_place", "waiting_place", "respond_place"].includes(stage)) {
      navigate("/choose-place", {
        state: {
          exchangeId: exchange.id,
          exchange,
        },
      });
      return;
    }

    if (["start_time", "waiting_time", "respond_time"].includes(stage)) {
      navigate(`/availability/${exchange.id}`);
      return;
    }

    if (stage === "confirmed") {
      navigate(`/exchanges/${exchange.id}/meeting`);
      return;
    }

    navigate("/exchanges");
  }

  return (
    <section className="rounded-[30px] border border-emerald-100 bg-emerald-50/60 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            {copy.eyebrow}
          </p>

          <h2 className="mt-2 text-[28px] font-black leading-[1.02] tracking-[-0.055em] text-[#081225] sm:text-[34px]">
            {copy.title}
          </h2>

          <p className="mt-2 max-w-[560px] text-[15px] font-medium leading-relaxed text-slate-600">
            {copy.text}
          </p>
        </div>

        <span className="hidden shrink-0 rounded-full bg-white/90 px-4 py-2 text-[12px] font-black text-emerald-700 sm:inline-flex">
          {STATUS_LABELS[exchange.status] || "Statut"}
        </span>
      </div>

      {isConfirmed && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] bg-white/84 p-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-emerald-700" size={22} />
              <div>
                <p className="text-[13px] font-black text-emerald-700">Date et heure</p>
                <p className="mt-1 text-sm font-semibold text-[#081225]">
                  {exchange.selectedAvailability?.day || "Jour confirmé"} · {exchange.selectedAvailability?.time || "Horaire confirmé"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/84 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-emerald-700" size={22} />
              <div>
                <p className="text-[13px] font-black text-emerald-700">Lieu</p>
                <p className="mt-1 text-sm font-semibold text-[#081225]">
                  {exchange.selectedPlace?.title || "Lieu confirmé"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white/84 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-700" size={22} />
              <div>
                <p className="text-[13px] font-black text-emerald-700">Sécurité</p>
                <p className="mt-1 text-sm font-semibold text-[#081225]">
                  Lieu partenaire Troco
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isWaitingTime || isRespondTime) && exchange.availabilityOptions?.length > 0 && (
        <div className="mt-4 space-y-2">
          {exchange.availabilityOptions.map((option, index) => (
            <div
              key={option?.id || index}
              className="rounded-[20px] bg-white/86 px-4 py-3 text-[15px] font-black text-slate-700"
            >
              <Clock3 className="mr-2 inline text-slate-400" size={16} />
              {formatAvailability(option)}
            </div>
          ))}
        </div>
      )}

      {(isWaitingPlace || isRespondPlace) && exchange.placeOptions?.length > 0 && (
        <div className="mt-4 space-y-2">
          {exchange.placeOptions.map((place, index) => (
            <div
              key={place?.id || index}
              className="rounded-[20px] bg-white/86 px-4 py-3 text-[15px] font-black text-slate-700"
            >
              <MapPin className="mr-2 inline text-slate-400" size={16} />
              {place?.title || "Lieu proposé"}
            </div>
          ))}
        </div>
      )}

      <TrocoButton variant="plain"
        onClick={go}
        className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[19px] bg-gradient-to-r from-[#22c55e] to-[#14b8a6] text-[16px] font-black text-white shadow-[0_12px_28px_rgba(16,185,129,0.17)] transition active:scale-[0.985]"
      >
        {copy.cta}
        <ChevronRight size={19} strokeWidth={2.4} />
      </TrocoButton>
    </section>
  );
}

function ExchangeObjects({ requestedItem, offeredItems, extraItems, navigate, userIsSender }) {
  const primaryOfferedItem = offeredItems[0];
  const leftItem = userIsSender ? primaryOfferedItem : requestedItem;
  const rightItem = userIsSender ? requestedItem : primaryOfferedItem;

  const otherOfferedItems = offeredItems
    .slice(1)
    .filter((item) => !sameItem(item, primaryOfferedItem))
    .filter((item) => !extraItems.some((extraItem) => sameItem(item, extraItem)));

  return (
    <TrocoCard as="section" variant="plain" className="rounded-[30px] border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
      <h2 className="text-[22px] font-black tracking-[-0.04em] text-[#081225]">
        Votre échange
      </h2>

      <div className="mt-5 grid items-start gap-5 sm:grid-cols-[1fr_auto_1fr]">
        <MiniItemCard
          item={leftItem}
          label={userIsSender ? "Vous proposez" : "Votre objet"}
          onClick={() => {
            const item = leftItem;
            if (item?.id && !String(item.id).includes("fallback") && item.id !== "requested") {
              navigate(`/items/${item.id}`);
            }
          }}
        />

        <div className="flex justify-center pt-0 sm:pt-28">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            ↔
          </span>
        </div>

        <MiniItemCard
          item={rightItem}
          label={userIsSender ? "Vous recevez" : "Il vous propose"}
          onClick={() => {
            const item = rightItem;
            if (item?.id && !String(item.id).includes("fallback") && item.id !== "requested") {
              navigate(`/items/${item.id}`);
            }
          }}
        />
      </div>

      {otherOfferedItems.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-sky-600">
            Autres objets proposés
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {otherOfferedItems.map((item) => (
              <MiniItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </div>
      )}

      {extraItems.length > 0 && (
        <div className="mt-5 rounded-[24px] border border-orange-100 bg-orange-50/30 p-4">
          <p className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-orange-600">
            Objet en plus demandé
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {extraItems.map((item) => (
              <MiniItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </div>
      )}
    </TrocoCard>
  );
}

function PersonCard({ exchange, userId, navigate }) {
  const otherName = getOtherName(exchange, userId);
  const otherPhone =
    exchange?.senderId === userId
      ? exchange.receiverPhone || exchange.receiverUserPhone || ""
      : exchange.senderPhone || exchange.senderUserPhone || "";

  return (
    <TrocoCard as="section" variant="plain" className="rounded-[30px] border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2ECC8A] to-cyan-400 text-xl font-black text-white">
            {shortName(otherName).charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[20px] font-black text-[#081225]">
              Avec {shortName(otherName)}
            </p>

            <p className="mt-1 text-[14px] font-semibold text-slate-500">
              Membre Troco · Répond vite
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <TrocoButton variant="plain"
            onClick={() => navigate(`/exchanges/${exchange.id}/chat`)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-sm"
          >
            <MessageCircle size={20} />
          </TrocoButton>

          {otherPhone && (
            <a
              href={`tel:${otherPhone.replace(/\D/g, "")}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-emerald-700 shadow-sm"
            >
              <Phone size={20} />
            </a>
          )}
        </div>
      </div>
    </TrocoCard>
  );
}


function MeetingValidationSection({
  exchange,
  userId,
  saving,
  onConfirmClick,
  onProblemClick,
}) {
  if (!shouldShowMeetingValidation(exchange)) return null;

  const userConfirmed = hasUserConfirmedTrade(exchange, userId);
  const otherConfirmed = hasOtherConfirmedTrade(exchange, userId);
  const bothConfirmed = bothUsersConfirmedTrade(exchange, userId);
  const afterMeeting = isAfterMeetingTime(exchange);
  const otherName = shortName(getOtherName(exchange, userId));

  if (bothConfirmed || exchange?.status === "completed") {
    return (
      <section className="rounded-[30px] border border-emerald-100 bg-emerald-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700">
            <CheckCircle2 size={30} strokeWidth={2.4} />
          </span>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Troc confirmé
            </p>

            <h2 className="mt-1 text-[27px] font-black tracking-[-0.05em] text-slate-950">
              Troc terminé 🎉
            </h2>

            <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-600">
              Merci ! Vous participez à une communauté plus locale, humaine et durable.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (userConfirmed && !otherConfirmed) {
    return (
      <section className="rounded-[30px] border border-sky-100 bg-sky-50/60 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
          Confirmation envoyée
        </p>

        <h2 className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950">
          En attente de confirmation de l’autre personne
        </h2>

        <div className="mt-4 flex items-center gap-3 rounded-[22px] bg-white/80 p-4">
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-500" />
          <p className="text-sm font-semibold text-slate-600">
            {otherName} doit confirmer de son côté.
          </p>
        </div>
      </section>
    );
  }

  if (!userConfirmed && otherConfirmed) {
    return (
      <section className="rounded-[30px] border border-emerald-100 bg-emerald-50/60 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
          Confirmation reçue
        </p>

        <h2 className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950">
          {otherName} a confirmé que le troc a eu lieu.
        </h2>

        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
          Pouvez-vous confirmer de votre côté ?
        </p>

        <TrocoButton variant="plain"
          onClick={onConfirmClick}
          disabled={saving}
          className="mt-5 h-[54px] w-full rounded-[20px] bg-emerald-600 text-[16px] font-black text-white shadow-[0_12px_26px_rgba(16,185,129,0.18)] disabled:opacity-50"
        >
          Confirmer à mon tour
        </TrocoButton>
      </section>
    );
  }

  return (
    <section
      className={[
        "rounded-[30px] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]",
        afterMeeting
          ? "border-emerald-100 bg-emerald-50/60"
          : "border-white/80 bg-white/88",
      ].join(" ")}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
        Rencontre prévue
      </p>

      <h2 className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950">
        {getMeetingLabel(exchange)}
      </h2>

      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
        Confirmez seulement après avoir rencontré l’autre personne.
      </p>

      <TrocoButton variant="plain"
        onClick={onConfirmClick}
        disabled={saving}
        className={[
          "mt-5 h-[54px] w-full rounded-[20px] text-[16px] font-black transition disabled:opacity-50",
          afterMeeting
            ? "bg-emerald-600 text-white shadow-[0_12px_26px_rgba(16,185,129,0.18)]"
            : "border border-emerald-100 bg-white text-emerald-700",
        ].join(" ")}
      >
        Confirmer le troc
      </TrocoButton>

      <TrocoButton variant="plain"
        onClick={onProblemClick}
        disabled={saving}
        className="mt-3 w-full text-center text-[14px] font-black text-slate-500 disabled:opacity-50"
      >
        Il y a eu un problème
      </TrocoButton>
    </section>
  );
}

function ProgressTimeline({ stage }) {
  const steps = [
    { key: "pending", label: "Demande envoyée" },
    { key: "accepted", label: "Troc accepté" },
    { key: "time", label: "Disponibilités validées" },
    { key: "place", label: "Lieu confirmé" },
    { key: "confirmed", label: "Rencontre confirmée" },
  ];

  const indexByStage = {
    pending: 0,
    start_time: 1,
    waiting_time: 1,
    respond_time: 1,
    start_place: 2,
    waiting_place: 3,
    respond_place: 3,
    confirmed: 4,
    chat: 3,
    completed: 4,
  };

  const activeIndex = indexByStage[stage] ?? 0;

  return (
    <TrocoCard as="section" variant="plain" className="rounded-[30px] border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
      <h2 className="text-[21px] font-black tracking-[-0.04em] text-[#081225]">
        Avancement du troc
      </h2>

      <div className="mt-5 grid grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const done = index <= activeIndex;

          return (
            <div key={step.key} className="flex flex-col items-center text-center">
              <span
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black",
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 bg-slate-50 text-slate-300",
                ].join(" ")}
              >
                {done ? <CheckCircle2 size={20} /> : index + 1}
              </span>

              <p className="mt-2 text-[11px] font-semibold leading-tight text-slate-500">
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </TrocoCard>
  );
}

function ExtraItemPicker({
  items,
  selectedId,
  onSelect,
  onCancel,
  onSubmit,
  onSubmitWithoutItem,
  saving,
  mode = "request",
}) {
  const isAddMode = mode === "add";
  const hasItems = items.length > 0;

  return (
    <section className="rounded-[30px] border border-orange-100 bg-orange-50/40 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
        {isAddMode ? "Objet en plus demandé" : "Négociation"}
      </p>

      <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-slate-950">
        {isAddMode
          ? "Avez-vous quelque chose à rajouter ?"
          : hasItems
            ? "Demander un objet en plus"
            : "Demander un autre objet"}
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {isAddMode
          ? "L’autre personne vous demande un objet en plus pour équilibrer le troc."
          : hasItems
            ? "Choisis un objet de sa bibliothèque. L’autre personne pourra accepter ou refuser."
            : "L’autre personne n’a pas d’autre objet visible. Tu peux lui envoyer une demande ouverte."}
      </p>

      {!hasItems ? (
        <div className="mt-4 rounded-[24px] bg-white/80 p-4 text-sm font-medium text-slate-500">
          {isAddMode
            ? "Tu n’as pas d’autre objet disponible pour le moment."
            : "Aucun autre objet disponible dans sa bibliothèque pour le moment."}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                "rounded-[24px] border p-2 text-left",
                selectedId === item.id
                  ? "border-emerald-400 bg-white ring-2 ring-emerald-400/20"
                  : "border-white/80 bg-white/78",
              ].join(" ")}
            >
              <MiniItemCard item={item} compact />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <TrocoButton variant="plain"
          onClick={onCancel}
          disabled={saving}
          className="h-12 rounded-[18px] border border-slate-100 bg-white text-sm font-black text-slate-600"
        >
          Annuler
        </TrocoButton>

        {!hasItems && !isAddMode ? (
          <TrocoButton variant="plain"
            onClick={onSubmitWithoutItem}
            disabled={saving}
            className="h-12 rounded-[18px] bg-emerald-600 text-sm font-black text-white disabled:opacity-40"
          >
            Demander
          </TrocoButton>
        ) : (
          <TrocoButton variant="plain"
            onClick={onSubmit}
            disabled={saving || !selectedId}
            className="h-12 rounded-[18px] bg-emerald-600 text-sm font-black text-white disabled:opacity-40"
          >
            {isAddMode ? "Ajouter cet objet" : "Demander"}
          </TrocoButton>
        )}
      </div>
    </section>
  );
}

export default function ExchangeDetailPage() {
  const params = useParams();
  const id = params.id || params.exchangeId;

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchange, setExchange] = useState(null);
  const [requestedItem, setRequestedItem] = useState(null);
  const [offeredItems, setOfferedItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [senderOtherItems, setSenderOtherItems] = useState([]);
  const [myOtherItems, setMyOtherItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showExtraPicker, setShowExtraPicker] = useState(false);
  const [showAddExtraPicker, setShowAddExtraPicker] = useState(false);
  const [selectedExtraId, setSelectedExtraId] = useState("");
  const [showValidationModal, setShowValidationModal] = useState(false);

  async function loadExchange() {
    if (!id) return;

    setLoading(true);

    try {
      const snap = await getDoc(doc(db, "exchanges", id));

      if (!snap.exists()) {
        setExchange(null);
        return;
      }

      const exchangeData = {
        id: snap.id,
        ...snap.data(),
      };

      setExchange(exchangeData);

      const loadedRequested = await loadItem(getRequestedItemId(exchangeData));
      const loadedOffered = await loadItems(getOfferedItemIds(exchangeData));
      const loadedExtra = await loadItems(getExtraItemIds(exchangeData));

      const finalRequested = loadedRequested || fallbackRequestedItem(exchangeData);
      const finalOffered = uniqueItems([...loadedOffered, ...fallbackOfferedItems(exchangeData)]).filter(
        (item) => !new Set(getExtraItemIds(exchangeData).map(String)).has(String(item.id))
      );
      const finalExtra = uniqueItems([...loadedExtra, ...fallbackExtraItems(exchangeData)]);

      setRequestedItem(finalRequested);
      setOfferedItems(finalOffered);
      setExtraItems(finalExtra);

      const senderId = exchangeData.senderId;
      const excludeIds = [
        getRequestedItemId(exchangeData),
        ...getOfferedItemIds(exchangeData),
        ...getExtraItemIds(exchangeData),
      ];

      const otherItems = await loadUserItems(senderId, excludeIds);
      setSenderOtherItems(otherItems);

      const myItems = await loadUserItems(user?.uid, excludeIds, user?.email);
      setMyOtherItems(myItems);
    } catch (error) {
      console.error("Erreur chargement échange :", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    loadExchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading, user?.uid]);

  const stage = useMemo(() => getExchangeStage(exchange, user?.uid), [exchange, user?.uid]);
  const isReceiver = exchange?.receiverId === user?.uid;
  const isSender = exchange?.senderId === user?.uid;
  const isOpenExtraRequest = hasOpenExtraItemRequest(exchange);

  const otherUserId = getOtherUserId(exchange, user?.uid);

  async function cancelOwnProposal() {
    if (!exchange?.id || !isSender) return;

    const ok = window.confirm("Annuler cette demande de troc ?");
    if (!ok) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        cancelledBy: user.uid,
        lastActionBy: user.uid,
        needsAttentionFor: "",
        notificationType: "proposal_cancelled",
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } catch (error) {
      console.error("Erreur annulation demande :", error);
      alert("Impossible d’annuler cette demande.");
    } finally {
      setSaving(false);
    }
  }

  async function acceptProposal() {
    if (!exchange?.id || !isReceiver) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        lastActionBy: user.uid,
        needsAttentionFor: exchange.senderId,
        notificationType: "proposal_accepted",
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } catch (error) {
      console.error("Erreur acceptation :", error);
      alert("Impossible d’accepter ce troc.");
    } finally {
      setSaving(false);
    }
  }

  async function declineProposal() {
    if (!exchange?.id || !isReceiver) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "declined",
        declinedAt: serverTimestamp(),
        lastActionBy: user.uid,
        needsAttentionFor: exchange.senderId,
        notificationType: "proposal_declined",
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } catch (error) {
      console.error("Erreur refus :", error);
      alert("Impossible de refuser ce troc.");
    } finally {
      setSaving(false);
    }
  }

  async function requestExtraItem() {
    if (!selectedExtraId || !exchange?.id || !isReceiver) return;

    const selectedItem = senderOtherItems.find((item) => item.id === selectedExtraId);

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        counterRequestedItemIds: [selectedExtraId],
        extraRequestedItemIds: [selectedExtraId],
        extraRequestedItemTitle: selectedItem ? getDisplayItemType(selectedItem) : "",
        extraRequestedItemImage: selectedItem ? getItemImage(selectedItem) : "",
        counterStatus: "extra_requested",
        lastActionBy: user.uid,
        needsAttentionFor: exchange.senderId,
        notificationType: "extra_item_requested",
        updatedAt: serverTimestamp(),
      });

      setShowExtraPicker(false);
      setSelectedExtraId("");
      await loadExchange();
    } catch (error) {
      console.error("Erreur objet en plus :", error);
      alert("Impossible de demander cet objet en plus.");
    } finally {
      setSaving(false);
    }
  }

  async function requestExtraItemWithoutSelection() {
    if (!exchange?.id || !isReceiver) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        extraItemRequestOpen: true,
        counterStatus: "extra_requested_open",
        lastActionBy: user.uid,
        needsAttentionFor: exchange.senderId,
        notificationType: "extra_item_requested",
        updatedAt: serverTimestamp(),
      });

      setShowExtraPicker(false);
      setSelectedExtraId("");
      await loadExchange();
    } catch (error) {
      console.error("Erreur demande ouverte :", error);
      alert("Impossible d’envoyer la demande.");
    } finally {
      setSaving(false);
    }
  }

  async function addExtraItemResponse() {
    if (!selectedExtraId || !exchange?.id) return;

    const selectedItem = myOtherItems.find((item) => item.id === selectedExtraId);

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        counterRequestedItemIds: [selectedExtraId],
        extraRequestedItemIds: [selectedExtraId],
        extraRequestedItemTitle: selectedItem ? getDisplayItemType(selectedItem) : "",
        extraRequestedItemImage: selectedItem ? getItemImage(selectedItem) : "",
        extraItemRequestOpen: false,
        counterStatus: "extra_item_added",
        lastActionBy: user.uid,
        needsAttentionFor: exchange.receiverId,
        notificationType: "extra_item_added",
        updatedAt: serverTimestamp(),
      });

      setShowAddExtraPicker(false);
      setSelectedExtraId("");
      await loadExchange();
    } catch (error) {
      console.error("Erreur ajout objet en plus :", error);
      alert("Impossible d’ajouter cet objet.");
    } finally {
      setSaving(false);
    }
  }

  async function markTradeAsCompleted() {
    if (!exchange?.id || !user?.uid) return;

    setSaving(true);

    try {
      const previousConfirmedBy = new Set(getConfirmedBy(exchange));
      previousConfirmedBy.add(String(user.uid));

      const senderId = String(exchange.senderId || "");
      const receiverId = String(exchange.receiverId || "");
      const bothConfirmed =
        senderId &&
        receiverId &&
        previousConfirmedBy.has(senderId) &&
        previousConfirmedBy.has(receiverId);

      const updatePayload = {
        tradeConfirmedBy: arrayUnion(user.uid),
        confirmedBy: arrayUnion(user.uid),
        lastConfirmationBy: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (bothConfirmed) {
        updatePayload.status = "completed";
        updatePayload.confirmationStatus = "confirmed";
        updatePayload.completedAt = serverTimestamp();
        updatePayload.needsAttentionFor = "";
        updatePayload.notificationType = "trade_completed";
      } else {
        updatePayload.status = "awaiting_other_confirmation";
        updatePayload.confirmationStatus = "waiting_other";
        updatePayload.confirmedAt = serverTimestamp();
        updatePayload.needsAttentionFor = getOtherUserId(exchange, user.uid);
        updatePayload.notificationType = "trade_confirmation_pending";
      }

      await updateDoc(doc(db, "exchanges", exchange.id), updatePayload);

      if (bothConfirmed) {
        const itemIds = unique([
          getRequestedItemId(exchange),
          ...getOfferedItemIds(exchange),
          ...getExtraItemIds(exchange),
        ]);

        await Promise.all(
          itemIds.map(async (itemId) => {
            try {
              await updateDoc(doc(db, "items", itemId), {
                status: "exchanged",
                availabilityStatus: "unavailable",
                exchangedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              console.error("Impossible de marquer l’objet échangé :", itemId, error);
            }
          })
        );
      }

      setShowValidationModal(false);
      await loadExchange();
    } catch (error) {
      console.error("Erreur confirmation troc :", error);
      alert("Impossible de confirmer le troc pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  function reportMeetingProblem() {
    if (!exchange?.id) return;

    setShowValidationModal(false);
    navigate(`/exchanges/${exchange.id}/problem`);
  }

  function goToAvailability() {
    if (!exchange?.id) return;
    navigate(`/availability/${exchange.id}`);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="flex items-center justify-center pt-32 text-white/30 text-sm font-bold">
          Chargement…
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "#0d0d0d" }}>
        <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <button type="button" onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full mb-6"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div className="rounded-[18px] p-6 text-center" style={{ background: "#141414" }}>
            <p className="text-white font-black">Impossible de charger cet échange.</p>
            <button type="button" onClick={() => navigate("/exchanges")}
              className="mt-4 px-5 py-2.5 rounded-full text-sm font-black text-white"
              style={{ background: "#1a4d2e" }}>
              Retour aux trocs
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "#0d0d0d" }}>
      <main className="mx-auto max-w-[430px] px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <header className="mb-5 flex items-center gap-3">
          <button type="button"
            onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full shrink-0"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5dcaa5" }}>
              {isReceiver ? "Demande reçue" : isSender ? "Demande envoyée" : "Échange"}
            </p>
            <h1 className="text-white font-black leading-tight" style={{ fontSize: 19, letterSpacing: "-0.03em" }}>
              Détail du troc
            </h1>
          </div>
        </header>

        <div className="space-y-4">
          <StatusHero
            stage={stage}
            exchange={exchange}
            userId={user.uid}
            navigate={navigate}
          />

          <MeetingValidationSection
            exchange={exchange}
            userId={user.uid}
            saving={saving}
            onConfirmClick={() => setShowValidationModal(true)}
            onProblemClick={reportMeetingProblem}
          />

          <ExchangeObjects
            requestedItem={requestedItem}
            offeredItems={offeredItems}
            extraItems={extraItems}
            navigate={navigate}
            userIsSender={isSender}
          />

          {stage === "pending" && isReceiver && (
            <section className="grid grid-cols-2 gap-3">
              <TrocoButton variant="plain"
                onClick={declineProposal}
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-[16px] text-sm font-black disabled:opacity-50" style={{ background: "rgba(224,90,90,0.12)", color: "#e05a5a", border: "1px solid rgba(224,90,90,0.2)" }}
              >
                <XCircle size={18} />
                Refuser
              </TrocoButton>

              <TrocoButton variant="plain"
                onClick={acceptProposal}
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-[16px] text-sm font-black text-white disabled:opacity-50" style={{ background: "#1a4d2e" }}
              >
                <CheckCircle2 size={18} />
                Accepter
              </TrocoButton>
            </section>
          )}

          {stage === "pending" && isSender && (
            <section className="rounded-[18px] p-5" style={{ background: "rgba(55,138,221,0.08)", border: "1px solid rgba(55,138,221,0.15)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#85b7eb" }}>
                Demande envoyée
              </p>

              <h2 className="mt-2 font-black" style={{ fontSize: 20, letterSpacing: "-0.03em", color: "#fff" }}>
                En attente de réponse
              </h2>

              <p className="mt-2 text-sm font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                Vous avez envoyé cette proposition. Seule l’autre personne peut l’accepter, la refuser ou demander un objet en plus.
              </p>

              <TrocoButton variant="plain"
                onClick={cancelOwnProposal}
                disabled={saving}
                className="mt-4 h-12 w-full rounded-full text-sm font-black disabled:opacity-50" style={{ background: "rgba(224,90,90,0.1)", color: "#e05a5a", border: "1px solid rgba(224,90,90,0.2)" }}
              >
                Annuler ma demande
              </TrocoButton>
            </section>
          )}

          {stage === "pending" && isReceiver && !isSender && !showExtraPicker && !isOpenExtraRequest && (
            <TrocoButton variant="plain"
              onClick={() => setShowExtraPicker(true)}
              className="w-full rounded-[16px] px-5 py-4 text-sm font-black" style={{ background: "rgba(239,159,39,0.1)", color: "#fac775", border: "1px solid rgba(239,159,39,0.2)" }}
            >
              {senderOtherItems.length > 0 ? "Demander un objet en plus" : "Demander un autre objet"}
            </TrocoButton>
          )}

          {isSender && isOpenExtraRequest && !showAddExtraPicker && (
            <section className="rounded-[18px] p-5" style={{ background: "rgba(239,159,39,0.08)", border: "1px solid rgba(239,159,39,0.15)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#fac775" }}>
                Objet en plus demandé
              </p>

              <h2 className="mt-2 font-black" style={{ fontSize: 19, letterSpacing: "-0.03em", color: "#fff" }}>
                L’autre personne vous demande un objet en plus.
              </h2>

              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                Avez-vous quelque chose à rajouter ?
              </p>

              <TrocoButton variant="plain"
                onClick={() => setShowAddExtraPicker(true)}
                className="mt-4 h-12 w-full rounded-full text-sm font-black text-white" style={{ background: "#1a4d2e" }}
              >
                Ajouter un objet
              </TrocoButton>
            </section>
          )}

          {showExtraPicker && (
            <ExtraItemPicker
              items={senderOtherItems}
              selectedId={selectedExtraId}
              onSelect={setSelectedExtraId}
              onCancel={() => {
                setShowExtraPicker(false);
                setSelectedExtraId("");
              }}
              onSubmit={requestExtraItem}
              onSubmitWithoutItem={requestExtraItemWithoutSelection}
              saving={saving}
            />
          )}

          {showAddExtraPicker && (
            <ExtraItemPicker
              mode="add"
              items={myOtherItems}
              selectedId={selectedExtraId}
              onSelect={setSelectedExtraId}
              onCancel={() => {
                setShowAddExtraPicker(false);
                setSelectedExtraId("");
              }}
              onSubmit={addExtraItemResponse}
              saving={saving}
            />
          )}

          {stage !== "pending" && (
            <PersonCard exchange={exchange} userId={user.uid} navigate={navigate} />
          )}

          <ProgressTimeline stage={stage} />

          {stage === "start_time" && (
            <TrocoButton variant="plain"
              onClick={goToAvailability}
              className="flex h-14 w-full items-center justify-center rounded-full text-[15px] font-black text-white" style={{ background: "#1a4d2e" }}
            >
              Valider mes disponibilités
            </TrocoButton>
          )}
        </div>
      </main>

      <MeetingValidationModal
        open={showValidationModal}
        saving={saving}
        onClose={() => setShowValidationModal(false)}
        onConfirm={markTradeAsCompleted}
        onProblem={reportMeetingProblem}
      />

      <BottomNav />
    </div>
  );
}
