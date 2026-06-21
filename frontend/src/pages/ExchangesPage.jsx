import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Lightbulb, MessageCircle, Repeat2 } from "lucide-react";
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
import TrocoPageHeader from "../components/TrocoPageHeader";
import { formatDate, getDisplayItemType, getItemImage } from "../utils/format";

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

function StageBadge({ stage }) {
  const visual = getStageVisual(stage);
  const isWaiting = ["pending", "waiting_time", "waiting_place"].includes(stage);
  const isActive = ["start_time", "respond_time", "start_place", "respond_place", "confirmed", "chat"].includes(stage);
  const isEnded = ["declined", "cancelled", "completed"].includes(stage);
  return (
    <span className={[
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black",
      isWaiting ? "bg-amber-100 text-amber-700" :
      isActive ? "bg-[#E6F9F3] text-[#0f9f9a]" :
      isEnded ? "bg-rose-100 text-rose-600" :
      "bg-slate-100 text-slate-500",
    ].join(" ")}>
      {visual.label}
    </span>
  );
}

function ExchangeCard({ exchange, items, currentUserId }) {
  const navigate = useNavigate();
  const stage = getExchangeStage(exchange, currentUserId);
  const otherName = getOtherName(exchange, currentUserId);
  const isSender = exchange.senderId === currentUserId;

  const requestedItem = items[getRequestedItemId(exchange)];
  const offeredItem = items[getOfferedItemIds(exchange)[0]] || null;

  const leftImage = getItemImage(requestedItem) || exchange.requestedItemImage || "";
  const leftTitle = getDisplayItemType(requestedItem) || exchange.requestedItemTitle || "Objet demandé";
  const rightImage = getItemImage(offeredItem) || exchange.offeredItemImage || "";
  const rightTitle = getDisplayItemType(offeredItem) || exchange.offeredItemTitle || "Objet proposé";

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E4EDE9] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
      {/* Status badge */}
      <div className="flex justify-center pt-4">
        <StageBadge stage={stage} />
      </div>

      {/* Two items side by side */}
      <div className="mt-3 grid grid-cols-[1fr_36px_1fr] items-start gap-2 px-4">
        <div>
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#1ABEA3]">
            {isSender ? "Tu demandes" : "Il te propose"}
          </p>
          <div className="aspect-square lg:h-28 lg:aspect-auto overflow-hidden rounded-[14px] bg-[#F4F7F5]">
            {leftImage
              ? <img src={leftImage} alt={leftTitle} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">📦</div>
            }
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px] font-black leading-snug text-[#0d1b2a]">{leftTitle}</p>
        </div>

        <div className="flex justify-center pt-9">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#94a3b8]">
            <Repeat2 size={14} strokeWidth={2.2} />
          </span>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
            {isSender ? "Tu proposes" : "Tu donnes"}
          </p>
          <div className="aspect-square lg:h-28 lg:aspect-auto overflow-hidden rounded-[14px] bg-[#F4F7F5]">
            {rightImage
              ? <img src={rightImage} alt={rightTitle} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">📦</div>
            }
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px] font-black leading-snug text-[#0d1b2a]">{rightTitle}</p>
        </div>
      </div>

      {/* Person row */}
      <div className="mx-4 mt-3 flex items-center justify-between border-t border-[#F0F5F3] py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-[11px] font-black text-white">
            {otherName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-[12px] font-black text-[#0d1b2a]">Échange avec {otherName}</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">{formatDate(exchange)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/exchanges/${exchange.id}/chat`); }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]"
          aria-label="Chat"
        >
          <MessageCircle size={15} strokeWidth={2.2} />
        </button>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate(`/exchanges/${exchange.id}`)}
          className="w-full rounded-[14px] bg-[#F0FAF7] py-3 text-[13px] font-black text-[#0f9f9a] transition active:scale-[0.98]"
        >
          Voir le détail de l'échange →
        </button>
      </div>
    </div>
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

    const uid = user.uid;

    function sortAndDedupe(docsA, docsB) {
      const map = new Map();
      [...docsA, ...docsB].forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
      return [...map.values()].sort((a, b) => {
        const toMs = (v) =>
          v?.toDate?.()?.getTime() ?? (v?.seconds ? v.seconds * 1000 : new Date(v || 0).getTime());
        return toMs(b.updatedAt ?? b.createdAt) - toMs(a.updatedAt ?? a.createdAt);
      });
    }

    const qSent     = query(collection(db, "exchanges"), where("senderId",   "==", uid));
    const qReceived = query(collection(db, "exchanges"), where("receiverId",  "==", uid));

    let snapSent     = null;
    let snapReceived = null;
    let active = true;

    async function rebuild() {
      if (!active || snapSent === null || snapReceived === null) return;
      const list = sortAndDedupe(snapSent.docs, snapReceived.docs);
      const loadedItems = {};
      await Promise.all(
        list.map(async (exchange) => {
          const exchangeItems = await loadItemsForExchange(exchange);
          exchangeItems.forEach((item) => { loadedItems[item.id] = item; });
        })
      );
      if (!active) return;
      setExchanges(list);
      setItems(loadedItems);
      setLoading(false);
    }

    const unsubSent = onSnapshot(qSent, (snap) => {
      snapSent = snap;
      rebuild();
    }, (err) => { console.error("Erreur trocs envoyés :", err); setLoading(false); });

    const unsubReceived = onSnapshot(qReceived, (snap) => {
      snapReceived = snap;
      rebuild();
    }, (err) => { console.error("Erreur trocs reçus :", err); setLoading(false); });

    return () => { active = false; unsubSent(); unsubReceived(); };
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

  const activeExchanges = useMemo(() =>
    exchanges.filter((e) => !["completed", "declined", "cancelled"].includes(getExchangeStage(e, user?.uid))),
    [exchanges, user?.uid]
  );

  const endedExchanges = useMemo(() =>
    exchanges.filter((e) => ["completed", "declined", "cancelled"].includes(getExchangeStage(e, user?.uid))),
    [exchanges, user?.uid]
  );

  if (authLoading || loading) {
    return (
      <>
        <TrocoPageHeader title="Trocs" subtitle="Tes échanges en cours." />
        <div className="flex items-center justify-center py-12 text-[13px] font-bold text-[#94a3b8]">
          Chargement...
        </div>
      </>
    );
  }

  return (
    <>
      <TrocoPageHeader title="Trocs" subtitle="Tes échanges en cours." />

      {exchanges.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[#DDE8E4] bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
            <Repeat2 size={22} strokeWidth={2.2} />
          </div>
          <p className="text-[16px] font-black text-[#0d1b2a]">Aucun troc pour l’instant</p>
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#94a3b8]">
            Quand tu proposes ou reçois un échange, il apparaîtra ici.
          </p>
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="mt-5 rounded-full bg-gradient-to-br from-[#1ABEA3] to-[#36C982] px-6 py-3 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(26,190,163,0.25)]"
          >
            Explorer les objets
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pill compteur */}
          {activeExchanges.length > 0 && (
            <div className="flex items-center justify-between rounded-[16px] border border-[#C8EDE5] bg-[#F0FAF7] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Repeat2 size={15} strokeWidth={2.3} className="text-[#1ABEA3]" />
                <span className="text-[13px] font-black text-[#0f9f9a]">
                  {activeExchanges.length} échange{activeExchanges.length > 1 ? "s" : ""} actif{activeExchanges.length > 1 ? "s" : ""}
                </span>
              </div>
              <ChevronRight size={16} strokeWidth={2.3} className="text-[#1ABEA3]" />
            </div>
          )}

          {/* Échanges actifs */}
          {activeExchanges.length > 0 && (
            <section>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1ABEA3]">
                Échange actif
              </p>
              <motion.div
                className="grid gap-3 lg:grid-cols-2"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              >
                {activeExchanges.map((e) => (
                  <motion.div
                    key={e.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } },
                    }}
                  >
                    <ExchangeCard exchange={e} items={items} currentUserId={user.uid} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Autres échanges (terminés/refusés) */}
          {endedExchanges.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                  Autres échanges
                </p>
                <button type="button" className="text-[11px] font-black text-[#1ABEA3]">
                  Voir tout
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {endedExchanges.slice(0, 6).map((e) => {
                  const stage = getExchangeStage(e, user.uid);
                  const visual = getStageVisual(stage);
                  const reqItem = items[getRequestedItemId(e)];
                  const offItem = items[getOfferedItemIds(e)[0]];
                  const img = getItemImage(reqItem) || getItemImage(offItem) || e.requestedItemImage || "";
                  const isDeclined = stage === "declined" || stage === "cancelled";
                  const isDone = stage === "completed";
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => navigate(`/exchanges/${e.id}`)}
                      className="relative aspect-square overflow-hidden rounded-[14px] bg-[#F4F7F5]"
                    >
                      {img
                        ? <img src={img} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-2xl">↔️</div>
                      }
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-1.5">
                        <span className={[
                          "inline-flex rounded-full px-2 py-0.5 text-[9px] font-black text-white",
                          isDeclined ? "bg-rose-500" : isDone ? "bg-[#1ABEA3]" : "bg-amber-500",
                        ].join(" ")}>
                          {visual.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Conseil Troco */}
          <button
            type="button"
            onClick={() => navigate("/add")}
            className="flex w-full items-center gap-3 rounded-[18px] border border-[#E4ECE8] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0FAF7] text-[#1ABEA3]">
              <Lightbulb size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-[#0d1b2a]">Conseil Troco</p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#94a3b8]">
                Ajoute d’autres objets pour multiplier tes opportunités d’échange !
              </p>
            </div>
            <ChevronRight size={16} strokeWidth={2.2} className="shrink-0 text-[#94a3b8]" />
          </button>
        </div>
      )}
    </>
  );
}
