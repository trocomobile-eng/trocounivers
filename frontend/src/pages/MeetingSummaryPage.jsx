import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Coffee,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { TrocoCard, TrocoButton, TrocoPill } from "../components/ui";

import {
  getDisplayItemType,
  getDisplayItemDetails,
  getItemImage,
} from "../utils/format";

function clean(value = "") {
  return String(value || "").trim();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function shortName(value = "") {
  const cleaned = clean(value);

  if (!cleaned) return "Utilisateur";
  if (cleaned.includes("@")) return cleaned.split("@")[0];

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function getInitial(name = "") {
  return clean(name).charAt(0).toUpperCase() || "?";
}

function normalizePhone(phone = "") {
  return clean(phone).replace(/\s+/g, "");
}

function displayPhone(phone = "") {
  const cleaned = normalizePhone(phone);

  if (!cleaned) return "";

  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return cleaned.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }

  return cleaned;
}

function getProfileName(profile, fallback = "") {
  return (
    clean(profile?.displayName) ||
    clean(profile?.username) ||
    clean(profile?.name) ||
    clean(fallback) ||
    "Utilisateur"
  );
}

function getProfilePhoto(profile, fallback = "") {
  return (
    clean(profile?.avatarUrl) ||
    clean(profile?.photoURL) ||
    clean(profile?.photoUrl) ||
    clean(profile?.profilePhoto) ||
    clean(profile?.imageUrl) ||
    clean(fallback) ||
    ""
  );
}

function getProfilePhone(profile, fallback = "") {
  return (
    clean(profile?.phone) ||
    clean(profile?.phoneNumber) ||
    clean(profile?.mobile) ||
    clean(profile?.telephone) ||
    clean(fallback) ||
    ""
  );
}

function getExchangeFallbackName(exchange, side) {
  if (side === "sender") {
    return (
      exchange?.senderName ||
      exchange?.senderDisplayName ||
      exchange?.senderEmail ||
      "Utilisateur"
    );
  }

  return (
    exchange?.receiverName ||
    exchange?.receiverDisplayName ||
    exchange?.receiverEmail ||
    "Utilisateur"
  );
}

function getExchangeFallbackPhoto(exchange, side) {
  if (side === "sender") {
    return (
      exchange?.senderPhotoURL ||
      exchange?.senderAvatar ||
      exchange?.senderUserPhoto ||
      exchange?.senderProfilePhoto ||
      ""
    );
  }

  return (
    exchange?.receiverPhotoURL ||
    exchange?.receiverAvatar ||
    exchange?.receiverUserPhoto ||
    exchange?.receiverProfilePhoto ||
    ""
  );
}

function getExchangeFallbackPhone(exchange, side) {
  if (side === "sender") {
    return exchange?.senderPhone || exchange?.senderUserPhone || "";
  }

  return exchange?.receiverPhone || exchange?.receiverUserPhone || "";
}

function buildUser(profile, exchange, side) {
  return {
    id: side === "sender" ? exchange?.senderId : exchange?.receiverId,
    name: getProfileName(profile, getExchangeFallbackName(exchange, side)),
    photo: getProfilePhoto(profile, getExchangeFallbackPhoto(exchange, side)),
    phone: getProfilePhone(profile, getExchangeFallbackPhone(exchange, side)),
  };
}

function formatAvailability(value) {
  if (!value) return "Horaire confirmé";
  if (typeof value === "string") return value;

  return (
    value.label ||
    [value.dayLabel || value.day, value.time].filter(Boolean).join(" · ") ||
    "Horaire confirmé"
  );
}

function splitAvailability(value) {
  const formatted = formatAvailability(value);

  if (!value || typeof value === "string") {
    const parts = formatted.split("·").map((part) => part.trim());

    return {
      date: parts[0] || formatted,
      time: parts[1] || "",
    };
  }

  return {
    date: value.dayLabel || value.day || formatted,
    time: value.time || "",
  };
}

function formatPlace(place) {
  if (!place) return "Lieu confirmé";
  return place.title || place.name || "Lieu confirmé";
}

function formatPlaceAddress(place) {
  if (!place) return "";
  return place.address || place.location || place.subtitle || "";
}

function getStoredExchangeId() {
  try {
    return (
      sessionStorage.getItem("troco:lastMeetingExchangeId") ||
      localStorage.getItem("troco:lastMeetingExchangeId") ||
      ""
    );
  } catch {
    return "";
  }
}

function storeExchangeId(exchangeId) {
  if (!exchangeId) return;

  try {
    sessionStorage.setItem("troco:lastMeetingExchangeId", exchangeId);
    localStorage.setItem("troco:lastMeetingExchangeId", exchangeId);
  } catch {
    // no-op
  }
}

function getRequestedItemId(exchange) {
  return (
    exchange?.requestedItemId ||
    exchange?.itemId ||
    exchange?.targetItemId ||
    exchange?.requestedItem?.id ||
    ""
  );
}

function getOfferedItemIds(exchange) {
  return unique([
    ...(exchange?.finalOfferedItemIds || []),
    ...(exchange?.offeredItemIds || []),
    ...(exchange?.offeredItemsIds || []),
    ...(exchange?.selectedItemIds || []),
    exchange?.offeredItemId,
    exchange?.proposedItemId,
    ...(exchange?.proposedItemIds || []),
    exchange?.offeredItem?.id,
  ]);
}

function fallbackItem(exchange, type) {
  if (type === "requested") {
    return {
      id: "requested-fallback",
      title:
        exchange?.requestedItemTitle ||
        exchange?.itemTitle ||
        exchange?.targetItemTitle ||
        "Objet demandé",
      imageUrl:
        exchange?.requestedItemImage ||
        exchange?.itemImage ||
        exchange?.targetItemImage ||
        "",
      condition:
        exchange?.requestedItemCondition ||
        exchange?.itemCondition ||
        "Très bon état",
    };
  }

  return {
    id: "offered-fallback",
    title:
      exchange?.offeredItemTitle ||
      exchange?.proposedItemTitle ||
      "Objet proposé",
    imageUrl:
      exchange?.offeredItemImage ||
      exchange?.proposedItemImage ||
      "",
    condition:
      exchange?.offeredItemCondition ||
      exchange?.proposedItemCondition ||
      "Très bon état",
  };
}

async function loadUserProfile(userId) {
  if (!userId) return null;

  try {
    const snapshot = await getDoc(doc(db, "users", userId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    console.error("Erreur chargement profil :", userId, error);
    return null;
  }
}

async function loadItem(itemId) {
  if (!itemId) return null;

  try {
    const snapshot = await getDoc(doc(db, "items", itemId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    console.error("Erreur chargement objet :", itemId, error);
    return null;
  }
}

async function loadLatestMeetingExchange(userId) {
  if (!userId) return null;

  const q = query(
    collection(db, "exchanges"),
    where("participants", "array-contains", userId)
  );

  const snapshot = await getDocs(q);

  const exchanges = snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((exchange) => {
      return (
        exchange.status === "meeting_confirmed" ||
        exchange.status === "meeting_scheduled" ||
        exchange.status === "time_confirmed" ||
        exchange.selectedPlace ||
        exchange.meetingConfirmed
      );
    })
    .sort((a, b) => {
      const aDate = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
      const bDate = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
      return bDate - aDate;
    });

  return exchanges[0] || null;
}

function Stepper() {
  const steps = ["Troc accepté", "Horaire", "Lieu", "Rencontre"];

  return (
    <TrocoCard variant="plain" className="rounded-[28px] border border-white/60 bg-white/74 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] backdrop-blur-lg">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
        Parcours guidé
      </p>

      <h1 className="mt-2 text-[30px] font-black leading-[0.96] tracking-[-0.055em] text-[#081225] lg:text-[40px]">
        Rencontre confirmée
      </h1>

      <p className="mt-3 max-w-2xl text-[14px] font-semibold leading-relaxed text-slate-500">
        Troco guide l’échange étape par étape pour transformer le troc en vraie rencontre locale.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step}
            className="flex items-center gap-2 rounded-full border border-emerald-100/70 bg-emerald-50/80 px-3 py-2 text-[12px] font-black text-[#0f8f7f]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#19B98F] text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            {step}
          </div>
        ))}
      </div>
    </TrocoCard>
  );
}

function DetailLine({ icon: Icon, label, value }) {
  return (
    <TrocoCard variant="plain" className="flex items-center gap-3 rounded-[20px] bg-white/58 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-[#0f9f9a]">
        <Icon size={17} strokeWidth={2.3} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[14px] font-black text-[#081225]">
          {value || "À confirmer"}
        </p>
      </div>
    </TrocoCard>
  );
}

function ProfileAvatar({ name, photo, label, phone }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-cyan-400 to-emerald-400 text-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-black">
            {getInitial(name)}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[16px] font-black text-[#081225]">
          {shortName(name)}
        </p>

        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#0f9f9a]">
          {label}
        </p>

        {phone && (
          <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-500">
            {displayPhone(phone)}
          </p>
        )}
      </div>
    </div>
  );
}

function MiniUserBadge({ user }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/74 px-2.5 py-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="h-6 w-6 overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-white">
        {user.photo ? (
          <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-black">
            {getInitial(user.name)}
          </div>
        )}
      </div>
      <span className="max-w-[90px] truncate text-[11px] font-black text-slate-700">
        {shortName(user.name)}
      </span>
    </div>
  );
}

function ObjectCard({ item, user, label }) {
  const title = getDisplayItemType(item) || item?.title || item?.itemType || "Objet";
  const details = getDisplayItemDetails(item) || item?.category || "";
  const image = getItemImage(item) || item?.imageUrl || item?.photoUrl || item?.images?.[0] || "";
  const condition = item?.condition || item?.conditionLabel || item?.state || "Très bon état";

  return (
    <TrocoCard variant="plain" className="overflow-hidden rounded-[28px] border border-white/80 bg-white/82 shadow-[0_12px_34px_rgba(15,23,42,0.055)] backdrop-blur-xl">
      <div className="relative aspect-[1.15/0.86] overflow-hidden bg-slate-100">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-50 to-emerald-50 text-5xl">
            📦
          </div>
        )}

        <div className="absolute left-3 top-3">
          <MiniUserBadge user={user} />
        </div>

        <div className="absolute bottom-3 left-3 rounded-full bg-white/82 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#0f9f9a] backdrop-blur-md">
          {label}
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate text-[19px] font-black leading-tight tracking-[-0.04em] text-[#081225]">
          {title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-black text-emerald-700">
            {condition}
          </span>

          {details && (
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[12px] font-black text-slate-500">
              {details}
            </span>
          )}
        </div>
      </div>
    </TrocoCard>
  );
}

function ExchangedObjects({ requestedItem, offeredItem, sender, receiver, currentUserId, exchange }) {
  const senderIsCurrentUser = exchange?.senderId === currentUserId;

  const leftItem = senderIsCurrentUser ? offeredItem : requestedItem;
  const rightItem = senderIsCurrentUser ? requestedItem : offeredItem;

  const leftUser = senderIsCurrentUser ? sender : receiver;
  const rightUser = senderIsCurrentUser ? receiver : sender;

  return (
    <TrocoCard as="section" variant="plain" className="rounded-[30px] border border-white/70 bg-white/60 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)] backdrop-blur-xl lg:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
        Objets échangés
      </p>

      <h2 className="mt-2 text-[28px] font-black leading-[0.98] tracking-[-0.055em] text-[#081225] lg:text-[34px]">
        Ce que vous allez échanger
      </h2>

      <div className="mt-5 grid items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <ObjectCard
          item={leftItem}
          user={leftUser}
          label={senderIsCurrentUser ? "Vous proposez" : "Votre objet"}
        />

        <div className="flex justify-center pt-0 sm:pt-28">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-100 bg-white text-xl font-black text-[#0f9f9a] shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            ⇄
          </span>
        </div>

        <ObjectCard
          item={rightItem}
          user={rightUser}
          label={senderIsCurrentUser ? "Vous recevez" : "Il vous propose"}
        />
      </div>
    </TrocoCard>
  );
}

function MeetingCard({ place, date, time, sender, receiver }) {
  return (
    <TrocoCard as="section" variant="plain" className="overflow-hidden rounded-[30px] border border-white/60 bg-white/76 shadow-[0_8px_30px_rgba(15,23,42,0.035)] backdrop-blur-lg">
      <div className="relative h-40 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.24),transparent_28%),radial-gradient(circle_at_82%_30%,rgba(34,211,238,0.24),transparent_32%),linear-gradient(135deg,#ecfeff,#f0fdf4)]">
        <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0f9f9a] shadow-[0_12px_28px_rgba(15,23,42,0.10)]">
          <MapPin size={28} strokeWidth={2.4} />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <MiniUserBadge user={sender} />
          <MiniUserBadge user={receiver} />
        </div>
      </div>

      <div className="p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
          Carte de rencontre
        </p>

        <p className="mt-2 text-[19px] font-black tracking-[-0.035em] text-[#081225]">
          {formatPlace(place)}
        </p>

        {formatPlaceAddress(place) && (
          <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
            {formatPlaceAddress(place)}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[18px] bg-emerald-50/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              Date
            </p>
            <p className="mt-1 text-[14px] font-black text-[#081225]">{date}</p>
          </div>

          <div className="rounded-[18px] bg-emerald-50/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              Heure
            </p>
            <p className="mt-1 text-[14px] font-black text-[#081225]">{time || "Confirmée"}</p>
          </div>
        </div>
      </div>
    </TrocoCard>
  );
}

function MeetingIllustration() {
  return (
    <TrocoCard variant="plain" className="relative overflow-hidden rounded-[30px] border border-white/60 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-cyan-200/35 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/78 text-[#0f9f9a] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <Coffee size={28} strokeWidth={2.2} />
        </div>

        <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 via-cyan-200 to-emerald-200" />

        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/78 text-[#0f9f9a] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <Sparkles size={28} strokeWidth={2.2} />
        </div>
      </div>

      <p className="relative mt-5 text-[15px] font-black text-[#081225]">
        Un lieu clair, un horaire validé, un échange plus simple.
      </p>

      <p className="relative mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
        Troco transforme la négociation en vraie rencontre locale.
      </p>
    </TrocoCard>
  );
}

export default function MeetingSummaryPage() {
  const { id, exchangeId } = useParams();
  const [searchParams] = useSearchParams();

  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const exchangeIdFromState =
    location.state?.exchangeId ||
    location.state?.exchange?.id ||
    "";

  const exchangeIdFromQuery =
    searchParams.get("exchangeId") ||
    searchParams.get("id") ||
    "";

  const resolvedExchangeId = useMemo(() => {
    return (
      exchangeId ||
      id ||
      exchangeIdFromState ||
      exchangeIdFromQuery ||
      getStoredExchangeId()
    );
  }, [exchangeId, id, exchangeIdFromState, exchangeIdFromQuery]);

  const [exchange, setExchange] = useState(location.state?.exchange || null);
  const [senderProfile, setSenderProfile] = useState(null);
  const [receiverProfile, setReceiverProfile] = useState(null);
  const [requestedItem, setRequestedItem] = useState(null);
  const [offeredItem, setOfferedItem] = useState(null);
  const [loading, setLoading] = useState(!location.state?.exchange);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadExchange() {
      setLoading(true);

      try {
        let loadedExchange = null;

        if (resolvedExchangeId) {
          const snapshot = await getDoc(doc(db, "exchanges", resolvedExchangeId));

          if (snapshot.exists()) {
            loadedExchange = {
              id: snapshot.id,
              ...snapshot.data(),
            };
          }
        }

        if (!loadedExchange) {
          loadedExchange = await loadLatestMeetingExchange(user.uid);
        }

        if (!loadedExchange) {
          setExchange(null);
          setSenderProfile(null);
          setReceiverProfile(null);
          setRequestedItem(null);
          setOfferedItem(null);
          return;
        }

        setExchange(loadedExchange);
        storeExchangeId(loadedExchange.id);

        const requestedItemId = getRequestedItemId(loadedExchange);
        const offeredItemId = getOfferedItemIds(loadedExchange)[0];

        const [sender, receiver, requested, offered] = await Promise.all([
          loadUserProfile(loadedExchange.senderId),
          loadUserProfile(loadedExchange.receiverId),
          loadItem(requestedItemId),
          loadItem(offeredItemId),
        ]);

        setSenderProfile(sender);
        setReceiverProfile(receiver);
        setRequestedItem(requested || fallbackItem(loadedExchange, "requested"));
        setOfferedItem(offered || fallbackItem(loadedExchange, "offered"));
      } catch (error) {
        console.error("Erreur meeting summary :", error);
        setExchange(null);
        setSenderProfile(null);
        setReceiverProfile(null);
        setRequestedItem(null);
        setOfferedItem(null);
      } finally {
        setLoading(false);
      }
    }

    loadExchange();
  }, [authLoading, navigate, resolvedExchangeId, user?.uid]);

  if (authLoading || loading) {
    return (
      <main className="troco-page-bg min-h-screen px-5 pb-32 pt-[max(16px,env(safe-area-inset-top))] text-[#081225] lg:px-10 lg:pb-16 lg:pt-10">
        <div className="mx-auto w-full max-w-5xl rounded-[28px] bg-white/74 p-7 text-center text-sm font-bold text-slate-500 shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
          Chargement de la rencontre...
        </div>
      </main>
    );
  }

  if (!exchange) {
    return (
      <main className="troco-page-bg min-h-screen px-5 pb-32 pt-[max(16px,env(safe-area-inset-top))] text-[#081225] lg:px-10 lg:pb-16 lg:pt-10">
        <div className="mx-auto w-full max-w-5xl">
          <TrocoButton variant="plain"
            onClick={() => navigate(-1)}
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/78 text-[#081225] shadow-[0_8px_24px_rgba(15,23,42,0.035)] backdrop-blur-lg"
            aria-label="Retour"
          >
            <ArrowLeft size={21} strokeWidth={2.4} />
          </TrocoButton>

          <div className="rounded-[28px] bg-white/74 p-7 text-center shadow-[0_8px_30px_rgba(15,23,42,0.035)] backdrop-blur-lg">
            <p className="text-lg font-black text-[#081225]">Rencontre introuvable.</p>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              Aucun troc confirmé n’a été trouvé. Retourne dans tes trocs pour ouvrir la bonne rencontre.
            </p>

            <TrocoButton variant="plain"
              onClick={() => navigate("/exchanges")}
              className="mt-5 rounded-full bg-gradient-to-r from-[#22C1C3] to-[#2ECC8A] px-5 py-3 text-sm font-black text-white"
            >
              Retour aux trocs
            </TrocoButton>
          </div>
        </div>

      </main>
    );
  }

  const sender = buildUser(senderProfile, exchange, "sender");
  const receiver = buildUser(receiverProfile, exchange, "receiver");

  const selectedAvailability =
    exchange.selectedAvailability ||
    exchange.availability?.selected ||
    exchange.selectedSlot ||
    null;

  const selectedPlace =
    exchange.selectedPlace ||
    exchange.meetingPlace ||
    exchange.place?.selected ||
    exchange.place ||
    null;

  const { date, time } = splitAvailability(selectedAvailability);

  const otherUser = exchange.senderId === user?.uid ? receiver : sender;
  const otherPhone = otherUser.phone;

  function confirmMeeting() {
    navigate(`/exchanges/${exchange.id}`, {
      state: {
        openValidation: true,
        exchange,
      },
    });
  }

  function openMessages() {
    navigate(`/exchanges/${exchange.id}/chat`);
  }

  function reportProblem() {
    navigate(`/exchanges/${exchange.id}/problem`);
  }

  return (
    <main className="troco-page-bg min-h-screen px-5 pb-32 pt-[max(16px,env(safe-area-inset-top))] text-[#081225] lg:px-10 lg:pb-16 lg:pt-10">
      <div className="mx-auto w-full max-w-6xl">
        <TrocoButton variant="plain"
          onClick={() => navigate(-1)}
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/78 text-[#081225] shadow-[0_8px_24px_rgba(15,23,42,0.035)] backdrop-blur-lg"
          aria-label="Retour"
        >
          <ArrowLeft size={21} strokeWidth={2.4} />
        </TrocoButton>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="space-y-5">
            <Stepper />

            <section className="rounded-[30px] border border-emerald-100/90 bg-emerald-50/58 p-5 shadow-[0_12px_34px_rgba(16,185,129,0.06)] backdrop-blur-xl lg:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                Rencontre confirmée
              </p>

              <h2 className="mt-2 text-[30px] font-black leading-[0.98] tracking-[-0.055em] text-[#081225] lg:text-[38px]">
                Tout est prêt pour votre rencontre ✨
              </h2>

              <p className="mt-3 text-[14px] font-semibold leading-relaxed text-slate-500">
                Le lieu et l’horaire sont prêts. Retrouvez-vous tranquillement, puis confirmez ensemble que le troc a bien eu lieu.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailLine icon={CalendarDays} label="Date" value={date} />
                <DetailLine icon={CalendarDays} label="Horaire" value={time} />
                <DetailLine icon={MapPin} label="Lieu" value={formatPlace(selectedPlace)} />
                <DetailLine
                  icon={Phone}
                  label="Contact"
                  value={displayPhone(otherPhone) || "Téléphone à renseigner"}
                />
              </div>
            </section>

            <ExchangedObjects
              requestedItem={requestedItem}
              offeredItem={offeredItem}
              sender={sender}
              receiver={receiver}
              currentUserId={user?.uid}
              exchange={exchange}
            />

            <section className="grid gap-3 rounded-[30px] border border-white/70 bg-white/60 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)] backdrop-blur-xl">
              <TrocoButton variant="plain"
                onClick={confirmMeeting}
                className="flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22C1C3] to-[#2ECC8A] text-[16px] font-black text-white shadow-[0_14px_30px_rgba(16,185,129,0.18)] transition hover:shadow-[0_18px_38px_rgba(16,185,129,0.24)] active:scale-[0.98]"
              >
                <CheckCircle2 size={20} />
                Confirmer que vous vous êtes rencontrés
              </TrocoButton>

              <TrocoButton variant="plain"
                onClick={openMessages}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/60 bg-white/70 text-[15px] font-black text-[#081225] shadow-[0_6px_20px_rgba(15,23,42,0.03)] backdrop-blur-md transition active:scale-[0.98]"
              >
                <MessageCircle size={18} />
                Ouvrir la messagerie
              </TrocoButton>

              {otherPhone && (
                <a
                  href={`tel:${normalizePhone(otherPhone)}`}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/60 bg-white/70 text-[15px] font-black text-[#081225] shadow-[0_6px_20px_rgba(15,23,42,0.03)] backdrop-blur-md transition active:scale-[0.98]"
                >
                  <Phone size={18} />
                  Appeler {shortName(otherUser.name)}
                </a>
              )}

              <TrocoButton variant="plain"
                onClick={reportProblem}
                className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white/45 text-[14px] font-black text-rose-500 transition active:scale-[0.98]"
              >
                <HelpCircle size={17} />
                Un problème avec la rencontre ?
              </TrocoButton>
            </section>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-8">
            <MeetingCard
              place={selectedPlace}
              date={date}
              time={time}
              sender={sender}
              receiver={receiver}
            />

            <MeetingIllustration />

            <section className="rounded-[28px] border border-white/60 bg-white/76 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] backdrop-blur-lg">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0f9f9a]">
                Participants
              </p>

              <div className="mt-4 space-y-4">
                <ProfileAvatar
                  name={sender.name}
                  photo={sender.photo}
                  phone={sender.phone}
                  label="Propose"
                />
                <div className="h-px bg-slate-100" />
                <ProfileAvatar
                  name={receiver.name}
                  photo={receiver.photo}
                  phone={receiver.phone}
                  label="Reçoit"
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-white/60 bg-white/76 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#0f9f9a]">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-[15px] font-black text-[#081225]">
                    Petit rappel sécurité
                  </p>

                  <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
                    Privilégie un lieu public, confirme l’horaire avant de partir et garde la conversation sur Troco.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

    </main>
  );
}
