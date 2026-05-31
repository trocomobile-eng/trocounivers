import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import BottomNav from "../components/BottomNav";
import TrocoPageHeader from "../components/TrocoPageHeader";

import {
  formatDate,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
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

  if (
    status === "accepted" ||
    status === "scheduling_time" ||
    status === "time_confirmed" ||
    status === "choosing_place"
  ) {
    return "start_time";
  }

  return "pending";
}

function getStageVisual(stage) {
  switch (stage) {
    case "respond_time":
      return {
        label: "À toi de répondre",
        title: "Disponibilités reçues",
        tone: "bg-sky-50 text-sky-700 border-sky-100",
        cta: "Répondre aux disponibilités",
      };

    case "waiting_time":
      return {
        label: "En attente",
        title: "Disponibilités envoyées",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
        cta: "Voir les disponibilités",
      };

    case "start_place":
      return {
        label: "Horaire validé",
        title: "Choisir un lieu",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
        cta: "Choisir un lieu",
      };

    case "respond_place":
      return {
        label: "À toi de répondre",
        title: "Lieu reçu",
        tone: "bg-sky-50 text-sky-700 border-sky-100",
        cta: "Répondre au lieu",
      };

    case "waiting_place":
      return {
        label: "En attente",
        title: "Lieu envoyé",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
        cta: "Voir le lieu",
      };

    case "confirmed":
      return {
        label: "Confirmé",
        title: "Rencontre confirmée",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
        cta: "Voir la rencontre",
      };

    case "chat":
      return {
        label: "Message",
        title: "Discussion ouverte",
        tone: "bg-sky-50 text-sky-700 border-sky-100",
        cta: "Ouvrir la discussion",
      };

    case "completed":
      return {
        label: "Terminé",
        title: "Échange terminé",
        tone: "bg-slate-100 text-slate-600 border-slate-100",
        cta: "Voir le troc",
      };

    case "declined":
      return {
        label: "Refusé",
        title: "Échange refusé",
        tone: "bg-rose-50 text-rose-700 border-rose-100",
        cta: "Voir le troc",
      };

    case "cancelled":
      return {
        label: "Annulé",
        title: "Échange annulé",
        tone: "bg-slate-100 text-slate-600 border-slate-100",
        cta: "Voir le troc",
      };

    case "start_time":
      return {
        label: "Accepté",
        title: "Organiser la rencontre",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
        cta: "Choisir mes disponibilités",
      };

    case "pending":
    default:
      return {
        label: "En attente",
        title: "Proposition en attente",
        tone: "bg-amber-50 text-amber-700 border-amber-100",
        cta: "Voir le troc",
      };
  }
}

function getSubtitle(exchange, stage, currentUserId) {
  const otherName = getOtherName(exchange, currentUserId);

  if (stage === "respond_time") {
    const count = exchange.availabilityOptions?.length || 0;
    return `${exchange.availabilityProposedByName || otherName} a proposé ${count} créneau${count > 1 ? "x" : ""}.`;
  }

  if (stage === "waiting_time") {
    return `${otherName} doit choisir un créneau ou proposer une alternative.`;
  }

  if (stage === "respond_place") {
    return `${exchange.placeProposedByName || otherName} propose ${exchange.placeOptions?.[0]?.title || "un lieu"}.`;
  }

  if (stage === "waiting_place") {
    return `${otherName} doit accepter ou proposer l’autre lieu.`;
  }

  if (stage === "start_place") {
    return `Horaire validé : ${formatAvailability(exchange.selectedAvailability)}.`;
  }

  if (stage === "confirmed") {
    return `${exchange.selectedAvailability?.label || formatAvailability(exchange.selectedAvailability) || "Horaire validé"} · ${exchange.selectedPlace?.title || "Lieu validé"}`;
  }

  if (stage === "chat") {
    return "Une courte discussion est ouverte pour finaliser.";
  }

  if (stage === "start_time") {
    return "Le troc est accepté. Il reste à choisir les disponibilités.";
  }

  return "Consulte le détail du troc.";
}

