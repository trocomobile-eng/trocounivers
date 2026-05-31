import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Repeat2,
  Search,
  ShieldCheck,
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
import { TrocoInput } from "../components/ui";
import { formatShortDate, getDisplayItemType, getItemImage } from "../utils/format";

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function shortName(value = "") {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Utilisateur";
  if (cleaned.includes("@")) return cleaned.split("@")[0];

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;

  return `${parts[0]} ${parts[1]?.charAt(0) || ""}.`;
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

function getMainItemIds(exchange) {
  return unique([
    exchange?.requestedItemId,
    exchange?.itemId,
    exchange?.targetItemId,
    ...(exchange?.offeredItemIds || []),
    ...(exchange?.offeredItemsIds || []),
    exchange?.offeredItemId,
    exchange?.proposedItemId,
  ]);
}

async function loadItemsForExchange(exchange) {
  const ids = getMainItemIds(exchange).slice(0, 2);

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

function lastMessage(exchange) {
  const messages = exchange?.chatMessages || [];

  if (!messages.length) {
    if (exchange?.needsAttentionFor) return "Une action est nécessaire sur ce troc.";
    if (exchange?.chatOpen || exchange?.chatOpened) return "Discussion ouverte pour organiser la rencontre.";
    return "Aucun message pour l’instant.";
  }

  return messages[messages.length - 1]?.text || "Message";
}

function lastMessageTime(exchange) {
  const messages = exchange?.chatMessages || [];
  const last = messages[messages.length - 1];

  return (
    formatShortDate(last?.createdAt) ||
    formatShortDate(exchange?.updatedAt) ||
    ""
  );
}

function getStatus(exchange, currentUserId) {
  const needsAttention = exchange?.needsAttentionFor === currentUserId;
  const status = exchange?.status || "";

  if (needsAttention) {
    if (exchange.notificationType === "availability_proposed") {
      return { label: "Disponibilités reçues", tone: "sky", icon: CalendarDays };
    }

    if (exchange.notificationType === "place_proposed") {
      return { label: "Lieu proposé", tone: "emerald", icon: MapPin };
    }

    if (exchange.notificationType === "trade_confirmation_pending") {
      return { label: "Confirmer le troc", tone: "emerald", icon: CheckCircle2 };
    }

    if (exchange.notificationType === "extra_item_requested") {
      return { label: "Objet en plus demandé", tone: "orange", icon: Repeat2 };
    }

    return { label: "Action requise", tone: "rose", icon: Bell };
  }

  if (status === "completed") return { label: "Troc terminé", tone: "emerald", icon: CheckCircle2 };
  if (status === "meeting_confirmed" || exchange.meetingConfirmed) return { label: "Rencontre confirmée", tone: "emerald", icon: ShieldCheck };
  if (status === "time_confirmed") return { label: "Horaire validé", tone: "sky", icon: Clock3 };
  if (status === "accepted") return { label: "Troc accepté", tone: "emerald", icon: Repeat2 };

  return { label: "Troc en cours", tone: "slate", icon: MessageCircle };
}

function toneClasses(tone) {
  const tones = {
    emerald: "bg-[#EAF7EF] text-[#166F4D] border-[#D6EEE0]",
    sky: "bg-[#EAF5FB] text-[#246B8A] border-[#D9ECF4]",
    orange: "bg-[#F9EFE0] text-[#A06026] border-[#F1E1C9]",
    rose: "bg-[#F8EDEE] text-[#9A4050] border-[#EED6DA]",
    slate: "bg-[#F1F3F3] text-slate-500 border-[#E4EAEA]",
  };

  return tones[tone] || tones.slate;
}

function ConversationCard({ exchange, itemMap, currentUserId, selected }) {
  const otherName = getOtherName(exchange, currentUserId);
  const itemIds = getMainItemIds(exchange);
  const items = itemIds.map((id) => itemMap[id]).filter(Boolean);
  const mainItem = items[0];
  const secondItem = items[1];

  const image =
    getItemImage(mainItem) ||
    exchange.requestedItemImage ||
    exchange.offeredItemImage ||
    "";

  const secondImage = getItemImage(secondItem) || "";

  const title =
    getDisplayItemType(mainItem) ||
    exchange.requestedItemTitle ||
    exchange.offeredItemTitle ||
    "Troc en cours";

  const status = getStatus(exchange, currentUserId);
  const StatusIcon = status.icon;
  const unread = exchange.needsAttentionFor === currentUserId;

  return (
    <Link
      to={`/exchanges/${exchange.id}/chat`}
      className={[
        "troco-row-card group block w-full p-3 text-left active:scale-[0.985]",
        selected ? "is-active" : "",
      ].join(" ")}
    >
      <div className="flex gap-3">
        <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[20px] bg-[#F4F8F6]">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
              💬
            </div>
          )}

          {secondImage && (
            <span className="absolute bottom-1 right-1 h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-100">
              <img src={secondImage} alt="" className="h-full w-full object-cover" />
            </span>
          )}

          {unread && (
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#E98B61]" />
          )}
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold tracking-[-0.025em] text-[#102033]">
                {shortName(otherName)}
              </p>

              <p className="mt-0.5 truncate text-[12px] font-bold text-[#315F51]">
                {title}
              </p>
            </div>

            <p className="shrink-0 text-[11px] font-semibold text-slate-400">
              {lastMessageTime(exchange)}
            </p>
          </div>

          <p
            className={[
              "mt-2 line-clamp-2 text-[13.5px] leading-snug",
              unread ? "font-extrabold text-[#263A43]" : "font-medium text-slate-500",
            ].join(" ")}
          >
            {lastMessage(exchange)}
          </p>

          <span
            className={[
              "mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
              toneClasses(status.tone),
            ].join(" ")}
          >
            <StatusIcon size={13} strokeWidth={2.3} />
            {status.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ConversationPreview({ exchange, itemMap, currentUserId }) {
  if (!exchange) {
    return (
      <section className="hidden min-h-[560px] flex-1 rounded-[20px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF7F2] text-4xl">
          💬
        </div>

        <h2 className="mt-5 text-[28px] font-extrabold tracking-[-0.045em] text-[#102033]">
          Sélectionne une discussion
        </h2>

        <p className="mt-2 max-w-sm text-center text-sm font-medium leading-relaxed text-slate-500">
          Tu verras ici le contexte du troc, l’action à faire et le dernier message.
        </p>
      </section>
    );
  }

  const otherName = getOtherName(exchange, currentUserId);
  const status = getStatus(exchange, currentUserId);
  const StatusIcon = status.icon;
  const itemIds = getMainItemIds(exchange);
  const items = itemIds.map((id) => itemMap[id]).filter(Boolean);
  const first = items[0];
  const second = items[1];

  return (
    <section className="hidden min-h-[560px] flex-1 rounded-[20px] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.07)] lg:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="troco-page-eyebrow">Discussion</p>

          <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.055em] text-[#102033]">
            Avec {shortName(otherName)}
          </h2>

          <span
            className={[
              "mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-extrabold",
              toneClasses(status.tone),
            ].join(" ")}
          >
            <StatusIcon size={14} strokeWidth={2.3} />
            {status.label}
          </span>
        </div>

        <Link
          to={`/exchanges/${exchange.id}/chat`}
          className="troco-btn troco-btn-primary"
        >
          Ouvrir
        </Link>
      </div>

      <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {[first, second].map((item, index) => {
          const image = getItemImage(item);
          const title = getDisplayItemType(item) || (index === 0 ? "Objet demandé" : "Objet proposé");

          return (
            <div key={index} className="overflow-hidden rounded-[24px] border border-[#EEF5F1] bg-white">
              <div className="aspect-[1.15/0.9] bg-[#F4F8F6]">
                {image ? (
                  <img src={image} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">
                    📦
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="truncate text-[17px] font-extrabold text-[#102033]">
                  {title}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF7F2] text-[#08755C]">
          ↔
        </div>
      </div>

      <div className="mt-6 rounded-[24px] bg-[#F8FCFA] p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
          Dernier message
        </p>

        <p className="mt-2 text-[16px] font-semibold leading-relaxed text-[#40545B]">
          {lastMessage(exchange)}
        </p>
      </div>

      {exchange.needsAttentionFor === currentUserId && (
        <Link
          to={`/exchanges/${exchange.id}`}
          className="troco-btn troco-btn-primary mt-5 h-[54px] w-full"
        >
          Voir l’action à faire
          <ArrowRight size={18} />
        </Link>
      )}
    </section>
  );
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchanges, setExchanges] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedExchangeId, setSelectedExchangeId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return undefined;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return undefined;
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

        const conversations = list.filter((exchange) => {
          const hasMessages = (exchange.chatMessages || []).length > 0;
          const chatOpen =
            exchange.chatOpen ||
            exchange.chatOpened ||
            exchange.status === "chat_open" ||
            exchange.status === "meeting_confirmed" ||
            exchange.status === "completed" ||
            exchange.availabilityStatus === "chat_open" ||
            exchange.availabilityStatus === "failed_chat" ||
            exchange.availability?.status === "chat_open" ||
            exchange.needsAttentionFor === user.uid;

          return hasMessages || chatOpen;
        });

        conversations.sort((a, b) => {
          const aDate = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
          const bDate = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
          return bDate - aDate;
        });

        setExchanges(conversations);
        setSelectedExchangeId((current) => current || conversations[0]?.id || "");

        const allItems = {};
        await Promise.all(
          conversations.map(async (exchange) => {
            const items = await loadItemsForExchange(exchange);
            items.forEach((item) => {
              allItems[item.id] = item;
            });
          })
        );

        setItemMap(allItems);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur messages :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, navigate]);

  const filteredExchanges = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exchanges;

    return exchanges.filter((exchange) => {
      const other = getOtherName(exchange, user?.uid).toLowerCase();
      const text = lastMessage(exchange).toLowerCase();
      return other.includes(q) || text.includes(q);
    });
  }, [exchanges, search, user?.uid]);

  const selectedExchange =
    filteredExchanges.find((exchange) => exchange.id === selectedExchangeId) ||
    filteredExchanges[0] ||
    null;

  return (
    <>
      <TrocoPageHeader
        user={user}
        eyebrow="Messages"
        title="Messages"
        subtitle="Tes discussions liées aux trocs en cours."
        compact
        showNotifications={false}
        showAvatar={false}
      />

      <section className="flex gap-6">
        <div className="w-full max-w-sm shrink-0">
          <div className="mb-4">
            <TrocoInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une discussion..."
              icon={<Search size={18} strokeWidth={2.2} />}
              className="w-full"
              inputClassName="text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {loading ? (
            <div className="rounded-[20px] bg-white p-6 text-center text-sm font-medium text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
              Chargement des messages...
            </div>
          ) : filteredExchanges.length === 0 ? (
            <div className="rounded-[20px] bg-white p-7 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
              <div className="mb-3 text-4xl">💬</div>

              <p className="text-lg font-extrabold text-[#102033]">
                Aucun message pour l’instant
              </p>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Les discussions apparaîtront ici quand un échange aura besoin d’être finalisé par message.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExchanges.map((exchange) => (
                <ConversationCard
                  key={exchange.id}
                  exchange={exchange}
                  itemMap={itemMap}
                  currentUserId={user.uid}
                  selected={selectedExchange?.id === exchange.id}
                />
              ))}
            </div>
          )}
        </div>

        <ConversationPreview
          exchange={selectedExchange}
          itemMap={itemMap}
          currentUserId={user?.uid}
        />
      </section>
    </>
  );
}
