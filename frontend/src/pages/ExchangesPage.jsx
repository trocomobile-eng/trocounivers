import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lightbulb,
  MessageCircle,
  Repeat2,
} from "lucide-react";
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

// ─── Helpers (logique métier inchangée) ──────────────────────────────────────

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
  return unique([getRequestedItemId(exchange), ...getOfferedItemIds(exchange)]);
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
  ) return "confirmed";
  if (status === "chat_open" || exchange.chatOpened || exchange.chatOpen) return "chat";
  if (hasPlaceOptions && exchange.placeProposedBy !== currentUserId) return "respond_place";
  if (hasPlaceOptions && exchange.placeProposedBy === currentUserId) return "waiting_place";
  if (exchange.selectedAvailability && !exchange.selectedPlace) return "start_place";
  if (hasTimeOptions && exchange.availabilityProposedBy !== currentUserId) return "respond_time";
  if (hasTimeOptions && exchange.availabilityProposedBy === currentUserId) return "waiting_time";
  if (
    status === "accepted" ||
    status === "scheduling_time" ||
    status === "time_confirmed" ||
    status === "choosing_place"
  ) return "start_time";
  // pending : distingue si c'est moi qui ai envoyé ou reçu
  if (exchange.senderId === currentUserId) return "pending_mine";
  return "pending";
}

function getStageVisual(stage) {
  const map = {
    respond_time:  { label: "À toi de répondre",    cta: "Choisir un créneau",         myTurn: true  },
    waiting_time:  { label: "À lui de choisir",      cta: "Voir les disponibilités",    myTurn: false },
    start_place:   { label: "Créneau validé",        cta: "Proposer un lieu",           myTurn: true  },
    respond_place: { label: "À toi de répondre",     cta: "Confirmer le lieu",          myTurn: true  },
    waiting_place: { label: "Lieu à confirmer",      cta: "Voir le lieu proposé",       myTurn: false },
    confirmed:     { label: "Rendez-vous fixé",      cta: "Voir les détails",           myTurn: false },
    chat:          { label: "En discussion",         cta: "Ouvrir le chat",             myTurn: true  },
    completed:     { label: "Échange terminé",       cta: "Voir le récap",              myTurn: false },
    declined:      { label: "Refusé",                cta: "Voir le troc",               myTurn: false },
    cancelled:     { label: "Annulé",                cta: "Voir le troc",               myTurn: false },
    start_time:    { label: "Accepté — à planifier", cta: "Proposer mes disponibilités", myTurn: true },
    pending_mine:  { label: "En attente de réponse", cta: "Voir la proposition",        myTurn: false },
    pending:       { label: "À toi de répondre",     cta: "Voir la proposition",        myTurn: true  },
  };
  return map[stage] || map.pending;
}

function getStageOrder(stage) {
  if (["respond_time", "respond_place", "start_time", "start_place", "chat", "pending"].includes(stage)) return 0;
  if (stage === "confirmed") return 1;
  if (["waiting_time", "waiting_place", "pending_mine"].includes(stage)) return 2;
  return 3;
}

function getSubtitle(exchange, stage, currentUserId) {
  const otherName = getOtherName(exchange, currentUserId);
  const short = otherName.split(" ")[0];

  if (stage === "respond_time") {
    const count = exchange.availabilityOptions?.length || 0;
    return `${exchange.availabilityProposedByName || short} a proposé ${count} créneau${count > 1 ? "x" : ""}.`;
  }
  if (stage === "waiting_time") return `${short} doit choisir un créneau.`;
  if (stage === "respond_place") return `${exchange.placeProposedByName || short} propose un lieu de rendez-vous.`;
  if (stage === "waiting_place") return `${short} doit accepter le lieu proposé.`;
  if (stage === "start_place") return `Horaire validé · ${formatAvailability(exchange.selectedAvailability)}.`;
  if (stage === "confirmed") {
    const avail = exchange.selectedAvailability?.label || formatAvailability(exchange.selectedAvailability) || "";
    const place = exchange.selectedPlace?.title || "";
    return [avail, place].filter(Boolean).join(" · ") || "Rendez-vous prévu.";
  }
  if (stage === "chat") return "Une courte discussion est ouverte pour finaliser.";
  if (stage === "start_time") return "Le troc est accepté — choisis tes disponibilités.";
  if (stage === "completed") return "L'échange est terminé. Bravo !";
  if (stage === "declined") return "Cette proposition a été refusée.";
  if (stage === "cancelled") return "Cet échange a été annulé.";
  if (stage === "pending_mine") return `${short} examine ta proposition.`;
  if (stage === "pending") return `${short} te propose un échange.`;
  return "Consulte le détail du troc.";
}