function ExchangeCard({ exchange, items, currentUserId }) {
  const navigate = useNavigate();

  const stage = getExchangeStage(exchange, currentUserId);
  const visual = getStageVisual(stage);
  const otherName = getOtherName(exchange, currentUserId);

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
    "Objet demandé";

  const offeredTitle =
    offeredItems.map(getDisplayItemType).filter(Boolean).join(" + ") ||
    exchange.offeredItemTitle ||
    exchange.proposedItemTitle ||
    "Objet proposé";

  const needsAttention = exchange.needsAttentionFor === currentUserId || stage === "respond_time" || stage === "respond_place";

  return (
    <button
      type="button"
      onClick={() => navigate(`/exchanges/${exchange.id}`)}
      className="group w-full rounded-[30px] border border-white/90 bg-white/84 p-4 text-left shadow-[0_10px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl transition active:scale-[0.985]"
    >
      <div className="flex gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[24px] bg-slate-50">
          {image ? (
            <img
              src={image}
              alt={requestedTitle}
              className="h-full w-full object-cover brightness-[1.02] contrast-[1.02] saturate-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
              ↔️
            </div>
          )}

          {needsAttention && (
            <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-600">
                Avec {otherName}
              </p>

              <h3 className="mt-1 line-clamp-1 text-[20px] font-black tracking-[-0.04em] text-slate-950">
                {visual.title}
              </h3>
            </div>

            <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${visual.tone}`}>
              {visual.label}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-slate-500">
            {getSubtitle(exchange, stage, currentUserId)}
          </p>

          <div className="mt-3 rounded-[20px] bg-slate-50/80 p-3">
            <p className="line-clamp-1 text-[12px] font-bold text-slate-500">
              Demandé : <span className="text-slate-800">{requestedTitle}</span>
            </p>

            <p className="mt-1 line-clamp-1 text-[12px] font-bold text-slate-500">
              Proposé : <span className="text-slate-800">{offeredTitle}</span>
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-500">
              {formatDate(exchange)}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">
              {visual.cta} →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ExchangesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchanges, setExchanges] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    const q = query(
      collection(db, "exchanges"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const list = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        list.sort((a, b) => {
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

        setExchanges(list);

        const loadedItems = {};

        await Promise.all(
          list.map(async (exchange) => {
            const exchangeItems = await loadItemsForExchange(exchange);

            exchangeItems.forEach((item) => {
              loadedItems[item.id] = item;
            });
          })
        );

        setItems(loadedItems);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur chargement trocs :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, navigate]);

  const counts = useMemo(() => {
    const active = exchanges.filter((exchange) => {
      const stage = getExchangeStage(exchange, user?.uid);
      return !["completed", "declined", "cancelled"].includes(stage);
    }).length;

    const attention = exchanges.filter((exchange) => {
      const stage = getExchangeStage(exchange, user?.uid);
      return exchange.needsAttentionFor === user?.uid || ["respond_time", "respond_place"].includes(stage);
    }).length;

    return { active, attention };
  }, [exchanges, user?.uid]);

  if (authLoading || loading) {
    return (
      <div className="page">
        <TrocoPageHeader title="Trocs" subtitle="Tes échanges en cours." />

        <div className="px-5 pb-28">
          <div className="card p-6 text-center text-sm font-bold text-slate-500">
            Chargement des trocs...
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <TrocoPageHeader
        title="Trocs"
        subtitle="Suis tes propositions et organise les rencontres guidées."
      />

      <main className="px-5 pb-36">
        <section className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-[26px] border border-white/80 bg-white/80 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.055)] backdrop-blur-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-600">
              Actifs
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {counts.active}
            </p>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-white/80 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.055)] backdrop-blur-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-600">
              À traiter
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {counts.attention}
            </p>
          </div>
        </section>

        {exchanges.length === 0 ? (
          <div className="card p-7 text-center">
            <div className="mb-3 text-4xl">↔️</div>

            <p className="text-lg font-black text-slate-950">
              Aucun troc pour l’instant
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Quand tu proposes ou reçois un échange, il apparaîtra ici.
            </p>

            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="btn-primary mt-5 w-full"
            >
              Explorer les objets
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exchanges.map((exchange) => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                items={items}
                currentUserId={user.uid}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
