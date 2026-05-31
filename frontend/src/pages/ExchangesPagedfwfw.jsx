import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Hourglass,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import TrocoPageHeader from "../components/TrocoPageHeader";
import { TrocoCard, TrocoButton, TrocoPill } from "../components/UI";

import {
  formatDate,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";
import { getExchangeStage, exchangeNeedsAttention, getExchangePriority } from "../exchangeUtils";

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
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

function getOtherName(exchange, uid) {
  if (!exchange || !uid) return "Utilisateur Troco";

  if (exchange.senderId === uid) {
    return (
      exchange.receiverName ||
      exchange.receiverDisplayName ||
      exchange.receiverEmail ||
      "Utilisateur Troco"
    );
  }

  return (
    exchange.senderName ||
    exchange.senderDisplayName ||
    exchange.senderEmail ||
    "Utilisateur Troco"
  );
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

function getOfferedItemIds(exchange) {
  return unique([
    ...(exchange?.finalOfferedItemIds || []),
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

function getMainItemIds(exchange) {
  return unique([
    getRequestedItemId(exchange),
    ...getOfferedItemIds(exchange),
  ]);
}

async function loadItemsForExchange(exchange) {
  const ids = getMainItemIds(exchange).slice(0, 3);

  const items = await Promise.all(
    ids.map(async (id) => {
      try {
        const snap = await getDoc(doc(db, "items", id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      } catch {
        return null;
      }
    })
  );

  return items.filter(Boolean);
}

function formatAvailability(option) {
  if (!option) return "";
  if (typeof option === "string") return option;
  return option.label || [option.day, option.time].filter(Boolean).join(" · ");
}


function getStageVisual(stage) {
  switch (stage) {
    case "respond_time":
      return {
        label: "À répondre",
        title: "Disponibilités reçues",
        tone: "bg-sky-50 text-sky-700 border-sky-100",
      };

    case "waiting_time":
      return {
        label: "En attente",
        title: "Disponibilités envoyées",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
      };

    case "start_place":
      return {
        label: "Lieu",
        title: "Choisir un lieu",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };

    case "respond_place":
      return {
        label: "À répondre",
        title: "Lieu reçu",
        tone: "bg-sky-50 text-sky-700 border-sky-100",
      };

    case "waiting_place":
      return {
        label: "En attente",
        title: "Lieu envoyé",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
      };

    case "confirmed":
      return {
        label: "Confirmé",
        title: "Rencontre confirmée",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };

    case "chat":
      return {
        label: "Message",
        title: "Discussion ouverte",
        tone: "bg-sky-50 text-sky-700 border-sky-100",
      };

    case "completed":
      return {
        label: "Terminé",
        title: "Échange terminé",
        tone: "bg-slate-100 text-slate-600 border-slate-100",
      };

    case "declined":
      return {
        label: "Refusé",
        title: "Échange refusé",
        tone: "bg-rose-50 text-rose-700 border-rose-100",
      };

    case "cancelled":
      return {
        label: "Annulé",
        title: "Échange annulé",
        tone: "bg-slate-100 text-slate-600 border-slate-100",
      };

    case "start_time":
      return {
        label: "Accepté",
        title: "Organiser la rencontre",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };

    case "pending":
    default:
      return {
        label: "En attente",
        title: "Proposition en attente",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
      };
  }
}

function getSubtitle(exchange, stage, currentUserId) {
  const otherName = shortName(getOtherName(exchange, currentUserId));

  if (stage === "respond_time") {
    const count = exchange.availabilityOptions?.length || 0;
    return `${otherName} a proposé ${count} créneau${count > 1 ? "x" : ""}.`;
  }

  if (stage === "waiting_time") {
    return `${otherName} doit choisir un créneau.`;
  }

  if (stage === "respond_place") {
    return `${otherName} propose ${exchange.placeOptions?.[0]?.title || "un lieu"}.`;
  }

  if (stage === "waiting_place") {
    return `${otherName} doit valider le lieu.`;
  }

  if (stage === "start_place") {
    return `Horaire validé : ${formatAvailability(exchange.selectedAvailability)}.`;
  }

  if (stage === "confirmed") {
    return `${exchange.selectedAvailability?.label || formatAvailability(exchange.selectedAvailability) || "Horaire validé"} · ${exchange.selectedPlace?.title || "Lieu validé"}`;
  }

  if (stage === "chat") {
    return "Discussion ouverte pour finaliser.";
  }

  if (stage === "start_time") {
    return "Le troc est accepté. Organise la rencontre.";
  }

  return "Appuie pour voir le détail.";
}

function getCompactDate(exchange) {
  return formatDate(exchange) || "";
}

function ExchangeCard({ exchange, items, currentUserId, selected = false, onSelect }) {
  const navigate = useNavigate();

  const stage = getExchangeStage(exchange, currentUserId);
  const visual = getStageVisual(stage);
  const otherName = shortName(getOtherName(exchange, currentUserId));

  const requestedItem = items[getRequestedItemId(exchange)];
  const offeredItems = getOfferedItemIds(exchange)
    .map((id) => items[id])
    .filter(Boolean);

  const image =
    getItemImage(requestedItem) ||
    getItemImage(offeredItems[0]) ||
    exchange.requestedItemImage ||
    exchange.offeredItemImage ||
    "";

  const requestedTitle =
    getDisplayItemType(requestedItem) ||
    exchange.requestedItemTitle ||
    exchange.itemTitle ||
    "Objet";

  const offeredTitle =
    offeredItems.map(getDisplayItemType).filter(Boolean).join(" + ") ||
    exchange.offeredItemTitle ||
    exchange.proposedItemTitle ||
    "Objet";

  const needsAttention =
    exchange.needsAttentionFor === currentUserId ||
    stage === "respond_time" ||
    stage === "respond_place";

  const handleClick = () => {
    if (onSelect) onSelect(exchange.id);
    else navigate(`/exchanges/${exchange.id}`);
  };

  return (
    <TrocoButton variant="plain"
      onClick={handleClick}
      className={[
        "group flex w-full items-center gap-3.5 rounded-[24px] border bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.045)] backdrop-blur-xl transition active:scale-[0.992]",
        selected ? "border-[#AEE7D8] ring-2 ring-[#DDF6EE]" : "border-[#E4ECE8]",
      ].join(" ")}
    >
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[20px] bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={requestedTitle}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
            ↔️
          </div>
        )}

        {needsAttention && (
          <span className="absolute right-2 top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#0f9f9a]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[12.5px] font-extrabold text-[#0f9f9a]">
            Avec {otherName}
          </p>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold ${visual.tone}`}
          >
            {visual.label}
          </span>
        </div>

        <h3 className="mt-1.5 line-clamp-1 text-[17px] font-bold leading-tight tracking-[-0.035em] text-[#102033]">
          {requestedTitle} ↔ {offeredTitle}
        </h3>

        <p className="mt-1 line-clamp-1 text-[13px] font-medium text-slate-500">
          {getSubtitle(exchange, stage, currentUserId)}
        </p>

        <div className="mt-2.5 flex items-center gap-2 text-[12.5px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13.5} className="text-slate-400" strokeWidth={2.2} />
            Paris
          </span>

          <span className="text-slate-300">•</span>

          <span className="inline-flex items-center gap-1">
            <Clock3 size={13.5} className="text-slate-400" strokeWidth={2.2} />
            {getCompactDate(exchange)}
          </span>
        </div>
      </div>

      <ChevronRight
        size={20}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
        strokeWidth={2.2}
      />
    </TrocoButton>
  );
}



function ExchangeCardVertical({ exchange, items, currentUserId }) {
  const navigate = useNavigate();

  const stage = getExchangeStage(exchange, currentUserId);
  const visual = getStageVisual(stage);
  const otherName = shortName(getOtherName(exchange, currentUserId));

  const requestedItem = items[getRequestedItemId(exchange)];
  const offeredItems = getOfferedItemIds(exchange).map((id) => items[id]).filter(Boolean);

  const requestedImage = getItemImage(requestedItem) || exchange.requestedItemImage || "";
  const offeredImage = getItemImage(offeredItems[0]) || exchange.offeredItemImage || "";

  const requestedTitle =
    getDisplayItemType(requestedItem) || exchange.requestedItemTitle || exchange.itemTitle || "Objet";

  const offeredTitle =
    offeredItems.map(getDisplayItemType).filter(Boolean).join(" + ") ||
    exchange.offeredItemTitle || exchange.proposedItemTitle || "Objet";

  const needsAttention =
    exchange.needsAttentionFor === currentUserId ||
    stage === "respond_time" ||
    stage === "respond_place";

  return (
    <TrocoButton
      variant="plain"
      onClick={() => navigate(`/exchanges/${exchange.id}`)}
      className="group flex w-full flex-col overflow-hidden rounded-[24px] border border-[#E4ECE8] bg-white text-left shadow-[0_8px_22px_rgba(15,23,42,0.045)] backdrop-blur-xl transition active:scale-[0.992]"
    >
      {/* Images des deux objets */}
      <div className="relative flex h-[130px] w-full overflow-hidden bg-slate-100">
        <div className="relative flex-1 overflow-hidden">
          {requestedImage ? (
            <img src={requestedImage} alt={requestedTitle} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">📦</div>
          )}
        </div>

        <div className="flex w-8 shrink-0 items-center justify-center bg-white/70 backdrop-blur-sm">
          <span className="text-[11px] font-extrabold text-slate-500">↔</span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {offeredImage ? (
            <img src={offeredImage} alt={offeredTitle} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">📦</div>
          )}
        </div>

        {needsAttention && (
          <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-white bg-[#0f9f9a]" />
        )}

        <span className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-extrabold backdrop-blur-sm ${visual.tone}`}>
          {visual.label}
        </span>
      </div>

      {/* Infos */}
      <div className="p-3">
        <p className="text-[11px] font-extrabold text-[#0f9f9a]">Avec {otherName}</p>
        <p className="mt-1 line-clamp-1 text-[15px] font-extrabold leading-tight tracking-[-0.03em] text-[#102033]">
          {requestedTitle}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12px] font-medium text-slate-500">
          ↔ {offeredTitle}
        </p>
        <p className="mt-2 text-[11.5px] font-medium text-slate-400">
          {getSubtitle(exchange, stage, currentUserId)}
        </p>
      </div>
    </TrocoButton>
  );
}

function ExchangeDetailPanel({ exchange, items, currentUserId }) {
  const navigate = useNavigate();

  if (!exchange) {
    return (
      <section className="sticky top-8 hidden min-h-[620px] rounded-[32px] border border-[#E4ECE8] bg-white p-8 text-center shadow-[0_16px_42px_rgba(15,23,42,0.06)] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">
          ↔️
        </div>
        <p className="text-[24px] font-extrabold tracking-[-0.05em] text-[#102033]">
          Sélectionne un troc
        </p>
        <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
          Clique sur un échange dans la liste pour afficher son détail ici.
        </p>
      </section>
    );
  }

  const stage = getExchangeStage(exchange, currentUserId);
  const visual = getStageVisual(stage);
  const otherName = shortName(getOtherName(exchange, currentUserId));

  const requestedItem = items[getRequestedItemId(exchange)];
  const offeredItems = getOfferedItemIds(exchange)
    .map((id) => items[id])
    .filter(Boolean);

  const requestedTitle =
    getDisplayItemType(requestedItem) ||
    exchange.requestedItemTitle ||
    exchange.itemTitle ||
    "Objet demandé";

  const offeredTitle =
    offeredItems.map(getDisplayItemType).filter(Boolean).join(" + ") ||
    exchange.offeredItemTitle ||
    exchange.proposedItemTitle ||
    "Objet proposé";

  const requestedImage =
    getItemImage(requestedItem) ||
    exchange.requestedItemImage ||
    "";

  const offeredImage =
    getItemImage(offeredItems[0]) ||
    exchange.offeredItemImage ||
    "";

  const needsAnswer =
    exchange.needsAttentionFor === currentUserId ||
    stage === "respond_time" ||
    stage === "respond_place" ||
    (stage === "pending" && exchange.receiverId === currentUserId);

  const showMeeting =
    stage === "confirmed" ||
    exchange.meetingConfirmed ||
    (exchange.selectedAvailability && exchange.selectedPlace);

  return (
    <section className="sticky top-8 hidden min-h-[620px] overflow-hidden rounded-[34px] border border-[#E4ECE8] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.055)] lg:block">
      <div className="p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.10em] text-[#179A8C]">
              Troc avec {otherName}
            </p>
            <h2 className="mt-2 text-[32px] font-extrabold leading-none tracking-[-0.06em] text-[#102033]">
              {visual.title}
            </h2>
            <p className="mt-3 max-w-[520px] text-[14px] font-medium leading-relaxed text-slate-500">
              {getSubtitle(exchange, stage, currentUserId)}
            </p>
          </div>

          <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${visual.tone}`}>
            {visual.label}
          </span>
        </div>

        {needsAnswer && (
          <div className="mt-5 rounded-[24px] border border-[#BFE8DA] bg-white p-4">
            <p className="text-[14px] font-extrabold text-[#08755C]">
              Une réponse est attendue de ta part.
            </p>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#40545B]">
              Ouvre la page complète du troc pour accepter, refuser ou demander une modification.
            </p>
            <TrocoButton
              variant="plain"
              onClick={() => navigate(`/exchanges/${exchange.id}`)}
              className="btn-primary mt-4 h-11 px-5"
            >
              Répondre maintenant
            </TrocoButton>
          </div>
        )}

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="aspect-[1.05/1]">
              {requestedImage ? (
                <img src={requestedImage} alt={requestedTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
              )}
            </div>
            <div className="p-4">
              <p className="truncate text-[16px] font-extrabold text-[#102033]">{requestedTitle}</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">Objet demandé</p>
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[22px] font-extrabold text-[#08755C]">
            ↔
          </div>

          <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="aspect-[1.05/1]">
              {offeredImage ? (
                <img src={offeredImage} alt={offeredTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
              )}
            </div>
            <div className="p-4">
              <p className="truncate text-[16px] font-extrabold text-[#102033]">{offeredTitle}</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">Objet proposé</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-[#E8F1ED] bg-white p-5">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#0f9f9a]">
            {showMeeting ? "Rencontre" : "Prochaine étape"}
          </p>

          {showMeeting ? (
            <div className="mt-3 grid gap-3 text-[14px] font-bold text-[#40545B]">
              <p className="flex items-center gap-2">
                <CalendarDays size={17} className="text-[#08755C]" />
                {exchange.selectedAvailability?.label || formatAvailability(exchange.selectedAvailability) || "Horaire validé"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={17} className="text-[#08755C]" />
                {exchange.selectedPlace?.title || exchange.selectedPlace?.name || "Lieu validé"}
              </p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-[15px] font-extrabold text-[#102033]">{visual.title}</p>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-500">
                La rencontre ne sera affichée ici qu’une fois le lieu et l’horaire confirmés.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <TrocoButton
            variant="plain"
            onClick={() => navigate(`/exchanges/${exchange.id}`)}
            className="btn-primary h-12"
          >
            Voir / gérer le troc
          </TrocoButton>

          <TrocoButton
            variant="plain"
            onClick={() => navigate(`/exchanges/${exchange.id}/chat`)}
            className="h-12 rounded-full border border-[#E5F1EC] bg-white text-[#253841]"
          >
            <MessageCircle size={17} />
            Message
          </TrocoButton>
        </div>
      </div>
    </section>
  );
}


export default function ExchangesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchanges, setExchanges] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"
  const [selectedExchangeId, setSelectedExchangeId] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);

    const exchangesById = new Map();
    let cancelled = false;

    function sortExchanges(list) {
      return list.sort((a, b) => {
        const prioA = getExchangePriority(a, user.uid);
        const prioB = getExchangePriority(b, user.uid);

        if (prioA !== prioB) return prioA - prioB;

        const dateA =
          a.updatedAt?.toDate?.() ||
          a.createdAt?.toDate?.() ||
          new Date(a.updatedAt || a.createdAt || 0);

        const dateB =
          b.updatedAt?.toDate?.() ||
          b.createdAt?.toDate?.() ||
          new Date(b.updatedAt || b.createdAt || 0);

        return dateB - dateA;
      });
    }

    function belongsToCurrentUserItem(item) {
      if (!item) return false;

      const uid = String(user.uid);
      const email = String(user.email || "").toLowerCase();

      return (
        String(item.ownerId || "") === uid ||
        String(item.userId || "") === uid ||
        String(item.ownerUid || "") === uid ||
        String(item.createdBy || "") === uid ||
        String(item.uid || "") === uid ||
        String(item.owner?.uid || "") === uid ||
        String(item.user?.uid || "") === uid ||
        String(item.createdById || "") === uid ||
        (email && String(item.ownerEmail || "").toLowerCase() === email) ||
        (email && String(item.userEmail || "").toLowerCase() === email) ||
        (email && String(item.createdByEmail || "").toLowerCase() === email)
      );
    }

    async function getMyItemIds() {
      const fields = ["ownerId", "userId", "ownerUid", "createdBy", "uid", "createdById"];
      const ids = new Set();

      await Promise.all(
        fields.map(async (field) => {
          try {
            const itemQuery = query(collection(db, "items"), where(field, "==", user.uid));
            const itemSnapshot = await getDocs(itemQuery);

            itemSnapshot.docs.forEach((document) => ids.add(document.id));
          } catch (error) {
            console.warn(`Impossible de charger mes objets via ${field}:`, error);
          }
        })
      );

      // Fallback : certains objets anciens peuvent avoir une structure irrégulière.
      if (ids.size === 0) {
        try {
          const allItemsSnapshot = await getDocs(collection(db, "items"));

          allItemsSnapshot.docs.forEach((document) => {
            const data = { id: document.id, ...document.data() };

            if (belongsToCurrentUserItem(data)) {
              ids.add(document.id);
            }
          });
        } catch (error) {
          console.warn("Impossible de faire le fallback objets:", error);
        }
      }

      return Array.from(ids);
    }

    async function loadFallbackExchangesForMyItems() {
      const myItemIds = await getMyItemIds();

      if (myItemIds.length === 0 || cancelled) return;

      const exchangeItemFields = ["requestedItemId", "requestedId", "itemId", "targetItemId"];

      for (const field of exchangeItemFields) {
        for (let index = 0; index < myItemIds.length; index += 10) {
          const chunk = myItemIds.slice(index, index + 10);

          try {
            const fallbackQuery = query(collection(db, "exchanges"), where(field, "in", chunk));
            const fallbackSnapshot = await getDocs(fallbackQuery);

            fallbackSnapshot.docs.forEach((document) => {
              exchangesById.set(document.id, {
                id: document.id,
                ...document.data(),
              });
            });
          } catch (error) {
            console.warn(`Impossible de charger les trocs via ${field}:`, error);
          }
        }
      }
    }

    async function refreshExchanges() {
      if (cancelled) return;

      await loadFallbackExchangesForMyItems();

      const list = sortExchanges(Array.from(exchangesById.values()));

      setExchanges(list);
      setSelectedExchangeId((current) => current || list[0]?.id || "");

      const loadedItems = {};

      await Promise.all(
        list.map(async (exchange) => {
          const exchangeItems = await loadItemsForExchange(exchange);

          exchangeItems.forEach((item) => {
            loadedItems[item.id] = item;
          });
        })
      );

      if (!cancelled) {
        setItems(loadedItems);
        setLoading(false);
      }
    }

    const exchangeQueries = [
      query(collection(db, "exchanges"), where("participants", "array-contains", user.uid)),
      query(collection(db, "exchanges"), where("senderId", "==", user.uid)),
      query(collection(db, "exchanges"), where("receiverId", "==", user.uid)),
      query(collection(db, "exchanges"), where("needsAttentionFor", "==", user.uid)),
    ];

    const receivedFirstSnapshot = new Array(exchangeQueries.length).fill(false);

    const unsubscribes = exchangeQueries.map((exchangeQuery, index) =>
      onSnapshot(
        exchangeQuery,
        async (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              exchangesById.delete(change.doc.id);
              return;
            }

            exchangesById.set(change.doc.id, {
              id: change.doc.id,
              ...change.doc.data(),
            });
          });

          receivedFirstSnapshot[index] = true;

          if (receivedFirstSnapshot.every(Boolean)) {
            await refreshExchanges();
          }
        },
        async (error) => {
          console.error("Erreur chargement trocs :", error);
          receivedFirstSnapshot[index] = true;

          if (receivedFirstSnapshot.every(Boolean)) {
            await refreshExchanges();
          }
        }
      )
    );

    return () => {
      cancelled = true;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [authLoading, user?.uid, user?.email, navigate]);

  const counts = useMemo(() => {
    const active = exchanges.filter((exchange) => {
      const stage = getExchangeStage(exchange, user?.uid);
      return !["completed", "declined", "cancelled"].includes(stage);
    }).length;

    const attention = exchanges.filter((exchange) => {
      const stage = getExchangeStage(exchange, user?.uid);
      return (
        exchange.needsAttentionFor === user?.uid ||
        ["respond_time", "respond_place"].includes(stage)
      );
    }).length;

    return { active, attention };
  }, [exchanges, user?.uid]);

  const selectedExchange = useMemo(() => {
    return (
      exchanges.find((exchange) => exchange.id === selectedExchangeId) ||
      exchanges[0] ||
      null
    );
  }, [exchanges, selectedExchangeId]);

  if (authLoading || loading) {
    return (
      <>
        <TrocoPageHeader eyebrow="Échanges" title="Trocs" subtitle="Tes échanges en cours." showNotifications={false} showAvatar={false} />
        <div className="px-5">
          <div className="rounded-[24px] border border-[#E4ECE8] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            Chargement des trocs...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TrocoPageHeader
        eyebrow="Échanges"
        title="Trocs"
        subtitle="Suis tes propositions et organise tes rencontres."
        showNotifications={false}
        showAvatar={false}
      />

      <main className="px-5 pb-10 lg:px-8 lg:pb-12">
        {/* Toggle vue liste / grille — mobile uniquement */}
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <p className="text-[12px] font-bold text-slate-400">
            {exchanges.length} troc{exchanges.length > 1 ? "s" : ""}
          </p>
          <div className="flex rounded-[13px] border border-[#E4ECE8] bg-white p-1 shadow-[0_3px_10px_rgba(15,23,42,0.045)]">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={[
                "flex h-7 w-7 items-center justify-center rounded-[9px] transition",
                viewMode === "list" ? "bg-[#0f9f9a] text-white shadow-sm" : "text-slate-400",
              ].join(" ")}
              aria-label="Vue liste"
            >
              <List size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={[
                "flex h-7 w-7 items-center justify-center rounded-[9px] transition",
                viewMode === "grid" ? "bg-[#0f9f9a] text-white shadow-sm" : "text-slate-400",
              ].join(" ")}
              aria-label="Vue grille"
            >
              <LayoutGrid size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <section className="mb-5 grid grid-cols-2 gap-3 lg:hidden">
          <div className="rounded-[22px] border border-[#E4ECE8] bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.035)]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <CalendarDays size={18} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">Actifs</p>
                <p className="mt-0.5 text-[24px] font-extrabold leading-none text-[#102033]">{counts.active}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#E4ECE8] bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.035)]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                <Hourglass size={18} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-sky-600">À traiter</p>
                <p className="mt-0.5 text-[24px] font-extrabold leading-none text-[#102033]">{counts.attention}</p>
              </div>
            </div>
          </div>
        </section>

        {exchanges.length === 0 ? (
          <div className="card p-7 text-center">
            <div className="mb-3 text-4xl">↔️</div>
            <p className="text-lg font-extrabold text-[#102033]">Aucun troc pour l'instant</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Quand tu proposes ou reçois un échange, il apparaîra ici.
            </p>
            <TrocoButton variant="plain" onClick={() => navigate("/feed")} className="btn-primary mt-5 w-full">
              Explorer les objets
            </TrocoButton>
          </div>
        ) : (() => {
          const needsAction = exchanges.filter((ex) => {
            const stage = getExchangeStage(ex, user.uid);
            return (
              ex.needsAttentionFor === user.uid ||
              stage === "respond_time" ||
              stage === "respond_place" ||
              (stage === "pending" && ex.receiverId === user.uid)
            );
          });
          const others = exchanges.filter((ex) => !needsAction.includes(ex));

          const renderCard = (exchange) => (
            <ExchangeCard
              key={exchange.id}
              exchange={exchange}
              items={items}
              currentUserId={user.uid}
              selected={selectedExchange?.id === exchange.id}
              onSelect={setSelectedExchangeId}
            />
          );

          const renderMobileCard = (exchange) => (
            <ExchangeCard
              key={exchange.id}
              exchange={exchange}
              items={items}
              currentUserId={user.uid}
            />
          );

          return (
            <>
              <div className="lg:hidden space-y-4">
                {needsAction.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.10em] text-[#179A8C]">⚡ Action requise</p>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-2 gap-3">
                        {needsAction.map((ex) => <ExchangeCardVertical key={ex.id} exchange={ex} items={items} currentUserId={user.uid} />)}
                      </div>
                    ) : (
                      <div className="space-y-3">{needsAction.map(renderMobileCard)}</div>
                    )}
                  </div>
                )}
                {others.length > 0 && (
                  <div>
                    {needsAction.length > 0 && (
                      <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Autres trocs</p>
                    )}
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-2 gap-3">
                        {others.map((ex) => <ExchangeCardVertical key={ex.id} exchange={ex} items={items} currentUserId={user.uid} />)}
                      </div>
                    ) : (
                      <div className="space-y-3">{others.map(renderMobileCard)}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[480px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <section className="grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] border border-[#E4ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">Actifs</p>
                      <p className="mt-1 text-[24px] font-extrabold leading-none text-[#102033]">{counts.active}</p>
                    </div>

                    <div className="rounded-[22px] border border-[#E4ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-sky-600">À traiter</p>
                      <p className="mt-1 text-[24px] font-extrabold leading-none text-[#102033]">{counts.attention}</p>
                    </div>
                  </section>

                  {needsAction.length > 0 && (
                    <div>
                      <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.10em] text-[#179A8C]">⚡ Action requise</p>
                      <div className="space-y-3">{needsAction.map(renderCard)}</div>
                    </div>
                  )}

                  {others.length > 0 && (
                    <div>
                      {needsAction.length > 0 && (
                        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Autres trocs</p>
                      )}
                      <div className="space-y-3">{others.map(renderCard)}</div>
                    </div>
                  )}
                </div>

                <ExchangeDetailPanel exchange={selectedExchange} items={items} currentUserId={user.uid} />
              </div>
            </>
          );
        })()}
      </main>
    </>
  );
}
