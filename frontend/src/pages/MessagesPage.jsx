import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
    emerald: "bg-troco-primary-50 text-troco-primary-600 border-troco-primary-100",
    sky: "bg-[#EAF5FB] text-[#246B8A] border-[#D9ECF4]",
    orange: "bg-[#F9EFE0] text-[#A06026] border-[#F1E1C9]",
    rose: "bg-[#F8EDEE] text-[#9A4050] border-[#EED6DA]",
    slate: "bg-troco-bg text-troco-muted border-troco-border",
  };

  return tones[tone] || tones.slate;
}

function PersonAvatar({ name, photoURL, size = 48 }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover ring-2 ring-white shadow-soft"
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-troco-gradient text-[15px] font-black text-white shadow-glow"
      style={{ height: size, width: size }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function ConversationCard({ exchange, itemMap, currentUserId, selected }) {
  const otherName = getOtherName(exchange, currentUserId);
  const itemIds = getMainItemIds(exchange);
  const items = itemIds.map((id) => itemMap[id]).filter(Boolean);
  const mainItem = items[0];
  const secondItem = items[1];

  const otherPhoto = exchange.senderId === currentUserId
    ? (exchange.receiverPhotoURL || exchange.receiverAvatar || "")
    : (exchange.senderPhotoURL || exchange.senderAvatar || "");

  const image = getItemImage(mainItem) || exchange.requestedItemImage || "";
  const secondImage = getItemImage(secondItem) || exchange.offeredItemImage || "";

  const unread = exchange.needsAttentionFor === currentUserId;

  return (
    <Link
      to={`/exchanges/${exchange.id}/chat`}
      className={[
        "group block w-full rounded-troco-md bg-white p-3 shadow-soft transition active:scale-[0.985]",
        selected ? "ring-1 ring-troco-primary/40" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={otherName} photoURL={otherPhoto} size={48} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[14px] font-extrabold tracking-[-0.02em] text-troco-ink">
              {shortName(otherName)}
            </p>
            <p className="shrink-0 text-[11px] font-semibold text-troco-faint">
              {lastMessageTime(exchange)}
            </p>
          </div>

          <p
            className={[
              "mt-0.5 line-clamp-1 text-[12.5px] leading-snug",
              unread ? "font-bold text-troco-ink" : "font-medium text-troco-muted",
            ].join(" ")}
          >
            {lastMessage(exchange)}
          </p>

          {(image || secondImage) && (
            <div className="mt-2 flex items-center gap-1.5">
              <ItemMini src={image} />
              <Repeat2 size={11} strokeWidth={2.4} className="shrink-0 text-troco-primary" />
              <ItemMini src={secondImage} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {unread && <span className="h-2 w-2 rounded-full bg-troco-primary shadow-glow" />}
          <ChevronRight size={14} strokeWidth={2.3} className="text-troco-faint" />
        </div>
      </div>
    </Link>
  );
}

function ItemMini({ src }) {
  if (!src) {
    return <div className="h-7 w-7 shrink-0 rounded-[8px] bg-troco-primary-50" />;
  }
  return (
    <img
      src={src}
      alt=""
      className="h-7 w-7 shrink-0 rounded-[8px] object-cover"
    />
  );
}

function ConversationPreview({ exchange, itemMap, currentUserId }) {
  if (!exchange) {
    return (
      <section className="hidden min-h-[560px] flex-1 rounded-troco-md bg-white p-8 text-center shadow-soft lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-troco-primary-50 text-4xl">
          💬
        </div>

        <h2 className="mt-5 text-[28px] font-extrabold tracking-[-0.045em] text-troco-ink">
          Sélectionne une discussion
        </h2>

        <p className="mt-2 max-w-sm text-center text-sm font-medium leading-relaxed text-troco-muted">
          Tu verras ici le contexte du troc, l'action à faire et le dernier message.
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
    <section className="hidden min-h-[560px] flex-1 rounded-troco-md bg-white p-6 shadow-soft lg:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="troco-caption">Discussion</p>

          <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.055em] text-troco-ink">
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
          className="troco-primary-btn"
        >
          Ouvrir
        </Link>
      </div>

      <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {[first, second].map((item, index) => {
          const image = getItemImage(item);
          const title = getDisplayItemType(item) || (index === 0 ? "Objet demandé" : "Objet proposé");

          return (
            <div key={index} className="overflow-hidden rounded-troco-lg border border-troco-border bg-white">
              <div className="aspect-[1.15/0.9] bg-troco-primary-50">
                {image ? (
                  <img src={image} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl text-troco-faint">
                    📦
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="truncate text-[17px] font-extrabold text-troco-ink">
                  {title}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-troco-primary text-white shadow-glow">
          <Repeat2 size={18} strokeWidth={2.4} />
        </div>
      </div>

      <div className="mt-6 rounded-troco-lg bg-troco-primary-50 p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-troco-primary">
          Dernier message
        </p>

        <p className="mt-2 text-[16px] font-semibold leading-relaxed text-troco-ink">
          {lastMessage(exchange)}
        </p>
      </div>

      {exchange.needsAttentionFor === currentUserId && (
        <Link
          to={`/exchanges/${exchange.id}`}
          className="troco-primary-btn mt-5 flex h-[54px] w-full items-center justify-center gap-2"
        >
          Voir l'action à faire
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
              inputClassName="text-[15px] font-medium text-troco-ink placeholder:text-troco-faint"
            />
          </div>

          {loading ? (
            <div className="rounded-troco-md bg-white p-6 text-center text-sm font-medium text-troco-faint shadow-soft">
              Chargement des messages...
            </div>
          ) : filteredExchanges.length === 0 ? (
            <div className="rounded-troco-md bg-white p-7 text-center shadow-soft">
              <div className="mb-3 text-4xl">💬</div>

              <p className="text-lg font-extrabold text-troco-ink">
                Aucun message pour l'instant
              </p>

              <p className="mt-2 text-sm leading-relaxed text-troco-muted">
                Les discussions apparaîtront ici quand un échange aura besoin d'être finalisé par message.
              </p>
              <Link
                to="/exchanges"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-troco-primary px-5 py-2.5 text-[13px] font-black text-white shadow-glow"
              >
                Voir mes trocs
              </Link>
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