// ─── Pill de statut ───────────────────────────────────────────────────────────

function StatusPill({ stage }) {
  const visual = getStageVisual(stage);
  const isEnded   = ["completed", "declined", "cancelled"].includes(stage);
  const isWaiting = ["pending_mine", "waiting_time", "waiting_place"].includes(stage);
  const isAction  = visual.myTurn && !isEnded;

  const color = isEnded
    ? "bg-[#F3F4F6] text-[#6F7782]"
    : isAction
    ? "bg-[#E6F9F3] text-[#0c9e7b]"
    : isWaiting
    ? "bg-[#FFFBEB] text-[#92400e]"
    : "bg-[#E6F9F3] text-[#0c9e7b]";

  return (
    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-black", color].join(" ")}>
      {visual.label}
    </span>
  );
}

// ─── Avatar personne ──────────────────────────────────────────────────────────

function PersonAvatar({ name, photoURL, size = "md" }) {
  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "md" ? "text-[14px]" : "text-[12px]";
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        className={[dim, "rounded-full object-cover ring-2 ring-white shadow-[0_2px_8px_rgba(15,23,42,0.10)]"].join(" ")}
      />
    );
  }
  return (
    <span className={[dim, "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22C58B] to-[#1ABEA3] text-white font-black shadow-[0_2px_8px_rgba(34,197,139,0.20)]", text].join(" ")}>
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

// ─── Carte d'échange redessinée ───────────────────────────────────────────────

function ExchangeCard({ exchange, items, currentUserId }) {
  const navigate = useNavigate();
  const stage     = getExchangeStage(exchange, currentUserId);
  const otherName = getOtherName(exchange, currentUserId);
  const subtitle  = getSubtitle(exchange, stage, currentUserId);
  const firstName = otherName.split(" ")[0];

  const otherPhotoURL = exchange.senderId === currentUserId
    ? (exchange.receiverPhotoURL || exchange.receiverAvatar || "")
    : (exchange.senderPhotoURL || exchange.senderAvatar || "");

  const requestedItem = items[getRequestedItemId(exchange)];
  const offeredItem   = items[getOfferedItemIds(exchange)[0]] || null;

  const leftImage  = getItemImage(requestedItem)  || exchange.requestedItemImage || "";
  const leftTitle  = getDisplayItemType(requestedItem)  || exchange.requestedItemTitle  || "Ton objet";
  const rightImage = getItemImage(offeredItem) || exchange.offeredItemImage || "";
  const rightTitle = getDisplayItemType(offeredItem) || exchange.offeredItemTitle || "Son objet";

  const isEnded  = ["completed", "declined", "cancelled"].includes(stage);
  const visual   = getStageVisual(stage);
  const myTurn   = visual.myTurn && !isEnded;

  return (
    <div className={["overflow-hidden rounded-[20px] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] transition", myTurn ? "ring-1 ring-[#22C58B]/30" : ""].join(" ")}>

      {/* Bandeau action requise */}
      {myTurn && (
        <div className="flex items-center gap-1.5 bg-[#F0FAF7] px-4 py-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C58B]" />
          <p className="text-[10.5px] font-black text-[#0c9e7b]">Action requise</p>
        </div>
      )}

      {/* En-tête : avatar + nom + statut */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">
        <PersonAvatar name={otherName} photoURL={otherPhotoURL} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-black leading-tight text-[#17212B]">{firstName}</p>
            <StatusPill stage={stage} />
          </div>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#6F7782]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/exchanges/${exchange.id}/chat`); }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E7ECEB] bg-white text-[#22C58B] shadow-[0_2px_6px_rgba(15,23,42,0.06)] transition active:scale-95"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* Photos */}
      <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2 px-4 pb-3">
        <div>
          <div className="aspect-[3/2] overflow-hidden rounded-[12px] bg-[#F2F4F3]">
            {leftImage
              ? <img src={leftImage} alt={leftTitle} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-xl text-slate-200">📦</div>
            }
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold leading-snug text-[#17212B]">{leftTitle}</p>
          <p className="text-[9.5px] font-medium text-[#6F7782]">Ton objet</p>
        </div>

        <div className="flex justify-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0FAF7]">
            <Repeat2 size={12} strokeWidth={2.3} className="text-[#22C58B]" />
          </span>
        </div>

        <div>
          <div className="aspect-[3/2] overflow-hidden rounded-[12px] bg-[#F2F4F3]">
            {rightImage
              ? <img src={rightImage} alt={rightTitle} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-xl text-slate-200">📦</div>
            }
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold leading-snug text-[#17212B]">{rightTitle}</p>
          <p className="text-[9.5px] font-medium text-[#6F7782]">Son objet</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => navigate(`/exchanges/${exchange.id}`)}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-[12px] py-2 text-[12.5px] font-black transition active:scale-[0.98]",
            isEnded
              ? "bg-[#F6F9F8] text-[#6F7782]"
              : myTurn
              ? "bg-[#22C58B] text-white shadow-[0_4px_14px_rgba(34,197,139,0.22)]"
              : "border border-[#E7ECEB] bg-white text-[#17212B]",
          ].join(" ")}
        >
          {visual.cta}
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Chips de filtre ──────────────────────────────────────────────────────────

function FilterChip({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition active:scale-[0.97]",
        active
          ? "border-transparent bg-[#17212B] text-white shadow-[0_2px_8px_rgba(23,33,43,0.18)]"
          : "border-[#E7ECEB] bg-white text-[#6F7782]",
      ].join(" ")}
    >
      <Icon size={12} strokeWidth={2.2} />
      {label}
      {count > 0 && (
        <span className={[
          "rounded-full px-1.5 py-0.5 text-[9.5px] font-black",
          active ? "bg-white/20 text-white" : "bg-[#F0FAF7] text-[#22C58B]",
        ].join(" ")}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ExchangesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchanges, setExchanges]   = useState([]);
  const [items, setItems]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setFilter]   = useState("actifs");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { navigate("/login", { replace: true }); return; }

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

    const qSent        = query(collection(db, "exchanges"), where("senderId",    "==",           uid));
    const qReceived    = query(collection(db, "exchanges"), where("receiverId",  "==",           uid));
    const qParticipant = query(collection(db, "exchanges"), where("participants","array-contains",uid));

    let snapSent = null, snapReceived = null, snapParticipant = null, active = true;

    async function rebuild() {
      if (!active || snapSent === null || snapReceived === null || snapParticipant === null) return;
      const list = sortAndDedupe(
        [...snapSent.docs, ...snapParticipant.docs],
        snapReceived.docs,
      );
      const loadedItems = {};
      await Promise.all(
        list.map(async (exchange) => {
          const ex = await loadItemsForExchange(exchange);
          ex.forEach((item) => { loadedItems[item.id] = item; });
        })
      );
      if (!active) return;
      setExchanges(list);
      setItems(loadedItems);
      setLoading(false);
    }

    const unsubSent        = onSnapshot(qSent,        (snap) => { snapSent = snap;        rebuild(); }, (err) => { console.error(err); setLoading(false); });
    const unsubReceived    = onSnapshot(qReceived,    (snap) => { snapReceived = snap;    rebuild(); }, (err) => { console.error(err); setLoading(false); });
    const unsubParticipant = onSnapshot(qParticipant, (snap) => { snapParticipant = snap; rebuild(); }, (err) => { snapParticipant = { docs: [] }; rebuild(); });

    return () => { active = false; unsubSent(); unsubReceived(); unsubParticipant(); };
  }, [authLoading, user?.uid, navigate]);

  // Catégories
  const activeExchanges  = useMemo(() => exchanges.filter((e) => !["completed", "declined", "cancelled"].includes(getExchangeStage(e, user?.uid))), [exchanges, user?.uid]);
  const waitingExchanges = useMemo(() => exchanges.filter((e) => ["pending_mine", "waiting_time", "waiting_place"].includes(getExchangeStage(e, user?.uid))), [exchanges, user?.uid]);
  const endedExchanges   = useMemo(() => exchanges.filter((e) => ["completed", "declined", "cancelled"].includes(getExchangeStage(e, user?.uid))), [exchanges, user?.uid]);

  const displayed = useMemo(() => {
    let list;
    if (activeFilter === "actifs")   list = activeExchanges;
    else if (activeFilter === "attente")  list = waitingExchanges;
    else if (activeFilter === "termines") list = endedExchanges;
    else list = exchanges;
    // Trier : action requise d'abord
    return [...list].sort((a, b) => getStageOrder(getExchangeStage(a, user?.uid)) - getStageOrder(getExchangeStage(b, user?.uid)));
  }, [activeFilter, activeExchanges, waitingExchanges, endedExchanges, exchanges, user?.uid]);

  const sectionLabel = activeFilter === "actifs"
    ? "Échanges actifs"
    : activeFilter === "attente"
    ? "En attente de réponse"
    : "Échanges terminés";

  if (authLoading || loading) {
    return (
      <>
        <TrocoPageHeader title="Trocs" subtitle="Tes échanges en cours." />
        <div className="flex items-center justify-center py-16 text-[13px] font-bold text-[#94a3b8]">
          Chargement…
        </div>
      </>
    );
  }

  return (
    <>
      <TrocoPageHeader title="Trocs" subtitle="Tes échanges en cours." />

      {exchanges.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[#DDE8E4] bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FAF7] text-[#22C58B]">
            <Repeat2 size={22} strokeWidth={2.2} />
          </div>
          <p className="text-[16px] font-black text-[#17212B]">Aucun troc pour l'instant</p>
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#6F7782]">
            Quand tu proposes ou reçois un échange, il apparaîtra ici.
          </p>
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="mt-5 rounded-full bg-[#22C58B] px-6 py-3 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(34,197,139,0.25)]"
          >
            Explorer les objets
          </button>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Chips filtre */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip
              active={activeFilter === "actifs"}
              icon={Repeat2}
              label="Actifs"
              count={activeExchanges.length}
              onClick={() => setFilter("actifs")}
            />
            <FilterChip
              active={activeFilter === "attente"}
              icon={Clock}
              label="En attente"
              count={waitingExchanges.length}
              onClick={() => setFilter("attente")}
            />
            <FilterChip
              active={activeFilter === "termines"}
              icon={CheckCircle2}
              label="Terminés"
              count={endedExchanges.length}
              onClick={() => setFilter("termines")}
            />
          </div>

          {/* Titre section */}
          <p className="text-[13px] font-bold text-[#6F7782]">
            {sectionLabel}
          </p>

          {/* Cartes */}
          {displayed.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#E7ECEB] bg-white p-6 text-center">
              <p className="text-[13px] font-bold text-[#6F7782]">Aucun échange dans cette catégorie.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeFilter}
                className="grid gap-4 lg:grid-cols-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {displayed.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ExchangeCard exchange={e} items={items} currentUserId={user.uid} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Conseil Troco */}
          <button
            type="button"
            onClick={() => navigate("/add")}
            className="flex w-full items-center gap-3 rounded-[18px] border border-[#E7ECEB] bg-white px-4 py-4 text-left shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0FAF7] text-[#22C58B]">
              <Lightbulb size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-[#17212B]">Conseil Troco</p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#6F7782]">
                Ajoute d'autres objets pour multiplier tes opportunités d'échange !
              </p>
            </div>
            <ArrowRight size={15} strokeWidth={2.2} className="shrink-0 text-[#94a3b8]" />
          </button>
        </div>
      )}
    </>
  );
}
