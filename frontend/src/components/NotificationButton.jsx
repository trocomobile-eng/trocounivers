import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, MapPin, MessageCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { TrocoCard } from "./UI";

function clean(value = "") {
  return String(value || "").trim();
}

function shortName(value = "") {
  const cleaned = clean(value);
  if (!cleaned) return "quelqu’un";
  if (cleaned.includes("@")) return cleaned.split("@")[0];

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function getOtherName(exchange, userId) {
  if (!exchange || !userId) return "l’autre personne";

  if (exchange.senderId === userId) {
    return (
      exchange.receiverName ||
      exchange.receiverDisplayName ||
      exchange.receiverEmail ||
      "l’autre personne"
    );
  }

  return (
    exchange.senderName ||
    exchange.senderDisplayName ||
    exchange.senderEmail ||
    "l’autre personne"
  );
}

function getExchangeTitle(exchange) {
  return (
    exchange?.requestedItemTitle ||
    exchange?.itemTitle ||
    exchange?.targetItemTitle ||
    exchange?.offeredItemTitle ||
    exchange?.proposedItemTitle ||
    exchange?.title ||
    "Troc en cours"
  );
}

function getPreciseNotification(exchange, userId) {
  const otherName = shortName(getOtherName(exchange, userId));
  const title = getExchangeTitle(exchange);

  if (
    exchange?.availabilityOptions?.length > 0 &&
    exchange?.availabilityProposedBy !== userId &&
    !exchange?.selectedAvailability
  ) {
    return {
      icon: CalendarDays,
      tone: "cyan",
      title: `${otherName} propose des horaires`,
      text: `Réponds pour organiser : ${title}`,
      to: `/availability/${exchange.id}`,
    };
  }

  if (
    exchange?.placeOptions?.length > 0 &&
    exchange?.placeProposedBy !== userId &&
    !exchange?.selectedPlace
  ) {
    return {
      icon: MapPin,
      tone: "emerald",
      title: `${otherName} propose un lieu`,
      text: `Valide ou propose une alternative : ${title}`,
      to: "/choose-place",
      state: { exchangeId: exchange.id, exchange },
    };
  }

  if (exchange?.status === "chat_open" || exchange?.chatOpened || exchange?.chatOpen) {
    return {
      icon: MessageCircle,
      tone: "sky",
      title: "Message à finaliser",
      text: `Continue la discussion pour : ${title}`,
      to: `/exchanges/${exchange.id}/chat`,
    };
  }

  if (
    exchange?.status === "meeting_confirmed" ||
    exchange?.meetingConfirmed ||
    (exchange?.selectedAvailability && exchange?.selectedPlace)
  ) {
    return {
      icon: CheckCircle2,
      tone: "emerald",
      title: "Rencontre confirmée",
      text: `${title} est prêt à être organisé.`,
      to: `/exchanges/${exchange.id}/meeting`,
    };
  }

  return null;
}

function getNeedsAttention(exchange, userId) {
  if (!exchange || !userId) return false;

  if (
    exchange?.needsAttentionFor === userId ||
    (Array.isArray(exchange?.needsAttentionFor) && exchange.needsAttentionFor.includes(userId))
  ) {
    return true;
  }

  if (
    exchange?.availabilityOptions?.length > 0 &&
    exchange?.availabilityProposedBy !== userId &&
    !exchange?.selectedAvailability
  ) {
    return true;
  }

  if (
    exchange?.placeOptions?.length > 0 &&
    exchange?.placeProposedBy !== userId &&
    !exchange?.selectedPlace
  ) {
    return true;
  }

  return false;
}

function NotificationRow({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="flex w-full items-start gap-3 rounded-[20px] bg-white/68 p-3 text-left transition hover:bg-white/90 active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#0f9f9a]">
        <Icon size={18} strokeWidth={2.2} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black leading-tight text-[#081225]">
          {item.title}
        </span>

        <span className="mt-1 line-clamp-2 block text-[12.5px] font-medium leading-relaxed text-slate-500">
          {item.text}
        </span>
      </span>
    </button>
  );
}

export default function NotificationButton({ className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [exchanges, setExchanges] = useState([]);

  useEffect(() => {
    if (!user?.uid) {
      setExchanges([]);
      return undefined;
    }

    let mounted = true;

    async function load() {
      try {
        const q = query(
          collection(db, "exchanges"),
          where("participants", "array-contains", user.uid)
        );

        const snapshot = await getDocs(q);

        if (!mounted) return;

        setExchanges(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      } catch (error) {
        console.error("Erreur notifications :", error);
        if (mounted) setExchanges([]);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const notifications = useMemo(() => {
    return exchanges
      .filter((exchange) => getNeedsAttention(exchange, user?.uid))
      .map((exchange) => getPreciseNotification(exchange, user?.uid))
      .filter(Boolean)
      .slice(0, 6);
  }, [exchanges, user?.uid]);

  const count = notifications.length;

  function goToNotification(item) {
    setOpen(false);

    if (item.state) {
      navigate(item.to, { state: item.state });
      return;
    }

    navigate(item.to);
  }

  return (
    <div className={["relative", className].join(" ")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/66 text-[#24746f] shadow-[0_8px_20px_rgba(20,184,166,0.055)] backdrop-blur-md transition active:scale-95"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={2.05} />

        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[72px] z-50 mx-auto max-w-[520px]">
          <TrocoCard
            variant="plain"
            className="rounded-[30px] border border-white/80 bg-white/88 p-3 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between px-2 py-2">
              <div>
                <p className="text-[15px] font-black text-[#081225]">Notifications</p>
                <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                  {count > 0 ? "Actions liées à tes trocs" : "Rien à traiter pour l’instant"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {count === 0 ? (
                <div className="rounded-[22px] bg-emerald-50/70 p-4 text-[13px] font-semibold leading-relaxed text-[#0f766e]">
                  Tout est calme. Tes prochaines réponses apparaîtront ici.
                </div>
              ) : (
                notifications.map((item, index) => (
                  <NotificationRow
                    key={`${item.title}-${index}`}
                    item={item}
                    onNavigate={() => goToNotification(item)}
                  />
                ))
              )}
            </div>

            <Link
              to="/exchanges"
              onClick={() => setOpen(false)}
              className="mt-3 flex h-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#22c7e8] to-[#35d18f] text-[13px] font-black text-white shadow-[0_8px_18px_rgba(20,184,166,0.14)]"
            >
              Voir tous les trocs
            </Link>
          </TrocoCard>
        </div>
      )}
    </div>
  );
}
